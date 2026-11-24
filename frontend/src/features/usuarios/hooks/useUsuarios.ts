import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activarUsuario, desactivarUsuario, getUsuarios } from '../api/usuarios'

export const usuariosKey = ['usuarios'] as const

export function useUsuarios(habilitado = true) {
  return useQuery({ queryKey: usuariosKey, queryFn: getUsuarios, enabled: habilitado })
}

export function useActivarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activarUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKey }),
  })
}

export function useDesactivarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => desactivarUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usuariosKey }),
  })
}
