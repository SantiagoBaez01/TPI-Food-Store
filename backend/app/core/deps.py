"""Dependencias de sesión y rol para los routers."""

from collections.abc import Callable

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyCookie

from app.core.database import session_factory
from app.core.security import COOKIE_NAME, decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

# Documenta en /docs que la autenticación viaja en la cookie HttpOnly access_token.
cookie_scheme = APIKeyCookie(name=COOKIE_NAME, auto_error=False, description="JWT en cookie HttpOnly")

CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


def get_current_user(access_token: str | None = Security(cookie_scheme)) -> Usuario:
    """Lee la cookie, valida firma y expiración del JWT y carga el usuario. 401 si falla."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión expirada",
    )
    if not access_token:
        raise credentials_exception
    payload = decode_access_token(access_token)
    username = payload.get("sub") if payload else None
    if not isinstance(username, str):
        raise credentials_exception
    with session_factory() as session:
        user = UsuarioRepository(session).get_by_username(username)
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Rechaza usuarios dados de baja (disabled = true) con 400."""
    if current_user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA)
    return current_user


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    """Fábrica de dependencias: exige que el usuario activo tenga uno de los roles. 403 si no."""

    def checker(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para realizar esta acción",
            )
        return current_user

    return checker
