"""Carga inicial idempotente: usuario admin, categorías y productos.

Uso (desde backend/):  python -m app.db.seed
Se puede ejecutar varias veces: solo crea lo que todavía no existe.
"""

from sqlmodel import Session, select

import app.db.registry  # noqa: F401
from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "password": "Admin1234!",
    "full_name": "Administrador Food Store",
    "email": "admin@foodstore.com",
}

CLIENTE_DEMO = {
    "username": "cliente",
    "password": "Cliente1234!",
    "full_name": "Cliente de Prueba",
    "email": "cliente@foodstore.com",
}

CATEGORIAS = [
    ("Pizzas", "Pizzas a la piedra y al molde"),
    ("Hamburguesas", "Hamburguesas caseras con papas"),
    ("Empanadas", "Empanadas al horno y fritas"),
    ("Bebidas", "Gaseosas, aguas y cervezas"),
    ("Postres", "Postres caseros y helados"),
]


def _img(texto: str, color: str) -> str:
    return f"https://placehold.co/600x400/{color}/FFFFFF/png?text={texto.replace(' ', '+')}"


# (categoría, nombre, descripción, precio, stock, color de la imagen)
PRODUCTOS = [
    ("Pizzas", "Pizza Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9500.0, 20, "C0392B"),
    ("Pizzas", "Pizza Napolitana", "Muzzarella, tomate en rodajas y ajo", 11000.0, 15, "C0392B"),
    ("Pizzas", "Pizza Fugazzeta", "Rellena de muzzarella y cebolla", 12000.0, 10, "C0392B"),
    ("Hamburguesas", "Hamburguesa Clásica", "Carne, lechuga, tomate y queso, con papas", 8500.0, 25, "D35400"),
    ("Hamburguesas", "Hamburguesa Doble Bacon", "Doble carne, cheddar y panceta, con papas", 11500.0, 12, "D35400"),
    ("Empanadas", "Empanada de Carne", "Carne cortada a cuchillo, al horno", 1500.0, 60, "B9770E"),
    ("Empanadas", "Empanada de Jamón y Queso", "Al horno", 1400.0, 60, "B9770E"),
    ("Bebidas", "Gaseosa 1.5 L", "Línea cola", 3000.0, 40, "2471A3"),
    ("Bebidas", "Agua Mineral 500 ml", "Sin gas", 1200.0, 50, "2471A3"),
    ("Postres", "Flan Casero", "Con dulce de leche y crema", 3500.0, 15, "7D3C98"),
]


def _crear_usuario(session: Session, datos: dict[str, str], role: str) -> bool:
    if session.exec(select(Usuario).where(Usuario.username == datos["username"])).first():
        return False
    session.add(
        Usuario(
            username=datos["username"],
            full_name=datos["full_name"],
            email=datos["email"],
            hashed_password=hash_password(datos["password"]),
            role=role,
        )
    )
    return True


def seed() -> None:
    create_all_tables()
    with Session(engine) as session:
        creados_usuarios = sum(
            [_crear_usuario(session, ADMIN, "admin"), _crear_usuario(session, CLIENTE_DEMO, "user")]
        )

        categorias: dict[str, Categoria] = {}
        creadas_categorias = 0
        for nombre, descripcion in CATEGORIAS:
            categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(categoria)
                session.flush()
                creadas_categorias += 1
            categorias[nombre] = categoria

        creados_productos = 0
        for cat, nombre, descripcion, precio, stock, color in PRODUCTOS:
            if session.exec(select(Producto).where(Producto.nombre == nombre)).first():
                continue
            session.add(
                Producto(
                    categoria_id=categorias[cat].id or 0,
                    nombre=nombre,
                    descripcion=descripcion,
                    precio_base=precio,
                    imagen_url=_img(nombre, color),
                    stock=stock,
                )
            )
            creados_productos += 1

        session.commit()

    print(
        f"Seed completo: {creados_usuarios} usuarios, {creadas_categorias} categorías "
        f"y {creados_productos} productos nuevos."
    )
    print(f"Admin: {ADMIN['username']} / {ADMIN['password']}")


if __name__ == "__main__":
    seed()
