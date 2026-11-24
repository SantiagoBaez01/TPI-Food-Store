"""Importa todos los modelos de tabla para que SQLModel/SQLAlchemy los registre.

Las relaciones usan nombres de clase como string ("Producto", "Pedido", ...); se
resuelven cuando todas las clases ya están importadas. main.py y seed.py
importan este módulo antes de crear las tablas o de hacer la primera consulta.
"""

from app.modules.categorias.models import Categoria
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

__all__ = ["Usuario", "Categoria", "Producto", "Pedido", "DetallePedido"]
