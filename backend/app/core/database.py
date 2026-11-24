"""Motor de base de datos, creación de tablas y fábrica de sesiones."""

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=_connect_args, pool_pre_ping=True)


def create_all_tables() -> None:
    """Crea las tablas de todos los modelos registrados (ver app/db/registry.py)."""
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Devuelve una sesión nueva. La abre y la cierra el Unit of Work."""
    return Session(engine)
