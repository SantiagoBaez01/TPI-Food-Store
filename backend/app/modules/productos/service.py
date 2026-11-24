from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


# ---- Excepciones de dominio -------------------------------------------------
class ProductoNoEncontrado(Exception):
    """404"""


class CategoriaNoEncontrada(Exception):
    """404: la categoría indicada no existe o está dada de baja."""


# Campos obligatorios del modelo: un null explícito en el PUT no los borra.
_CAMPOS_OBLIGATORIOS = {"nombre", "precio_base", "stock", "disponible", "categoria_id"}


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        """Un producto dado de baja se trata como inexistente."""
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado(f"Producto {producto_id} no encontrado")
        return producto

    @staticmethod
    def _validar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(f"Categoría {categoria_id} no encontrada")

    def listar(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, items = uow.productos.search(
                skip=skip, limit=limit, search=search, categoria_id=categoria_id, disponible=disponible
            )
            return ProductosPaginados(total=total, items=[ProductoRead.model_validate(p) for p in items])

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._obtener_activo(uow, producto_id))

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._validar_categoria(uow, data.categoria_id)
            producto = Producto.model_validate(data)
            producto.nombre = producto.nombre.strip()
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            cambios = {
                k: v
                for k, v in data.model_dump(exclude_unset=True).items()
                if not (v is None and k in _CAMPOS_OBLIGATORIOS)
            }
            if "categoria_id" in cambios:
                self._validar_categoria(uow, cambios["categoria_id"])
            producto.sqlmodel_update(cambios)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            producto.stock = data.stock
            if data.disponible is not None:
                producto.disponible = data.disponible
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        """Baja lógica (activo = false)."""
        with self.uow as uow:
            producto = self._obtener_activo(uow, producto_id)
            producto.activo = False
            uow.productos.add(producto)
