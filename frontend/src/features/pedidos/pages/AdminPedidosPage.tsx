import { useCallback, useMemo, useState } from 'react'

import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonTabla } from '../../../shared/components/Skeleton'
import { Modal } from '../../../shared/ui/Modal'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { PedidosTabla } from '../components/PedidosTabla'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ESTADOS, type EstadoPedido, type Pedido } from '../types/pedido'

const filtroTexto: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendientes',
  EN_PREPARACION: 'En preparación',
  ENTREGADO: 'Entregados',
  CANCELADO: 'Cancelados',
}

export function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined)
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const [cancelando, setCancelando] = useState<Pedido | null>(null)

  const pedidos = usePedidos({ skip: 0, limit: 100, estado })
  const usuarios = useUsuarios()
  const cambiarEstado = useCambiarEstadoPedido()

  const nombres = useMemo(() => new Map(usuarios.data?.map((u) => [u.id, `@${u.username}`]) ?? []), [usuarios.data])
  const nombreCliente = useCallback((id: number) => nombres.get(id) ?? `Usuario #${id}`, [nombres])

  const onCambiarEstado = useCallback(
    (pedido: Pedido, destino: EstadoPedido) => {
      cambiarEstado.reset()
      // Cancelar restituye stock y es terminal: se pide confirmación.
      if (destino === 'CANCELADO') setCancelando(pedido)
      else cambiarEstado.mutate({ id: pedido.id, estado: destino })
    },
    [cambiarEstado],
  )

  const cerrarCancelar = () => {
    setCancelando(null)
    cambiarEstado.reset()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-stone-500">
          PENDIENTE → EN PREPARACIÓN → ENTREGADO. Se puede cancelar en cualquier estado no terminal (restituye stock).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEstado(undefined)}
          className={`rounded-full px-3 py-1 text-sm ${estado === undefined ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-300'}`}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEstado(e)}
            className={`rounded-full px-3 py-1 text-sm ${estado === e ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-300'}`}
          >
            {filtroTexto[e]}
          </button>
        ))}
      </div>

      {!cancelando && <MensajeError error={cambiarEstado.error} />}

      {pedidos.isPending || usuarios.isPending ? (
        <SkeletonTabla />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : pedidos.data.items.length === 0 ? (
        <EstadoVacio icono="🧾" titulo="No hay pedidos" mensaje={estado ? 'No hay pedidos en este estado.' : undefined} />
      ) : (
        <PedidosTabla
          pedidos={pedidos.data.items}
          nombreCliente={nombreCliente}
          onVer={setDetalle}
          onCambiarEstado={onCambiarEstado}
          enCurso={cambiarEstado.isPending ? (cambiarEstado.variables?.id ?? null) : null}
        />
      )}

      <Modal abierto={detalle !== null} titulo={`Pedido #${detalle?.id ?? ''}`} onCerrar={() => setDetalle(null)} ancho="lg">
        {detalle && <PedidoDetalle pedido={detalle} cliente={nombreCliente(detalle.usuario_id)} />}
      </Modal>

      <ConfirmModal
        abierto={cancelando !== null}
        titulo="Cancelar pedido"
        mensaje={`¿Cancelar el pedido #${cancelando?.id ?? ''}? Se restituirá el stock de sus productos.`}
        textoConfirmar="Sí, cancelar"
        cargando={cambiarEstado.isPending}
        error={cambiarEstado.error}
        onCerrar={cerrarCancelar}
        onConfirmar={() => {
          if (cancelando) cambiarEstado.mutate({ id: cancelando.id, estado: 'CANCELADO' }, { onSuccess: cerrarCancelar })
        }}
      />
    </div>
  )
}
