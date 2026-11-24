import { api } from '../../../shared/api/axiosInstance'
import type { EstadoPedido, FiltrosPedidos, Pedido, PedidoCreate, PedidosPaginados, ResumenPedidos } from '../types/pedido'

export async function getPedidos(filtros: FiltrosPedidos): Promise<PedidosPaginados> {
  const params: Record<string, string | number> = { skip: filtros.skip, limit: filtros.limit }
  if (filtros.estado) params.estado = filtros.estado
  const { data } = await api.get<PedidosPaginados>('/pedidos', { params })
  return data
}

export async function getPedido(id: number): Promise<Pedido> {
  const { data } = await api.get<Pedido>(`/pedidos/${id}`)
  return data
}

export async function createPedido(payload: PedidoCreate): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/pedidos', payload)
  return data
}

export async function cambiarEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })
  return data
}

export async function cancelarPedido(id: number): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/cancelar`)
  return data
}

export async function getResumen(): Promise<ResumenPedidos> {
  const { data } = await api.get<ResumenPedidos>('/pedidos/resumen')
  return data
}
