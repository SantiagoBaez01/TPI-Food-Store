import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { MensajeError } from './EstadoError'

interface ConfirmModalProps {
  abierto: boolean
  titulo: string
  mensaje: string
  textoConfirmar?: string
  cargando?: boolean
  error?: unknown
  onConfirmar: () => void
  onCerrar: () => void
}

export function ConfirmModal({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  cargando = false,
  error,
  onConfirmar,
  onCerrar,
}: ConfirmModalProps) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCerrar}>
      <p className="mb-4 text-stone-600">{mensaje}</p>
      <MensajeError error={error} />
      <div className="mt-4 flex justify-end gap-2">
        <Button variante="secundario" onClick={onCerrar}>
          Volver
        </Button>
        <Button variante="peligro" cargando={cargando} onClick={onConfirmar}>
          {textoConfirmar}
        </Button>
      </div>
    </Modal>
  )
}
