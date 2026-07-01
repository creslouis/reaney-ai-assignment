from collections.abc import AsyncGenerator
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models.base import Base

settings = get_settings()

_url = settings.database_url

# Supabase requires statement_cache_size=0 regardless of whether the
# direct (5432) or pooler (6543) connection string is used.
# Also always require SSL for Supabase.
connect_args: dict = {
    "statement_cache_size": 0,
    "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4().hex}__",
    "ssl": "require",
}

engine = create_async_engine(_url, echo=False, future=True, connect_args=connect_args)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
