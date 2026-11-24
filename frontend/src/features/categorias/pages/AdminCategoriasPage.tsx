import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonTabla } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types/categoria'

type Dialogo = { tipo: 'crear' } | { tipo: 'editar' | 'eliminar'; categoria: Categoria } | null

export function AdminCategoriasPage() {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()
  const [dialogo, setDialogo] = useState<Dialogo>(null)

  const cerrar = () => {
    setDialogo(null)
    crear.reset()
    actualizar.reset()
    eliminar.reset()
  }

  const columnas = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-stone-600">{row.original.descripcion ?? '—'}</span>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button tamano="sm" variante="secundario" onClick={() => setDialogo({ tipo: 'editar', categoria: row.original })}>
              Editar
            </Button>
            <Button
              tamano="sm"
              variante="fantasma"
              className="text-red-600"
              onClick={() => setDialogo({ tipo: 'eliminar', categoria: row.original })}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const guardarNueva = (datos: CategoriaCreate) => crear.mutateAsync(datos).then(cerrar)
  const guardarEdicion = (id: number) => (datos: CategoriaCreate) =>
    actualizar.mutateAsync({ id, payload: datos }).then(cerrar)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-stone-500">El nombre es único; la baja es lógica y no oculta sus productos.</p>
        </div>
        <Button onClick={() => setDialogo({ tipo: 'crear' })}>+ Nueva categoría</Button>
      </div>

      {categorias.isPending ? (
        <SkeletonTabla />
      ) : categorias.isError ? (
        <EstadoError error={categorias.error} onReintentar={() => void categorias.refetch()} />
      ) : categorias.data.length === 0 ? (
        <EstadoVacio titulo="No hay categorías" mensaje="Creá la primera con «Nueva categoría»." />
      ) : (
        <DataTable datos={categorias.data} columnas={columnas} />
      )}

      <Modal abierto={dialogo?.tipo === 'crear'} titulo="Nueva categoría" onCerrar={cerrar}>
        {dialogo?.tipo === 'crear' && <CategoriaForm onGuardar={guardarNueva} onCancelar={cerrar} error={crear.error} />}
      </Modal>

      <Modal abierto={dialogo?.tipo === 'editar'} titulo="Editar categoría" onCerrar={cerrar}>
        {dialogo?.tipo === 'editar' && (
          <CategoriaForm
            inicial={dialogo.categoria}
            onGuardar={guardarEdicion(dialogo.categoria.id)}
            onCancelar={cerrar}
            error={actualizar.error}
          />
        )}
      </Modal>

      <ConfirmModal
        abierto={dialogo?.tipo === 'eliminar'}
        titulo="Eliminar categoría"
        mensaje={
          dialogo?.tipo === 'eliminar'
            ? `¿Dar de baja «${dialogo.categoria.nombre}»? Sus productos seguirán en el catálogo hasta que los des de baja.`
            : ''
        }
        textoConfirmar="Dar de baja"
        cargando={eliminar.isPending}
        error={eliminar.error}
        onCerrar={cerrar}
        onConfirmar={() => {
          if (dialogo?.tipo === 'eliminar') eliminar.mutate(dialogo.categoria.id, { onSuccess: cerrar })
        }}
      />
    </div>
  )
}
