import { useState } from 'react'

interface ProductoImagenProps {
  src: string | null
  alt: string
  className?: string
}

/** Imagen del producto con un respaldo si la URL no carga o no existe. */
export function ProductoImagen({ src, alt, className = '' }: ProductoImagenProps) {
  const [fallo, setFallo] = useState(false)
  if (!src || fallo) {
    return (
      <div className={`flex items-center justify-center bg-brand-50 text-4xl ${className}`} aria-label={alt}>
        🍽️
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFallo(true)} className={`object-cover ${className}`} />
}
