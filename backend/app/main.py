from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, tasks

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(tasks.router)


@app.get("/health")
def health():
    return {"status": "ok"}
