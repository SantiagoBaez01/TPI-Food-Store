import { useDeferredValue, useState } from 'react'

import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Paginacion } from '../../../shared/components/Paginacion'
import { Skeleton } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Input, Select } from '../../../shared/ui/Input'
import { useCategorias } from '../../categorias/hooks/useCategorias'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'

const LIMIT = 8

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  // Difiere la búsqueda para no disparar una consulta por cada tecla.
  const search = useDeferredValue(busqueda.trim())

  const categorias = useCategorias()
  const productos = useProductos({
    skip: pagina * LIMIT, // paginación en el servidor
    limit: LIMIT,
    search: search || undefined,
    categoria_id: categoriaId,
  })

  const totalPaginas = productos.data ? Math.ceil(productos.data.total / LIMIT) : 0
  const hayFiltros = Boolean(busqueda || categoriaId)

  const limpiar = () => {
    setBusqueda('')
    setCategoriaId(undefined)
    setPagina(0)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-stone-500">Elegí tus comidas favoritas y armá tu pedido.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <Input
          id="buscar"
          label="Buscar"
          placeholder="Pizza, hamburguesa…"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPagina(0)
          }}
        />
        <Select
          id="categoria"
          label="Categoría"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
            setPagina(0)
          }}
        >
          <option value="">Todas</option>
          {categorias.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Button variante="secundario" onClick={limpiar} disabled={!hayFiltros}>
          Limpiar
        </Button>
      </div>

      {productos.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: LIMIT }, (_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : productos.data.items.length === 0 ? (
        <EstadoVacio
          icono="🔍"
          titulo="No encontramos productos"
          mensaje={hayFiltros ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
          accion={hayFiltros && <Button variante="secundario" onClick={limpiar}>Ver todo</Button>}
        />
      ) : (
        <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${productos.isPlaceholderData ? 'opacity-60' : ''}`}>
          {productos.data.items.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      )}

      {productos.data && productos.data.total > 0 && (
        <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={productos.data.total} onCambiar={setPagina} />
      )}
    </div>
  )
}
