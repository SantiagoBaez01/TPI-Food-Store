from collections.abc import Sequence
from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def list_by_usuario(
        self,
        usuario_id: int | None,
        *,
        estado: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, Sequence[Pedido]]:
        """Pedidos de un usuario (o de todos si usuario_id es None), del más nuevo al más viejo."""
        condiciones = []
        if usuario_id is not None:
            condiciones.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            condiciones.append(Pedido.estado == estado)

        total = self.session.exec(select(func.count()).select_from(Pedido).where(*condiciones)).one()
        items = self.session.exec(
            select(Pedido)
            .where(*condiciones)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        ).all()
        return total, items

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(select(Pedido.estado, func.count()).group_by(Pedido.estado)).all()
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)).one()

    def sum_total_by_estado(self, estado: str) -> float:
        total = self.session.exec(select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado)).one()
        return float(total)
