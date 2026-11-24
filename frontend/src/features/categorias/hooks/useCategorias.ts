import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const categoriasKey = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: categoriasKey, queryFn: getCategorias })
}

export function useCrearCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoriaCreate) => createCategoria(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriasKey }),
  })
}

export function useActualizarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaUpdate }) => updateCategoria(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriasKey })
      qc.invalidateQueries({ queryKey: ['productos'] }) // los productos muestran el nombre de su categoría
    },
  })
}

export function useEliminarCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriasKey }),
  })
}
