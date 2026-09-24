import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ai_provider: str = "groq"  # "anthropic" | "groq"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-5"

    groq_api_key: str = ""
    # Comma-separated backup keys. The primary GROQ_API_KEY is tried first.
    groq_api_keys: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    # Comma-separated model fallbacks, tried after the primary model/key pool.
    groq_fallback_models: str = "llama-3.3-70b-versatile"
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
    google_sync_client_id: str = ""
    google_sync_client_secret: str = ""
    google_sync_redirect_uri: str = "http://localhost:8000/integrations/google/callback"
    google_token_encryption_key: str = ""
    google_calendar_id: str = "primary"
    google_tasks_list_id: str = "@default"
    google_sync_timezone: str = "Africa/Cairo"
    web_app_url: str = "http://localhost:5173"
    # Personal document retrieval uses a local, deterministic embedding by default.
    # This keeps the MVP usable without a second paid AI provider.
    embedding_dimensions: int = 384
    ocr_fallback_url: str = ""
    ocr_fallback_token: str = ""
    ocr_fallback_timeout_seconds: int = 60
    google_vision_api_key: str = ""
    github_token: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
