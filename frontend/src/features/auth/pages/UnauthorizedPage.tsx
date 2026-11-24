import { Link } from 'react-router-dom'

import { Button } from '../../../shared/ui/Button'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'

export function UnauthorizedPage() {
  return (
    <div className="py-10">
      <EstadoVacio
        icono="🚫"
        titulo="No tenés permiso para ver esta página"
        mensaje="Esta sección es solo para administradores."
        accion={
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        }
      />
    </div>
  )
}
