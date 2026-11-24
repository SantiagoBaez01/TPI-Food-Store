from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])

solo_admin = require_role(["admin"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


@router.get("", response_model=list[CategoriaRead], summary="Lista las categorías activas")
def listar_categorias(service: CategoriaService = Depends(get_categoria_service)) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead, summary="Detalle de una categoría")
def obtener_categoria(
    categoria_id: int, service: CategoriaService = Depends(get_categoria_service)
) -> CategoriaRead:
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crea una categoría (nombre único)",
)
def crear_categoria(
    data: CategoriaCreate,
    _: Usuario = Depends(solo_admin),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.crear(data)
    except NombreDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e)) from e


@router.put("/{categoria_id}", response_model=CategoriaRead, summary="Actualiza los campos enviados")
def actualizar_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    _: Usuario = Depends(solo_admin),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.actualizar(categoria_id, data)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except NombreDuplicado as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e)) from e


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Baja lógica (activo = false)",
)
def eliminar_categoria(
    categoria_id: int,
    _: Usuario = Depends(solo_admin),
    service: CategoriaService = Depends(get_categoria_service),
) -> Response:
    try:
        service.eliminar(categoria_id)
    except CategoriaNoEncontrada as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    return Response(status_code=status.HTTP_204_NO_CONTENT)
