import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'

import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError, MensajeError } from '../../../shared/components/EstadoError'
import { SkeletonTabla } from '../../../shared/components/Skeleton'
import { formatFecha } from '../../../shared/utils/format'
import { Button } from '../../../shared/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'
import type { Usuario } from '../types/usuario'

export function AdminUsuariosPage() {
  const usuarios = useUsuarios()
  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const sesionId = useAuthStore((s) => s.usuario?.id)

  const columnas = useMemo<ColumnDef<Usuario>[]>(
    () => [
      { accessorKey: 'username', header: 'Usuario', cell: ({ row }) => <span className="font-medium">@{row.original.username}</span> },
      { accessorKey: 'full_name', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.original.role === 'admin' ? 'bg-violet-100 text-violet-800' : 'bg-stone-100 text-stone-700'}`}
          >
            {row.original.role}
          </span>
        ),
      },
      {
        id: 'estado',
        accessorFn: (u) => (u.disabled ? 'Inactivo' : 'Activo'),
        header: 'Estado',
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="text-red-600">Inactivo</span>
          ) : (
            <span className="text-emerald-700">Activo</span>
          ),
      },
      { accessorKey: 'created_at', header: 'Alta', cell: ({ row }) => formatFecha(row.original.created_at) },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          if (u.id === sesionId) return <span className="text-xs text-stone-400">Tu cuenta</span>
          return u.disabled ? (
            <Button tamano="sm" variante="exito" cargando={activar.isPending && activar.variables === u.id} onClick={() => activar.mutate(u.id)}>
              Activar
            </Button>
          ) : (
            <Button
              tamano="sm"
              variante="peligro"
              cargando={desactivar.isPending && desactivar.variables === u.id}
              onClick={() => desactivar.mutate(u.id)}
            >
              Desactivar
            </Button>
          )
        },
      },
    ],
    [activar, desactivar, sesionId],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-stone-500">Un usuario desactivado no puede iniciar sesión ni operar.</p>
      </div>
      <MensajeError error={activar.error ?? desactivar.error} />
      {usuarios.isPending ? (
        <SkeletonTabla />
      ) : usuarios.isError ? (
        <EstadoError error={usuarios.error} onReintentar={() => void usuarios.refetch()} />
      ) : (
        <DataTable datos={usuarios.data} columnas={columnas} />
      )}
    </div>
  )
}
