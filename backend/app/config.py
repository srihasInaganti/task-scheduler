from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    JWT_SECRET_KEY: str
    DATABASE_URL: str = "sqlite:///./taskplacer.db"
    FRONTEND_URL: str = "http://localhost:5173"
    REDIRECT_URI: str = "http://localhost:8000/auth/callback"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore[call-arg]