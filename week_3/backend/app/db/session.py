from typing import AsyncGenerator
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool
from app.config import settings

def create_engine_for_url(db_url: str) -> AsyncEngine:
    connect_args = {}
    engine_kwargs = {"echo": settings.DB_ECHO, "future": True}

    # Automatically adapt Render and standard PostgreSQL URLs to asyncpg
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("sqlitecloud://"):
        import logging
        logging.warning("SQLite Cloud does not support Async SQLAlchemy 2.0. Falling back to local SQLite database.")
        db_url = "sqlite+aiosqlite:///./maitreq.db"
    elif db_url.startswith("sqlite://") and not db_url.startswith("sqlite+aiosqlite://"):
        db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

    # Clean libpq query parameters (e.g. sslmode, channel_binding) for asyncpg compatibility
    if db_url.startswith("postgresql+asyncpg://") and "?" in db_url:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
        parsed = urlparse(db_url)
        qs = parse_qs(parsed.query)

        if "sslmode" in qs:
            sslmode = qs.pop("sslmode")[0]
            if sslmode in ("require", "verify-ca", "verify-full"):
                connect_args["ssl"] = "require"
        qs.pop("channel_binding", None)
        qs.pop("gssencmode", None)

        new_query = urlencode(qs, doseq=True)
        db_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))

    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if ":memory:" in db_url:
            engine_kwargs["poolclass"] = StaticPool

    if connect_args:
        engine_kwargs["connect_args"] = connect_args

    engine = create_async_engine(db_url, **engine_kwargs)

    # Enable SQLite Foreign Key support
    if db_url.startswith("sqlite"):
        @event.listens_for(engine.sync_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine

engine = create_engine_for_url(settings.DATABASE_URL)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
