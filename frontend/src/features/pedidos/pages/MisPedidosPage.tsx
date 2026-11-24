import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { Skeleton } from '../../../shared/components/Skeleton'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Modal } from '../../../shared/ui/Modal'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCancelarPedido, usePedido, usePedidos } from '../hooks/usePedidos'

const LIMIT = 10

export function MisPedidosPage() {
  const [pagina, setPagina] = useState(0)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [cancelarId, setCancelarId] = useState<number | null>(null)
  const location = useLocation()
  const recienCreado = (location.state as { creado?: boolean } | null)?.creado === true

  const pedidos = usePedidos({ skip: pagina * LIMIT, limit: LIMIT })
  const detalle = usePedido(detalleId)
  const cancelar = useCancelarPedido()

  const cerrarCancelar = () => {
    setCancelarId(null)
    cancelar.reset()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>
      {recienCreado && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
          ¡Pedido confirmado! Te avisamos cuando empiece a prepararse.
        </p>
      )}

      {pedidos.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : pedidos.data.items.length === 0 ? (
        <EstadoVacio
          icono="🧾"
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/">
              <Button>Ver el catálogo</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {pedidos.data.items.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Pedido #{p.id}</span>
                    <BadgeEstado estado={p.estado} />
                  </div>
                  <p className="text-sm text-stone-500">
                    {formatFecha(p.created_at)} · {p.items.length} producto{p.items.length === 1 ? '' : 's'} ·{' '}
                    {p.direccion_entrega}
                  </p>
                </div>
                <p className="text-lg font-bold text-brand-700">{formatPrecio(p.total)}</p>
                <div className="flex gap-2">
                  <Button variante="secundario" tamano="sm" onClick={() => setDetalleId(p.id)}>
                    Ver detalle
                  </Button>
                  {p.estado === 'PENDIENTE' && (
                    <Button variante="peligro" tamano="sm" onClick={() => setCancelarId(p.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Paginacion
            pagina={pagina}
            totalPaginas={Math.ceil(pedidos.data.total / LIMIT)}
            total={pedidos.data.total}
            onCambiar={setPagina}
          />
        </>
      )}

      <Modal abierto={detalleId !== null} titulo={`Pedido #${detalleId ?? ''}`} onCerrar={() => setDetalleId(null)} ancho="lg">
        {detalle.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : detalle.isError ? (
          <EstadoError error={detalle.error} />
        ) : (
          <PedidoDetalle pedido={detalle.data} />
        )}
      </Modal>

      <ConfirmModal
        abierto={cancelarId !== null}
        titulo="Cancelar pedido"
        mensaje={`¿Cancelar el pedido #${cancelarId ?? ''}? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, cancelar"
        cargando={cancelar.isPending}
        error={cancelar.error}
        onCerrar={cerrarCancelar}
        onConfirmar={() => {
          if (cancelarId !== null) cancelar.mutate(cancelarId, { onSuccess: cerrarCancelar })
        }}
      />
    </div>
  )
}
