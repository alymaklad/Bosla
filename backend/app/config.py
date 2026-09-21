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

    database_url: str = "sqlite+aiosqlite:///./bosla.db"
    cors_origins: str = "http://localhost:5173"
    goal_planner_max_iterations: int = 3
    goal_planner_verify_links: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
