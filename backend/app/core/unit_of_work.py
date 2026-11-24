"""Unit of Work base: una sesión (y una transacción) por operación de negocio."""

from collections.abc import Callable
from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory as default_session_factory


class UnitOfWork:
    """Abre la sesión en __enter__ y hace commit (o rollback) y close en __exit__.

    Las subclases crean sus repositorios en `_init_repositories`, todos sobre la
    misma sesión, de modo que una operación de negocio es una única transacción.
    Ningún Service ni Router llama a session.commit(): lo hace solo este __exit__.
    """

    session: Session

    def __init__(self, session_factory: Callable[[], Session] = default_session_factory) -> None:
        self._session_factory = session_factory

    def __enter__(self) -> Self:
        self.session = self._session_factory()
        self._init_repositories(self.session)
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()

    def _init_repositories(self, session: Session) -> None:
        """Las subclases instancian aquí sus repositorios."""
