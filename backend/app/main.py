from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.db.registry  # noqa: F401  (registra los modelos antes de crear tablas)
from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_all_tables()
    yield


app = FastAPI(
    title="Food Store API",
    description="Sistema de pedidos de comida · Trabajo Práctico Integrador · Programación 4",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS con credenciales: el navegador envía la cookie HttpOnly solo si el origen
# está permitido explícitamente (no se puede usar "*" junto con allow_credentials).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth_router, usuarios_router, categorias_router, productos_router, pedidos_router):
    app.include_router(router, prefix=API_PREFIX)


@app.get("/", tags=["Salud"], summary="Estado de la API")
def root() -> dict[str, str]:
    return {"status": "ok", "docs": "/docs", "redoc": "/redoc", "api": API_PREFIX}
