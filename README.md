# Food Store — Trabajo Práctico Integrador

**Programación 4 · Tecnicatura Universitaria en Programación a Distancia (UTN)**
Alumno: **Santiago Baez**

Aplicación web para un negocio de comidas: los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos con dirección de entrega y forma de pago; el negocio administra categorías, productos, stock, pedidos y usuarios desde un panel.

- **Repositorio:** https://github.com/SantiagoBaez01/TPI-Food-Store
- **Video de demostración:** https://youtu.be/1d1ghUc7n1Q

| Parte | Stack |
|---|---|
| `backend/` | Python 3.12 · FastAPI 0.119 · SQLModel 0.0.22 · PostgreSQL · JWT en cookie HttpOnly · Passlib + bcrypt |
| `frontend/` | React 19 · TypeScript 5.9 (strict) · Vite 7 · Tailwind CSS 4 · TanStack Query / Form / Table · Zustand 5 · Axios · React Router 7 |

---

## 1. Requisitos

| Herramienta | Versión |
|---|---|
| Python | **3.11, 3.12 o 3.13** (SQLModel 0.0.22 no funciona con 3.14) |
| PostgreSQL | 15 o superior (para desarrollo también se acepta SQLite, ver más abajo) |
| Node.js | 20.19 o superior |
| pnpm | 9 o superior (`npm install -g pnpm`) |

---

## 2. Backend

### 2.1 Instalación

```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate
# Linux/macOS:  source venv/bin/activate
pip install -r requirements.txt
```

### 2.2 Base de datos

Crear la base vacía en PostgreSQL (las tablas las crea la aplicación):

```bash
psql -U postgres -c "CREATE DATABASE foodstore_db"
```

> **Sin PostgreSQL:** en el `.env` usar `DATABASE_URL=sqlite:///./foodstore.db` y saltear este paso.

### 2.3 Variables de entorno

Copiar `backend/.env.example` a `backend/.env` y ajustar los valores:

```bash
cp .env.example .env        # Windows: copy .env.example .env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://postgres:postgres@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Firma del JWT (**mínimo 32 caracteres**) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (admite varios separados por coma) | `http://localhost:5173` |

### 2.4 Datos iniciales (seed) y ejecución

```bash
python -m app.db.seed          # idempotente: se puede correr varias veces
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Documentación: http://localhost:8000/docs (Swagger) y http://localhost:8000/redoc

El seed crea las tablas y carga **5 categorías**, **10 productos con stock** y estos usuarios:

| Rol | Usuario | Contraseña |
|---|---|---|
| **admin** | `admin` | `Admin1234!` |
| user (cliente de prueba) | `cliente` | `Cliente1234!` |

> Para probar en `/docs`: ejecutar `POST /auth/token` con «Try it out»; el navegador guarda la cookie y los demás endpoints ya quedan autenticados.

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
pnpm install
pnpm build                  # verifica los tipos (tsc -b) y genera dist/
pnpm dev
```

Abrir http://localhost:5173 (el backend tiene que estar corriendo).

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API, con el prefijo | `http://localhost:8000/api/v1` |

> El frontend y el backend deben usar el mismo host (`localhost` en ambos, no mezclar con `127.0.0.1`) para que el navegador envíe la cookie de sesión.

---

## 4. Funcionalidades

**Cliente (rol `user`)**
- Registro e inicio de sesión (TanStack Form con validación).
- Catálogo paginado en el servidor, con búsqueda por nombre, filtro por categoría, *skeleton* de carga y estado vacío.
- Carrito persistido en el navegador (sobrevive a la recarga), con cantidades limitadas al stock.
- Checkout con dirección, forma de pago (efectivo o transferencia) y notas.
- «Mis pedidos»: listado, detalle y cancelación mientras el pedido está PENDIENTE.

**Administrador (rol `admin`)**
- Resumen con tarjetas: pedidos de hoy, pendientes, en preparación, entregados, cancelados e ingresos.
- ABM de categorías y productos con TanStack Table (orden, búsqueda y paginación) y TanStack Form, incluido el cambio de stock y disponibilidad.
- Gestión de pedidos con filtro por estado y botones según la máquina de estados.
- Gestión de usuarios: activar y desactivar (no puede desactivarse a sí mismo).

---

## 5. Arquitectura

### 5.1 Backend: módulos por dominio y capas

```
backend/app/
├── main.py                 FastAPI, CORS con credenciales, routers bajo /api/v1
├── core/
│   ├── config.py           Settings (pydantic-settings, lee .env)
│   ├── database.py         engine, create_all_tables, session_factory
│   ├── security.py         bcrypt, create_access_token, decode_access_token
│   ├── deps.py             get_current_user, get_current_active_user, require_role
│   ├── unit_of_work.py     UnitOfWork: commit / rollback / close en __exit__
│   └── base_repository.py  BaseRepository[T]: get_by_id, get_all, add, delete
├── modules/
│   ├── auth/               router, service, schemas (usa el modelo Usuario)
│   ├── usuarios/           models, schemas, repository, unit_of_work, service, router
│   ├── categorias/         ídem
│   ├── productos/          ídem
│   └── pedidos/            ídem — RN-01 a RN-06 y máquina de estados
└── db/
    ├── registry.py         importa todos los modelos (resuelve las relaciones)
    └── seed.py             carga idempotente
```

Flujo unidireccional **Router → Service → Unit of Work → Repository → Model**:

- **Router**: valida el cuerpo con schemas, resuelve sesión y rol con `Depends`, obtiene el Service con `Depends(get_<modulo>_service)` y traduce las excepciones de dominio a `HTTPException`. Nunca abre el Unit of Work.
- **Service**: reglas de negocio. Abre `with self.uow as uow:` y devuelve el schema de salida (`Schema.model_validate(obj)`) **dentro** del bloque.
- **Unit of Work**: crea la sesión, expone los repositorios que la comparten y hace `commit` o `rollback` en `__exit__`. **Ningún Service ni Router llama a `session.commit()`.**
- **Repository**: consultas con `select`, sin reglas de negocio.

Excepciones de dominio → código HTTP:

| Excepción | Código |
|---|---|
| `CategoriaNoEncontrada`, `ProductoNoEncontrado`, `PedidoNoEncontrado`, `UsuarioNoEncontrado` | 404 |
| `NombreDuplicado`, `UsuarioDuplicado` | 409 |
| `PedidoAjeno` | 403 |
| `StockInsuficiente`, `ProductoNoDisponible`, `ProductoRepetido`, `TransicionInvalida`, `PedidoNoCancelable`, `AutoDesactivacion` | 400 |

### 5.2 Modelo de datos

Cinco entidades según el UML: `Usuario`, `Categoria`, `Producto`, `Pedido`, `DetallePedido`, con las relaciones `Categoria.productos ↔ Producto.categoria`, `Usuario.pedidos ↔ Pedido.usuario`, `Pedido.items ↔ DetallePedido.pedido` y `Producto.detalles ↔ DetallePedido.producto`.

- Baja lógica: `Usuario.disabled`, `Categoria.activo`, `Producto.activo`. Un registro dado de baja se trata como inexistente (404). La baja de una categoría no libera su nombre ni oculta sus productos.
- Los pedidos no se borran (no hay endpoint DELETE ni PUT): se cancelan.
- `DetallePedido` copia `nombre_producto` y `precio_unitario`: el pedido no cambia si después cambia el producto.

### 5.3 Reglas de negocio (en `modules/pedidos/service.py`)

| Regla | Implementación |
|---|---|
| **RN-01** Crear pedido | Al menos un ítem, sin productos repetidos. Por cada ítem, en la misma iteración: verifica existencia/activo (404), disponible y stock (400), descuenta stock y crea la línea con la copia de nombre y precio. Todo en **una transacción**: si un ítem falla no se persiste nada, tampoco el descuento. El producto se lee con `SELECT … FOR UPDATE` para que dos pedidos simultáneos no vendan el mismo stock. |
| **RN-02** Transiciones | Diccionario `TRANSICIONES` en el Service. PENDIENTE → EN_PREPARACION / CANCELADO; EN_PREPARACION → ENTREGADO / CANCELADO; ENTREGADO y CANCELADO son terminales. Inválida → 400. |
| **RN-03** Cancelar | Restituye el stock de cada línea en la misma transacción que cambia el estado. |
| **RN-04** Permisos | El cliente ve solo sus pedidos y cancela solo los suyos en PENDIENTE (403 si es ajeno); el admin ve todos y avanza o cancela cualquier estado no terminal. |
| **RN-05** Inmutabilidad | Líneas y total fijos desde la creación; sin endpoints de edición ni borrado. |
| **RN-06** Datos | `forma_pago` ∈ {EFECTIVO, TRANSFERENCIA} y `direccion_entrega` de 5 a 200 caracteres, validados en el schema (422). |

### 5.4 Autenticación

1. `POST /auth/token` (formulario OAuth2) responde `{"message": "Login exitoso"}` y deja el JWT en la cookie **HttpOnly** `access_token` (30 min). El token nunca viaja en el cuerpo.
2. Axios usa `withCredentials: true`: el navegador adjunta la cookie sola. El frontend no lee ni guarda el token.
3. `get_current_user` lee la cookie y valida firma y expiración (401); `get_current_active_user` rechaza cuentas desactivadas (400); `require_role(["admin"])` verifica el rol (403).
4. `POST /auth/logout` borra la cookie.

### 5.5 Frontend: organización por features

```
frontend/src/
├── shared/
│   ├── api/          axiosInstance (withCredentials + interceptor 401), handleApiError, queryClient
│   ├── ui/           Button, Card, Input, Modal, BadgeEstado
│   ├── components/   Paginacion, Skeleton, EstadoVacio, EstadoError, DataTable, ConfirmModal
│   └── layout/       Navbar, MainLayout, AdminLayout
├── features/
│   ├── auth/         LoginPage, RegisterPage, UnauthorizedPage
│   ├── categorias/   AdminCategoriasPage, CategoriaForm, useCategorias
│   ├── productos/    CatalogoPage, AdminProductosPage, ProductoCard, ProductoForm, StockForm, useProductos
│   ├── usuarios/     AdminUsuariosPage, useUsuarios
│   └── pedidos/      CarritoPage, CheckoutPage, MisPedidosPage, AdminPedidosPage, AdminResumenPage,
│                     CheckoutForm, PedidoDetalle, PedidosTabla, ResumenCard, usePedidos (…)
├── store/            authStore (persist + partialize: solo el usuario), cartStore (persist)
├── routes/           AppRouter (BrowserRouter), ProtectedRoute (sesión y rol)
├── App.tsx           checkSession al montar
└── main.tsx          QueryClientProvider
```

- **Estado del servidor** (catálogo, pedidos, usuarios, resumen) con **TanStack Query**: `useQuery` con `queryKey` descriptivas (`['productos', filtros]`) y `useMutation` con `invalidateQueries` en `onSuccess`. Crear o cancelar un pedido invalida también `productos`, porque cambia el stock.
- **Estado del cliente** con **Zustand**: `authStore` (usuario, cargando, login, logout, checkSession; `partialize` guarda solo el usuario, nunca el token) y `cartStore` (items, agregar, quitar, cambiarCantidad, vaciar, total).
- Ningún componente obtiene datos con `fetch` dentro de `useEffect`; la única llamada en un efecto es `checkSession` al montar la app.
- El interceptor de Axios limpia la sesión ante un 401 (fuera de `/auth/token` y `/auth/me`) o ante «Cuenta de usuario desactivada»; `ProtectedRoute` redirige a `/login` o a `/unauthorized`. La protección real está en el backend.

---

## 6. Endpoints (prefijo `/api/v1`)

| Método | Endpoint | Acceso | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | Público | 201 · 409 si username/email existen |
| POST | `/auth/token` | Público | 200 + cookie · 401 credenciales · 400 desactivada |
| POST | `/auth/logout` | Público | 200 |
| GET | `/auth/me` | Sesión | 200 |
| GET | `/admin/usuarios` | admin | 200 |
| POST | `/admin/usuarios/{id}/activar` | admin | 200 · 404 |
| POST | `/admin/usuarios/{id}/desactivar` | admin | 200 · 404 · 400 si es uno mismo |
| GET | `/categorias` · `/categorias/{id}` | Público | 200 · 404 |
| POST / PUT / DELETE | `/categorias[/{id}]` | admin | 201 / 200 / 204 · 404 · 409 |
| GET | `/productos?skip&limit&search&categoria_id&disponible` | Público | 200 `{total, items}` |
| GET | `/productos/{id}` | Público | 200 · 404 |
| POST / PUT / DELETE | `/productos[/{id}]` | admin | 201 / 200 / 204 · 404 |
| PATCH | `/productos/{id}/stock` | admin | 200 · 404 |
| POST | `/pedidos` | Sesión | 201 · 404 · 400 |
| GET | `/pedidos?skip&limit&estado` | Sesión | 200 (propios o todos si admin) |
| GET | `/pedidos/resumen` | admin | 200 |
| GET | `/pedidos/{id}` | Dueño o admin | 200 · 404 · 403 |
| PATCH | `/pedidos/{id}/estado` | admin | 200 · 404 · 400 |
| PATCH | `/pedidos/{id}/cancelar` | Dueño | 200 · 404 · 403 · 400 |

Comunes: 401 sin sesión válida, 400 cuenta desactivada, 403 rol no permitido, 422 validación.
