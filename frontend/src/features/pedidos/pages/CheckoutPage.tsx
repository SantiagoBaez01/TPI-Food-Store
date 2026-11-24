import { Navigate, useNavigate } from 'react-router-dom'

import { formatPrecio } from '../../../shared/utils/format'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import { CheckoutForm, type DatosCheckout } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total)
  const vaciar = useCartStore((s) => s.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()

  // Tras crear el pedido el carrito queda vacío: no redirigir al carrito en ese caso.
  if (items.length === 0 && !crearPedido.isSuccess) return <Navigate to="/carrito" replace />

  const confirmar = async (datos: DatosCheckout) => {
    await crearPedido.mutateAsync({
      ...datos,
      items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
    })
    vaciar()
    navigate('/mis-pedidos', { replace: true, state: { creado: true } })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="p-6">
        <h1 className="mb-4 text-2xl font-bold">Confirmar pedido</h1>
        <CheckoutForm onConfirmar={confirmar} error={crearPedido.error} />
      </Card>
      <Card className="h-fit space-y-3 p-5">
        <h2 className="text-lg font-semibold">Tu pedido</h2>
        {items.map((i) => (
          <div key={i.producto_id} className="flex justify-between text-sm">
            <span>
              {i.cantidad} × {i.nombre}
            </span>
            <span>{formatPrecio(i.precio_unitario * i.cantidad)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span className="text-brand-700">{formatPrecio(total())}</span>
        </div>
      </Card>
    </div>
  )
}
