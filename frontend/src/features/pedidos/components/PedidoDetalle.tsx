import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import type { Pedido } from '../types/pedido'

const formaPagoTexto = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' } as const

export function PedidoDetalle({ pedido, cliente }: { pedido: Pedido; cliente?: string }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-stone-500">Estado</p>
          <BadgeEstado estado={pedido.estado} />
        </div>
        <div>
          <p className="text-stone-500">Fecha</p>
          <p>{formatFecha(pedido.created_at)}</p>
        </div>
        {cliente && (
          <div>
            <p className="text-stone-500">Cliente</p>
            <p>{cliente}</p>
          </div>
        )}
        <div>
          <p className="text-stone-500">Forma de pago</p>
          <p>{formaPagoTexto[pedido.forma_pago]}</p>
        </div>
        <div className="col-span-2">
          <p className="text-stone-500">Dirección de entrega</p>
          <p>{pedido.direccion_entrega}</p>
        </div>
        {pedido.notas && (
          <div className="col-span-2">
            <p className="text-stone-500">Notas</p>
            <p>{pedido.notas}</p>
          </div>
        )}
      </div>

      <table className="w-full">
        <thead className="border-b border-stone-200 text-left text-stone-500">
          <tr>
            <th className="py-1.5">Producto</th>
            <th className="py-1.5 text-right">Precio</th>
            <th className="py-1.5 text-right">Cant.</th>
            <th className="py-1.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((item) => (
            <tr key={item.producto_id} className="border-b border-stone-100">
              <td className="py-1.5">{item.nombre_producto}</td>
              <td className="py-1.5 text-right">{formatPrecio(item.precio_unitario)}</td>
              <td className="py-1.5 text-right">{item.cantidad}</td>
              <td className="py-1.5 text-right">{formatPrecio(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-2 text-right font-semibold">
              Total
            </td>
            <td className="pt-2 text-right text-base font-bold text-brand-700">{formatPrecio(pedido.total)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="text-xs text-stone-400">Los precios quedan fijos al momento de crear el pedido.</p>
    </div>
  )
}
