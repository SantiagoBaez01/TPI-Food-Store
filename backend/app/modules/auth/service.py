from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.schemas import UserCreate, UserPublic
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# ---- Excepciones de dominio -------------------------------------------------
class UsuarioDuplicado(Exception):
    """409: username o email ya registrados."""


class CredencialesInvalidas(Exception):
    """401"""


class CuentaDesactivada(Exception):
    """400"""


class AuthService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, data: UserCreate) -> UserPublic:
        """Registro público: siempre crea usuarios con rol "user"."""
        with self.uow as uow:
            if uow.usuarios.get_by_username(data.username) is not None:
                raise UsuarioDuplicado("El nombre de usuario ya está registrado")
            email = str(data.email).lower()
            if uow.usuarios.get_by_email(email) is not None:
                raise UsuarioDuplicado("El email ya está registrado")
            usuario = Usuario(
                username=data.username,
                full_name=data.full_name.strip(),
                email=email,
                hashed_password=hash_password(data.password),
                role="user",
            )
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)

    def login(self, username: str, password: str) -> str:
        """Valida credenciales y devuelve el JWT que el router guarda en la cookie."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise CredencialesInvalidas("Usuario o contraseña incorrectos")
            if usuario.disabled:
                raise CuentaDesactivada("Cuenta de usuario desactivada")
            return create_access_token(usuario.username, {"role": usuario.role})
