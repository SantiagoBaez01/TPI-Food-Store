import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DataTable } from '../../../shared/components/DataTable'
import { BadgeEstado } from '../../../shared/ui/BadgeEstado'
import { Button } from '../../../shared/ui/Button'
import { formatFecha, formatPrecio } from '../../../shared/utils/format'
import { TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido'

const textoAccion: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparar',
  ENTREGADO: 'Entregar',
  CANCELADO: 'Cancelar',
}

interface PedidosTablaProps {
  pedidos: Pedido[]
  nombreCliente: (usuarioId: number) => string
  onVer: (pedido: Pedido) => void
  onCambiarEstado: (pedido: Pedido, estado: EstadoPedido) => void
  /** id del pedido cuyo cambio de estado está en curso. */
  enCurso: number | null
}

/** Tabla de pedidos del panel: los botones salen de la máquina de estados. */
export function PedidosTabla({ pedidos, nombreCliente, onVer, onCambiarEstado, enCurso }: PedidosTablaProps) {
  const columnas = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { accessorKey: 'id', header: '#', cell: ({ row }) => <span className="font-semibold">#{row.original.id}</span> },
      { accessorKey: 'created_at', header: 'Fecha', cell: ({ row }) => formatFecha(row.original.created_at) },
      {
        id: 'cliente',
        accessorFn: (p) => nombreCliente(p.usuario_id),
        header: 'Cliente',
        // La tabla cachea el valor del accessor por fila: el cell recalcula al llegar los usuarios.
        cell: ({ row }) => nombreCliente(row.original.usuario_id),
      },
      { accessorKey: 'forma_pago', header: 'Pago' },
      { accessorKey: 'total', header: 'Total', cell: ({ row }) => formatPrecio(row.original.total) },
      { accessorKey: 'estado', header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex flex-wrap gap-1">
              <Button tamano="sm" variante="secundario" onClick={() => onVer(p)}>
                Ver
              </Button>
              {TRANSICIONES[p.estado].map((destino) => (
                <Button
                  key={destino}
                  tamano="sm"
                  variante={destino === 'CANCELADO' ? 'peligro' : 'exito'}
                  disabled={enCurso === p.id}
                  onClick={() => onCambiarEstado(p, destino)}
                >
                  {textoAccion[destino]}
                </Button>
              ))}
            </div>
          )
        },
      },
    ],
    [nombreCliente, onVer, onCambiarEstado, enCurso],
  )

  return <DataTable datos={pedidos} columnas={columnas} />
}
