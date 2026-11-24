import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, primerError } from '../../../shared/ui/Input'
import type { Producto, ProductoStockUpdate } from '../types/producto'

interface StockFormProps {
  producto: Producto
  onGuardar: (datos: ProductoStockUpdate) => Promise<unknown>
  onCancelar: () => void
  error: unknown
}

/** Formulario de PATCH /productos/{id}/stock: stock y disponibilidad. */
export function StockForm({ producto, onGuardar, onCancelar, error }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: producto.stock, disponible: producto.disponible },
    onSubmit: async ({ value }) => {
      try {
        await onGuardar(value)
      } catch {
        // El error de la API se muestra con la prop `error` (estado de la mutación).
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
      <p className="text-sm text-stone-600">
        Producto: <strong>{producto.nombre}</strong>
      </p>
      <form.Field
        name="stock"
        validators={{ onChange: ({ value }) => (!Number.isInteger(value) || value < 0 ? 'Entero ≥ 0' : undefined) }}
      >
        {(field) => (
          <Input
            id="stock-cantidad"
            label="Stock"
            type="number"
            min={0}
            step={1}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.valueAsNumber)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>
      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>
      <MensajeError error={error} />
      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting}>
              Actualizar stock
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
