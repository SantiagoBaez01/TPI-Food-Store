import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  ancho?: 'md' | 'lg'
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = 'md' }: ModalProps) {
  // Cierra con Escape (efecto de UI, no obtiene datos del servidor).
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl ${ancho === 'lg' ? 'max-w-2xl' : 'max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="rounded p-1 text-stone-500 hover:bg-stone-100" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
