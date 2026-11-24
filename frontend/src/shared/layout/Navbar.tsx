import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { Button } from '../ui/Button'

const linkClase = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-brand-100 text-brand-700' : 'text-stone-600 hover:bg-stone-100'}`

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0))
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const cerrarSesion = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 flex items-center gap-2 text-xl font-bold text-brand-600">
          <span>🍕</span> Food Store
        </Link>
        <NavLink to="/" end className={linkClase}>
          Catálogo
        </NavLink>
        <NavLink to="/carrito" className={linkClase}>
          Carrito
          {cantidad > 0 && (
            <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">{cantidad}</span>
          )}
        </NavLink>
        {usuario && (
          <NavLink to="/mis-pedidos" className={linkClase}>
            Mis pedidos
          </NavLink>
        )}
        {usuario?.role === 'admin' && (
          <NavLink to="/admin/resumen" className={() => linkClase({ isActive: pathname.startsWith('/admin') })}>
            Panel admin
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-3">
          {usuario ? (
            <>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold">{usuario.full_name}</p>
                <p className="text-xs text-stone-500">
                  @{usuario.username} · {usuario.role === 'admin' ? 'Administrador' : 'Cliente'}
                </p>
              </div>
              <Button variante="secundario" tamano="sm" onClick={cerrarSesion}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClase}>
                Ingresar
              </NavLink>
              <Link to="/register">
                <Button tamano="sm">Crear cuenta</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
