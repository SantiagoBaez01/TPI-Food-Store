import { formatPrecio } from '../../../shared/utils/format'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import type { Producto } from '../types/producto'
import { ProductoImagen } from './ProductoImagen'

interface ProductoCardProps {
  producto: Producto
}

export function ProductoCard({ producto }: ProductoCardProps) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)

  const sinStock = producto.stock <= 0
  const vendible = producto.disponible && !sinStock
  const alTope = enCarrito >= producto.stock

  return (
    <Card className="flex flex-col overflow-hidden">
      <ProductoImagen src={producto.imagen_url} alt={producto.nombre} className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          {producto.categoria.nombre}
        </span>
        <h3 className="font-semibold leading-tight">{producto.nombre}</h3>
        {producto.descripcion && <p className="line-clamp-2 text-sm text-stone-500">{producto.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-lg font-bold text-brand-700">{formatPrecio(producto.precio_base)}</p>
            <p className={`text-xs ${vendible ? 'text-stone-500' : 'text-red-600'}`}>
              {!producto.disponible ? 'No disponible' : sinStock ? 'Sin stock' : `Stock: ${producto.stock}`}
            </p>
          </div>
          <Button
            tamano="sm"
            disabled={!vendible || alTope}
            onClick={() =>
              agregar({
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: producto.precio_base,
                imagen_url: producto.imagen_url,
                stock: producto.stock,
              })
            }
          >
            {enCarrito > 0 ? `Agregar (${enCarrito})` : 'Agregar al carrito'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
