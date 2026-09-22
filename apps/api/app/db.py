from collections.abc import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings

settings = get_settings()


def _async_database_url(url: str) -> str:
    """Make standard Postgres URLs compatible with SQLAlchemy's async driver."""
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]
    if url.startswith("postgresql+asyncpg://"):
        parsed = urlsplit(url)
        # Neon URLs target libpq clients and include parameters (for example
        # ``sslmode`` and ``channel_binding``) that asyncpg does not accept.
        query = [(key, value) for key, value in parse_qsl(parsed.query) if key not in {"sslmode", "channel_binding"}]
        return urlunsplit(parsed._replace(query=urlencode(query)))
    return url


database_url = _async_database_url(settings.database_url)
postgres_connect_args = {"ssl": True} if database_url.startswith("postgresql+asyncpg://") else {}
engine = create_async_engine(database_url, echo=False, connect_args=postgres_connect_args)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # The MVP initially shipped without password columns. Keep existing local demo
        # databases usable while production deployments should use a real migration tool.
        await conn.run_sync(_migrate_user_columns)


def _migrate_user_columns(connection) -> None:
    columns = {column["name"] for column in inspect(connection).get_columns("users")}
    if "password_hash" not in columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
    if "auth_provider" not in columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(32) DEFAULT 'password'"))
