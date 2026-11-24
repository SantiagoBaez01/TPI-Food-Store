import { useForm } from '@tanstack/react-form'

import { MensajeError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea, primerError } from '../../../shared/ui/Input'
import type { Categoria } from '../../categorias/types/categoria'
import type { Producto, ProductoCreate } from '../types/producto'

interface ProductoFormProps {
  inicial?: Producto
  categorias: Categoria[]
  onGuardar: (datos: ProductoCreate) => Promise<unknown>
  onCancelar: () => void
  error: unknown
}

export function ProductoForm({ inicial, categorias, onGuardar, onCancelar, error }: ProductoFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio_base: inicial?.precio_base ?? 0,
      imagen_url: inicial?.imagen_url ?? '',
      stock: inicial?.stock ?? 0,
      disponible: inicial?.disponible ?? true,
      categoria_id: inicial?.categoria_id ?? categorias[0]?.id ?? 0,
    },
    onSubmit: async ({ value }) => {
      try {
        await onGuardar({
          nombre: value.nombre.trim(),
          descripcion: value.descripcion.trim() || null,
          precio_base: value.precio_base,
          imagen_url: value.imagen_url.trim() || null,
          stock: value.stock,
          disponible: value.disponible,
          categoria_id: value.categoria_id,
        })
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
      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => (value.trim().length < 2 ? 'Mínimo 2 caracteres' : value.length > 150 ? 'Máximo 150' : undefined),
        }}
      >
        {(field) => (
          <Input
            id="prod-nombre"
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
            id="prod-descripcion"
            label="Descripción"
            rows={2}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="precio_base"
          validators={{ onChange: ({ value }) => (Number.isNaN(value) || value < 0 ? 'Debe ser ≥ 0' : undefined) }}
        >
          {(field) => (
            <Input
              id="prod-precio"
              label="Precio base"
              type="number"
              min={0}
              step="0.01"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
              error={primerError(field.state.meta)}
            />
          )}
        </form.Field>
        <form.Field
          name="stock"
          validators={{
            onChange: ({ value }) => (!Number.isInteger(value) || value < 0 ? 'Entero ≥ 0' : undefined),
          }}
        >
          {(field) => (
            <Input
              id="prod-stock"
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
      </div>
      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (!value ? 'Elegí una categoría' : undefined) }}
      >
        {(field) => (
          <Select
            id="prod-categoria"
            label="Categoría"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(Number(e.target.value))}
            error={primerError(field.state.meta)}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </form.Field>
      <form.Field name="imagen_url">
        {(field) => (
          <Input
            id="prod-imagen"
            label="URL de la imagen"
            placeholder="https://…"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
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
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
