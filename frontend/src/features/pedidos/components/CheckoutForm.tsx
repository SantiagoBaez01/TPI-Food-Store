import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea, primerError } from '../../../shared/ui/Input'
import type { FormaPago } from '../types/pedido'

export interface DatosCheckout {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string | null
}

interface CheckoutFormProps {
  onConfirmar: (datos: DatosCheckout) => Promise<unknown>
  error: unknown
}

export function CheckoutForm({ onConfirmar, error }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: async ({ value }) => {
      try {
        await onConfirmar({
          direccion_entrega: value.direccion_entrega.trim(),
          forma_pago: value.forma_pago,
          notas: value.notas.trim() || null,
        })
      } catch {
        // El error de la API (p. ej. stock insuficiente) se muestra con la prop `error`.
      }
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const v = value.trim()
            if (v.length < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (v.length > 200) return 'Máximo 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="direccion_entrega"
            label="Dirección de entrega"
            placeholder="Calle, número, piso, ciudad"
            autoComplete="street-address"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>
      <form.Field name="forma_pago">
        {(field) => (
          <Select
            id="forma_pago"
            label="Forma de pago"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO')}
          >
            <option value="EFECTIVO">Efectivo (al recibir)</option>
            <option value="TRANSFERENCIA">Transferencia bancaria</option>
          </Select>
        )}
      </form.Field>
      <form.Field
        name="notas"
        validators={{ onChange: ({ value }) => (value.length > 500 ? 'Máximo 500 caracteres' : undefined) }}
      >
        {(field) => (
          <Textarea
            id="notas"
            label="Notas (opcional)"
            rows={3}
            placeholder="Ej.: tocar timbre 2B, sin cebolla…"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>

      <MensajeError error={error} />

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
