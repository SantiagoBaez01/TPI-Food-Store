from sqlmodel import SQLModel

# El registro y el perfil reutilizan los schemas del módulo usuarios.
from app.modules.usuarios.schemas import UserCreate, UserPublic

__all__ = ["UserCreate", "UserPublic", "MessageResponse"]


class MessageResponse(SQLModel):
    message: str
