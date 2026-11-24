import { Link, useNavigate } from 'react-router-dom'

import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { formatPrecio } from '../../../shared/utils/format'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useAuthStore } from '../../../store/authStore'
import { useCartStore } from '../../../store/cartStore'
import { ProductoImagen } from '../../productos/components/ProductoImagen'

export function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total)
  const quitar = useCartStore((s) => s.quitar)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const vaciar = useCartStore((s) => s.vaciar)
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EstadoVacio
        icono="🛒"
        titulo="Tu carrito está vacío"
        mensaje="Agregá productos desde el catálogo."
        accion={
          <Link to="/">
            <Button>Ir al catálogo</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Carrito</h1>
          <Button variante="fantasma" tamano="sm" onClick={vaciar}>
            Vaciar carrito
          </Button>
        </div>
        {items.map((item) => (
          <Card key={item.producto_id} className="flex items-center gap-4 p-3">
            <ProductoImagen src={item.imagen_url} alt={item.nombre} className="h-16 w-20 shrink-0 rounded-lg text-2xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{item.nombre}</p>
              <p className="text-sm text-stone-500">{formatPrecio(item.precio_unitario)} c/u</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variante="secundario"
                tamano="sm"
                aria-label="Restar"
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
              >
                −
              </Button>
              <input
                type="number"
                aria-label={`Cantidad de ${item.nombre}`}
                className="w-14 rounded-lg border border-stone-300 px-2 py-1 text-center"
                min={1}
                max={item.stock}
                value={item.cantidad}
                onChange={(e) => {
                  const n = e.target.valueAsNumber
                  if (!Number.isNaN(n)) cambiarCantidad(item.producto_id, n)
                }}
              />
              <Button
                variante="secundario"
                tamano="sm"
                aria-label="Sumar"
                disabled={item.cantidad >= item.stock}
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
              >
                +
              </Button>
            </div>
            <p className="w-28 text-right font-semibold">{formatPrecio(item.precio_unitario * item.cantidad)}</p>
            <Button variante="fantasma" tamano="sm" className="text-red-600" onClick={() => quitar(item.producto_id)}>
              Quitar
            </Button>
          </Card>
        ))}
      </div>

      <Card className="h-fit space-y-4 p-5">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <div className="space-y-1 text-sm">
          {items.map((i) => (
            <div key={i.producto_id} className="flex justify-between text-stone-600">
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <span>{formatPrecio(i.precio_unitario * i.cantidad)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span className="text-brand-700">{formatPrecio(total())}</span>
        </div>
        <Button className="w-full" onClick={() => navigate('/checkout')}>
          {usuario ? 'Confirmar pedido' : 'Ingresar para confirmar'}
        </Button>
        <p className="text-xs text-stone-500">El stock y los precios se confirman al crear el pedido.</p>
      </Card>
    </div>
  )
}
