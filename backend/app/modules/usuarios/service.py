from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# ---- Excepciones de dominio -------------------------------------------------
class UsuarioNoEncontrado(Exception):
    """404"""


class AutoDesactivacion(Exception):
    """400: el admin no puede desactivarse a sí mismo."""


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.list_ordenados()]

    def _obtener(self, uow: UsuarioUnitOfWork, usuario_id: int) -> Usuario:
        usuario = uow.usuarios.get_by_id(usuario_id)
        if usuario is None:
            raise UsuarioNoEncontrado(f"Usuario {usuario_id} no encontrado")
        return usuario

    def activar(self, usuario_id: int) -> UserPublic:
        """Alta lógica. Idempotente: responde igual aunque ya esté activo."""
        with self.uow as uow:
            usuario = self._obtener(uow, usuario_id)
            usuario.disabled = False
            uow.session.add(usuario)
            uow.session.flush()
            return UserPublic.model_validate(usuario)

    def desactivar(self, usuario_id: int, actual_id: int) -> UserPublic:
        """Baja lógica. Idempotente; el admin no puede desactivarse a sí mismo."""
        with self.uow as uow:
            usuario = self._obtener(uow, usuario_id)
            if usuario.id == actual_id:
                raise AutoDesactivacion("No puede desactivar su propia cuenta")
            usuario.disabled = True
            uow.session.add(usuario)
            uow.session.flush()
            return UserPublic.model_validate(usuario)
