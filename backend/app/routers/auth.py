import hashlib
import logging
import secrets
import urllib.parse
from base64 import urlsafe_b64encode
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import UserResponse, UserSettings
from app.services.google_oauth import SCOPES

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory store for PKCE code verifiers keyed by OAuth state
_pkce_store: dict[str, str] = {}


def create_jwt(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.JWT_SECRET_KEY, algorithm="HS256")


def _generate_pkce():
    """Generate PKCE code_verifier and code_challenge."""
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


@router.get("/login")
def login():
    state = secrets.token_urlsafe(32)
    code_verifier, code_challenge = _generate_pkce()
    _pkce_store[state] = code_verifier

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return {"url": auth_url}


@router.get("/callback")
def callback(code: str, state: str = Query(default=""), db: Session = Depends(get_db)):
    # Retrieve the PKCE code_verifier for this state
    code_verifier = _pkce_store.pop(state, None)
    if not code_verifier:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.REDIRECT_URI,
        "grant_type": "authorization_code",
        "code_verifier": code_verifier,
    }
    token_resp = httpx.post("https://oauth2.googleapis.com/token", data=token_data)
    if token_resp.status_code != 200:
        logging.error("Google token exchange failed: %s", token_resp.text)
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_resp.text}")
    tokens = token_resp.json()
    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token")

    # Fetch user info from Google
    resp = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")
    info = resp.json()

    # Upsert user
    user = db.query(User).filter(User.google_id == info["id"]).first()
    if user is None:
        user = User(google_id=info["id"])
        db.add(user)

    user.email = info["email"]
    user.name = info["name"]
    user.picture_url = info.get("picture")
    user.access_token = access_token
    if refresh_token:
        user.refresh_token = refresh_token
    db.commit()
    db.refresh(user)

    token = create_jwt(user.id)
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={token}",
        status_code=307,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/settings", response_model=UserResponse)
def update_settings(
    body: UserSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.available_start_hour = body.available_start_hour
    current_user.available_end_hour = body.available_end_hour
    current_user.timezone = body.timezone
    if body.scheduling_mode is not None:
        current_user.scheduling_mode = body.scheduling_mode
    # focus_start_hour and focus_end_hour can be set to None to disable focus time
    current_user.focus_start_hour = body.focus_start_hour
    current_user.focus_end_hour = body.focus_end_hour
    if body.buffer_minutes is not None:
        current_user.buffer_minutes = body.buffer_minutes
    db.commit()
    db.refresh(current_user)
    return current_user
