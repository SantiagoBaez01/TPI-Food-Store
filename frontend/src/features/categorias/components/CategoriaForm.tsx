import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Textarea, primerError } from '../../../shared/ui/Input'
import type { Categoria, CategoriaCreate } from '../types/categoria'

interface CategoriaFormProps {
  inicial?: Categoria
  onGuardar: (datos: CategoriaCreate) => Promise<unknown>
  onCancelar: () => void
  error: unknown
}

export function CategoriaForm({ inicial, onGuardar, onCancelar, error }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      try {
        await onGuardar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null })
      } catch {
        // El error de la API (p. ej. 409 nombre duplicado) se muestra con la prop `error`.
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
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const v = value.trim()
            if (v.length < 2) return 'Mínimo 2 caracteres'
            if (v.length > 100) return 'Máximo 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="cat-nombre"
            label="Nombre"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            error={primerError(field.state.meta)}
          />
        )}
      </form.Field>
      <form.Field name="descripcion">
        {(field) => (
          <Textarea
            id="cat-descripcion"
            label="Descripción"
            rows={3}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
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
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
