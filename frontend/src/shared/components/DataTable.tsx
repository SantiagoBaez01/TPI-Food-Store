import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Input } from '../ui/Input'
import { Paginacion } from './Paginacion'

interface DataTableProps<TData> {
  datos: TData[]
  columnas: ColumnDef<TData>[]
  /** Muestra un buscador global sobre todas las columnas. */
  buscador?: boolean
  tamanoPagina?: number
}

/** Tabla del panel de administración con TanStack Table: orden, filtro y paginación del lado del cliente. */
export function DataTable<TData>({ datos, columnas, buscador = true, tamanoPagina = 10 }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: tamanoPagina } },
  })

  const { pageIndex } = table.getState().pagination

  return (
    <div className="space-y-3">
      {buscador && (
        <div className="max-w-xs">
          <Input
            id="tabla-buscar"
            placeholder="Buscar en la tabla…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-stone-600">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const orden = header.column.getIsSorted()
                  return (
                    <th key={header.id} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-stone-900"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-xs">{orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '↕'}</span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-3 py-8 text-center text-stone-500">
                  Sin resultados
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-stone-100 hover:bg-stone-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Paginacion
        pagina={pageIndex}
        totalPaginas={table.getPageCount()}
        total={table.getFilteredRowModel().rows.length}
        onCambiar={(p) => table.setPageIndex(p)}
      />
    </div>
  )
}
