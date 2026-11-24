import type { ReactNode } from 'react'

interface EstadoVacioProps {
  titulo: string
  mensaje?: string
  icono?: string
  accion?: ReactNode
}

export function EstadoVacio({ titulo, mensaje, icono = '🍽️', accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="text-4xl">{icono}</span>
      <p className="text-lg font-semibold">{titulo}</p>
      {mensaje && <p className="text-stone-500">{mensaje}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
