from collections.abc import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator

from .config import get_settings

settings = get_settings()

EMBEDDING_DIMENSIONS = settings.embedding_dimensions


class EmbeddingVector(TypeDecorator):
    """Use pgvector in production and JSON vectors in local SQLite development."""

    impl = JSON
    cache_ok = True
    comparator_factory = Vector.comparator_factory

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Vector(EMBEDDING_DIMENSIONS))
        return dialect.type_descriptor(JSON())


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
# Serverless instances sit idle between requests and Neon closes idle connections,
# so test each pooled connection before reuse instead of failing the request.
engine = create_async_engine(database_url, echo=False, connect_args=postgres_connect_args, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        if conn.dialect.name == "postgresql":
            # Several Vercel instances can cold-start together. Serialize the
            # create_all / one-time FK upgrade so they cannot race each other.
            await conn.execute(text("SELECT pg_advisory_xact_lock(324671, 1)"))
            # Neon supports pgvector. Creating the extension before the ORM tables
            # makes a new deployment self-contained instead of relying on a manual
            # dashboard action.
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        # The MVP initially shipped without password columns. Keep existing local demo
        # databases usable while production deployments should use a real migration tool.
        await conn.run_sync(_migrate_user_columns)
        await conn.run_sync(_migrate_career_match_columns)
        if conn.dialect.name == "postgresql":
            await conn.run_sync(_migrate_habit_goal_foreign_key)
            # HNSW makes per-user cosine retrieval fast once the personal corpus grows.
            async with conn.begin_nested():
                await conn.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw "
                    "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
                ))


def _migrate_user_columns(connection) -> None:
    columns = {column["name"] for column in inspect(connection).get_columns("users")}
    if "password_hash" not in columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
    if "auth_provider" not in columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(32) DEFAULT 'password'"))


def _migrate_career_match_columns(connection) -> None:
    columns = {column["name"] for column in inspect(connection).get_columns("career_matches")}
    if "location" not in columns:
        connection.execute(text("ALTER TABLE career_matches ADD COLUMN location VARCHAR(255) DEFAULT ''"))


def _migrate_habit_goal_foreign_key(connection) -> None:
    """Upgrade existing Neon tables; create_all only applies the FK to new tables."""
    foreign_keys = inspect(connection).get_foreign_keys("habits")
    for foreign_key in foreign_keys:
        if foreign_key["constrained_columns"] != ["goal_id"]:
            continue
        ondelete = (foreign_key.get("options") or {}).get("ondelete") or ""
        if ondelete.upper() == "SET NULL":
            return
        name = foreign_key.get("name")
        if not name:
            raise RuntimeError("Cannot migrate an unnamed habits.goal_id foreign key.")
        quoted_name = connection.dialect.identifier_preparer.quote(name)
        connection.execute(text(f"ALTER TABLE habits DROP CONSTRAINT {quoted_name}"))
        connection.execute(text(
            "ALTER TABLE habits ADD CONSTRAINT habits_goal_id_fkey "
            "FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL"
        ))
        return
    connection.execute(text(
        "ALTER TABLE habits ADD CONSTRAINT habits_goal_id_fkey "
        "FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL"
    ))
