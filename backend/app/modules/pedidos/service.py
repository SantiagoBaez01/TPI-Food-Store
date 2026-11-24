"""Reglas de negocio de pedidos (RN-01 a RN-06)."""

from datetime import datetime

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario


# ---- Excepciones de dominio -------------------------------------------------
class PedidoNoEncontrado(Exception):
    """404"""


class ProductoNoEncontrado(Exception):
    """404: el producto no existe o está dado de baja."""


class PedidoAjeno(Exception):
    """403: el pedido pertenece a otro usuario."""


class ReglaNegocio(Exception):
    """400: base de las violaciones de reglas de negocio."""


class ProductoRepetido(ReglaNegocio):
    pass


class ProductoNoDisponible(ReglaNegocio):
    pass


class StockInsuficiente(ReglaNegocio):
    pass


class TransicionInvalida(ReglaNegocio):
    pass


class PedidoNoCancelable(ReglaNegocio):
    pass


# ---- Máquina de estados (RN-02) ---------------------------------------------
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),  # terminal
    EstadoPedido.CANCELADO: set(),  # terminal
}


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # ---- helpers ------------------------------------------------------------
    @staticmethod
    def _obtener(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(f"Pedido {pedido_id} no encontrado")
        return pedido

    @staticmethod
    def _validar_transicion(actual: str, nuevo: EstadoPedido) -> None:
        estado_actual = EstadoPedido(actual)
        if nuevo not in TRANSICIONES[estado_actual]:
            if not TRANSICIONES[estado_actual]:
                raise TransicionInvalida(f"El pedido está {estado_actual.value}: es un estado terminal")
            raise TransicionInvalida(f"Transición inválida: {estado_actual.value} → {nuevo.value}")

    @staticmethod
    def _aplicar_estado(uow: PedidoUnitOfWork, pedido: Pedido, nuevo: EstadoPedido) -> None:
        """Cambia el estado; si es CANCELADO restituye el stock en la misma transacción (RN-03)."""
        if nuevo == EstadoPedido.CANCELADO:
            for linea in pedido.items:
                producto = uow.productos.get_by_id(linea.producto_id)
                if producto is not None:
                    producto.stock += linea.cantidad
                    uow.session.add(producto)
        pedido.estado = nuevo.value
        pedido.updated_at = datetime.now()
        uow.session.add(pedido)
        uow.session.flush()
        uow.session.refresh(pedido)

    # ---- casos de uso -------------------------------------------------------
    def crear(self, data: PedidoCreate, usuario: Usuario) -> PedidoRead:
        """RN-01: crea el pedido completo o no crea nada (una sola transacción)."""
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido("Un producto no puede repetirse en el pedido")

            pedido = Pedido(
                usuario_id=usuario.id or 0,
                estado=EstadoPedido.PENDIENTE.value,
                forma_pago=data.forma_pago.value,
                direccion_entrega=data.direccion_entrega.strip(),
                notas=data.notas,
                total=0,
            )
            uow.pedidos.add(pedido)

            total = 0.0
            for item in data.items:
                producto = uow.productos.get_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"Producto {item.producto_id} no encontrado")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"'{producto.nombre}' no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para '{producto.nombre}': "
                        f"disponible {producto.stock}, pedido {item.cantidad}"
                    )
                producto.stock -= item.cantidad
                uow.session.add(producto)

                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.pedidos.add_detalle(
                    DetallePedido(
                        pedido_id=pedido.id or 0,
                        producto_id=producto.id or 0,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.session.add(pedido)
            uow.session.flush()
            uow.session.refresh(pedido)
            return PedidoRead.model_validate(pedido)

    def listar(self, usuario: Usuario, *, estado: EstadoPedido | None, skip: int, limit: int) -> PedidosPaginados:
        """RN-04: el admin ve todos; el cliente, solo los suyos."""
        with self.uow as uow:
            usuario_id = None if usuario.role == "admin" else usuario.id
            total, items = uow.pedidos.list_by_usuario(
                usuario_id, estado=estado.value if estado else None, skip=skip, limit=limit
            )
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in items])

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, data: CambioEstado) -> PedidoRead:
        """Admin: avanza o cancela según la máquina de estados (RN-02, RN-03)."""
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            self._validar_transicion(pedido.estado, data.estado)
            self._aplicar_estado(uow, pedido, data.estado)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        """Dueño: cancela su propio pedido solo si está PENDIENTE (RN-03, RN-04)."""
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            if pedido.estado != EstadoPedido.PENDIENTE.value:
                raise PedidoNoCancelable(f"Solo se puede cancelar un pedido PENDIENTE (estado actual: {pedido.estado})")
            self._aplicar_estado(uow, pedido, EstadoPedido.CANCELADO)
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            inicio_hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE.value, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION.value, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO.value, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO.value, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=round(uow.pedidos.sum_total_by_estado(EstadoPedido.ENTREGADO.value), 2),
            )
