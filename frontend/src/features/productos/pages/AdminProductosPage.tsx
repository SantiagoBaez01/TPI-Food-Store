import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { ConfirmModal } from '../../../shared/components/ConfirmModal'
import { DataTable } from '../../../shared/components/DataTable'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { SkeletonTabla } from '../../../shared/components/Skeleton'
import { formatPrecio } from '../../../shared/utils/format'
import { Button } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoForm } from '../components/ProductoForm'
import { ProductoImagen } from '../components/ProductoImagen'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto'

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }
  | null

export function AdminProductosPage() {
  // El panel pide limit=100 y pagina del lado del cliente con TanStack Table.
  const productos = useProductos({ skip: 0, limit: 100 })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const actualizarStock = useActualizarStock()
  const eliminar = useEliminarProducto()
  const [dialogo, setDialogo] = useState<Dialogo>(null)

  const cerrar = () => {
    setDialogo(null)
    crear.reset()
    actualizar.reset()
    actualizarStock.reset()
    eliminar.reset()
  }

  const columnas = useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        id: 'imagen',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <ProductoImagen src={row.original.imagen_url} alt={row.original.nombre} className="h-10 w-14 rounded text-lg" />
        ),
      },
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'nombre', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      { id: 'categoria', accessorFn: (p) => p.categoria.nombre, header: 'Categoría' },
      { accessorKey: 'precio_base', header: 'Precio', cell: ({ row }) => formatPrecio(row.original.precio_base) },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <span className={row.original.stock === 0 ? 'font-semibold text-red-600' : ''}>{row.original.stock}</span>
        ),
      },
      {
        accessorKey: 'disponible',
        header: 'Disponible',
        cell: ({ row }) =>
          row.original.disponible ? (
            <span className="text-emerald-700">Sí</span>
          ) : (
            <span className="text-stone-500">No</span>
          ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button tamano="sm" variante="secundario" onClick={() => setDialogo({ tipo: 'editar', producto: row.original })}>
              Editar
            </Button>
            <Button tamano="sm" variante="secundario" onClick={() => setDialogo({ tipo: 'stock', producto: row.original })}>
              Stock
            </Button>
            <Button tamano="sm" variante="fantasma" className="text-red-600" onClick={() => setDialogo({ tipo: 'eliminar', producto: row.original })}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const guardarNuevo = (datos: ProductoCreate) => crear.mutateAsync(datos).then(cerrar)
  const guardarEdicion = (id: number) => (datos: ProductoCreate) =>
    actualizar.mutateAsync({ id, payload: datos }).then(cerrar)
  const guardarStock = (id: number) => (datos: ProductoStockUpdate) =>
    actualizarStock.mutateAsync({ id, payload: datos }).then(cerrar)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-stone-500">Alta, edición, stock y baja lógica.</p>
        </div>
        <Button onClick={() => setDialogo({ tipo: 'crear' })} disabled={!categorias.data?.length}>
          + Nuevo producto
        </Button>
      </div>

      {productos.isPending ? (
        <SkeletonTabla />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : productos.data.items.length === 0 ? (
        <EstadoVacio titulo="No hay productos" mensaje="Creá el primero con «Nuevo producto»." />
      ) : (
        <DataTable datos={productos.data.items} columnas={columnas} />
      )}

      <Modal abierto={dialogo?.tipo === 'crear'} titulo="Nuevo producto" onCerrar={cerrar}>
        {dialogo?.tipo === 'crear' && (
          <ProductoForm categorias={categorias.data ?? []} onGuardar={guardarNuevo} onCancelar={cerrar} error={crear.error} />
        )}
      </Modal>

      <Modal abierto={dialogo?.tipo === 'editar'} titulo="Editar producto" onCerrar={cerrar}>
        {dialogo?.tipo === 'editar' && (
          <ProductoForm
            inicial={dialogo.producto}
            categorias={categorias.data ?? []}
            onGuardar={guardarEdicion(dialogo.producto.id)}
            onCancelar={cerrar}
            error={actualizar.error}
          />
        )}
      </Modal>

      <Modal abierto={dialogo?.tipo === 'stock'} titulo="Stock y disponibilidad" onCerrar={cerrar}>
        {dialogo?.tipo === 'stock' && (
          <StockForm
            producto={dialogo.producto}
            onGuardar={guardarStock(dialogo.producto.id)}
            onCancelar={cerrar}
            error={actualizarStock.error}
          />
        )}
      </Modal>

      <ConfirmModal
        abierto={dialogo?.tipo === 'eliminar'}
        titulo="Eliminar producto"
        mensaje={dialogo?.tipo === 'eliminar' ? `¿Dar de baja «${dialogo.producto.nombre}»? Dejará de verse en el catálogo.` : ''}
        textoConfirmar="Dar de baja"
        cargando={eliminar.isPending}
        error={eliminar.error}
        onCerrar={cerrar}
        onConfirmar={() => {
          if (dialogo?.tipo === 'eliminar') eliminar.mutate(dialogo.producto.id, { onSuccess: cerrar })
        }}
      />
    </div>
  )
}
