from collections.abc import Sequence

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """Busca sin distinguir mayúsculas, incluidas las dadas de baja (el nombre no se libera)."""
        stmt = select(Categoria).where(func.lower(Categoria.nombre) == nombre.strip().lower())
        return self.session.exec(stmt).first()

    def list_activas(self) -> Sequence[Categoria]:
        stmt = select(Categoria).where(col(Categoria.activo).is_(True)).order_by(Categoria.nombre)
        return self.session.exec(stmt).all()
