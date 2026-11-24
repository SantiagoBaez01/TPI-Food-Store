from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


# ---- Excepciones de dominio -------------------------------------------------
class CategoriaNoEncontrada(Exception):
    """404"""


class NombreDuplicado(Exception):
    """409"""


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    @staticmethod
    def _obtener_activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        """Una categoría dada de baja se trata como inexistente."""
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(f"Categoría {categoria_id} no encontrada")
        return categoria

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._obtener_activa(uow, categoria_id))

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            nombre = data.nombre.strip()
            if uow.categorias.get_by_nombre(nombre) is not None:
                raise NombreDuplicado(f"Ya existe una categoría con el nombre '{nombre}'")
            categoria = Categoria(nombre=nombre, descripcion=data.descripcion)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._obtener_activa(uow, categoria_id)
            cambios = data.model_dump(exclude_unset=True)
            if cambios.get("nombre") is not None:
                nombre = cambios["nombre"].strip()
                existente = uow.categorias.get_by_nombre(nombre)
                if existente is not None and existente.id != categoria.id:
                    raise NombreDuplicado(f"Ya existe una categoría con el nombre '{nombre}'")
                cambios["nombre"] = nombre
            elif "nombre" in cambios:
                cambios.pop("nombre")  # nombre es obligatorio: un null no lo borra
            categoria.sqlmodel_update(cambios)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica. No libera el nombre ni oculta sus productos."""
        with self.uow as uow:
            categoria = self._obtener_activa(uow, categoria_id)
            categoria.activo = False
            uow.categorias.add(categoria)
