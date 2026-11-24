from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoEncontrado,
    ReglaNegocio,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

solo_admin = require_role(["admin"])


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


@router.post(
    "",
    response_model=PedidoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crea el pedido desde el carrito (RN-01)",
    responses={
        404: {"description": "Producto inexistente o inactivo"},
        400: {"description": "Stock insuficiente, producto no disponible o repetido"},
    },
)
def crear_pedido(
    data: PedidoCreate,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.crear(data, usuario)
    except ProductoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ReglaNegocio as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get("", response_model=PedidosPaginados, summary="Pedidos propios (user) o todos (admin)")
def listar_pedidos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    estado: EstadoPedido | None = Query(None),
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidosPaginados:
    return service.listar(usuario, estado=estado, skip=skip, limit=limit)


# Se declara antes de /{pedido_id} para que "resumen" no se interprete como id.
@router.get("/resumen", response_model=ResumenPedidos, summary="Indicadores del panel")
def resumen_pedidos(
    _: Usuario = Depends(solo_admin),
    service: PedidoService = Depends(get_pedido_service),
) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead, summary="Detalle con sus líneas (dueño o admin)")
def obtener_pedido(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except PedidoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except PedidoAjeno as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e)) from e


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoRead,
    summary="Avanza o cancela según la máquina de estados (RN-02, RN-03)",
)
def cambiar_estado_pedido(
    pedido_id: int,
    data: CambioEstado,
    _: Usuario = Depends(solo_admin),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, data)
    except PedidoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ReglaNegocio as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.patch(
    "/{pedido_id}/cancelar",
    response_model=PedidoRead,
    summary="Cancela un pedido propio en PENDIENTE (RN-03, RN-04)",
)
def cancelar_pedido(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except PedidoNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except PedidoAjeno as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    except ReglaNegocio as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
