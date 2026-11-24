from collections.abc import Sequence

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def get_for_update(self, producto_id: int) -> Producto | None:
        """get_by_id con bloqueo de fila (SELECT ... FOR UPDATE en PostgreSQL).

        Evita que dos pedidos simultáneos descuenten el mismo stock. SQLite lo ignora.
        """
        stmt = select(Producto).where(Producto.id == producto_id).with_for_update()
        return self.session.exec(stmt).first()

    def search(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[int, Sequence[Producto]]:
        """Productos activos filtrados por nombre (sin distinguir mayúsculas), categoría y disponibilidad.

        Devuelve (total que cumple los filtros, página pedida).
        """
        condiciones = [col(Producto.activo).is_(True)]
        if search:
            condiciones.append(col(Producto.nombre).ilike(f"%{search.strip()}%"))
        if categoria_id is not None:
            condiciones.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            condiciones.append(col(Producto.disponible).is_(disponible))

        total = self.session.exec(select(func.count()).select_from(Producto).where(*condiciones)).one()
        items = self.session.exec(
            select(Producto).where(*condiciones).order_by(Producto.id).offset(skip).limit(limit)
        ).all()
        return total, items
