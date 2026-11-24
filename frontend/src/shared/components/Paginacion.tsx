import { Button } from '../ui/Button'

interface PaginacionProps {
  /** Página actual, empezando en 0. */
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
  total?: number
}

export function Paginacion({ pagina, totalPaginas, onCambiar, total }: PaginacionProps) {
  if (totalPaginas <= 1 && total === undefined) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
      <span>
        Página {Math.min(pagina + 1, Math.max(totalPaginas, 1))} de {Math.max(totalPaginas, 1)}
        {total !== undefined && ` · ${total} resultado${total === 1 ? '' : 's'}`}
      </span>
      <div className="flex gap-2">
        <Button variante="secundario" tamano="sm" disabled={pagina <= 0} onClick={() => onCambiar(pagina - 1)}>
          ← Anterior
        </Button>
        <Button
          variante="secundario"
          tamano="sm"
          disabled={pagina + 1 >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
