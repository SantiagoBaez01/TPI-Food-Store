import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { productosKey } from '../../productos/hooks/useProductos'
import { cambiarEstado, cancelarPedido, createPedido, getPedido, getPedidos, getResumen } from '../api/pedidos'
import type { EstadoPedido, FiltrosPedidos, PedidoCreate } from '../types/pedido'

export const pedidosKey = ['pedidos'] as const
export const resumenKey = ['pedidos', 'resumen'] as const

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: [...pedidosKey, 'lista', filtros],
    queryFn: () => getPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function usePedido(id: number | null) {
  return useQuery({
    queryKey: [...pedidosKey, 'detalle', id],
    queryFn: () => getPedido(id ?? 0),
    enabled: id !== null,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: resumenKey, queryFn: getResumen })
}

/** Crear, cancelar o cambiar estado altera pedidos, resumen y stock: se invalida todo eso. */
function useInvalidarPedidos() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: pedidosKey })
    qc.invalidateQueries({ queryKey: productosKey })
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidos()
  return useMutation({ mutationFn: (payload: PedidoCreate) => createPedido(payload), onSuccess: invalidar })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidos()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSuccess: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidos()
  return useMutation({ mutationFn: (id: number) => cancelarPedido(id), onSuccess: invalidar })
}
