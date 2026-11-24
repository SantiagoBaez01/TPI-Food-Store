from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import AutoDesactivacion, UsuarioNoEncontrado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios (admin)"])

solo_admin = require_role(["admin"])


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


@router.get("", response_model=list[UserPublic], summary="Listado de usuarios")
def listar_usuarios(
    _: Usuario = Depends(solo_admin),
    service: UsuarioService = Depends(get_usuario_service),
) -> list[UserPublic]:
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic, summary="Alta lógica (disabled = false)")
def activar_usuario(
    usuario_id: int,
    _: Usuario = Depends(solo_admin),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    try:
        return service.activar(usuario_id)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("/{usuario_id}/desactivar", response_model=UserPublic, summary="Baja lógica (disabled = true)")
def desactivar_usuario(
    usuario_id: int,
    admin: Usuario = Depends(solo_admin),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    try:
        return service.desactivar(usuario_id, actual_id=admin.id or 0)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except AutoDesactivacion as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
