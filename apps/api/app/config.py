import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ai_provider: str = "anthropic"  # "anthropic" | "groq"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-5"

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    groq_research_model: str = "groq/compound"

    # Vercel's Neon integration provides POSTGRES_URL. DATABASE_URL remains
    # the explicit override for local development and other providers.
    database_url: str = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "sqlite+aiosqlite:///./bosla.db"
    cors_origins: str = "http://localhost:5173"
    goal_planner_max_iterations: int = 3
    goal_planner_verify_links: bool = True
    # Auth is deliberately application-owned: no provider secret ever reaches the web app.
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"


@lru_cache
def get_settings() -> Settings:
    return Settings()
