import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input, primerError } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [errorApi, setErrorApi] = useState<string | null>(null)
  const destino = (location.state as LocationState | null)?.from

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setErrorApi(null)
      try {
        const u = await login(value.username.trim(), value.password)
        navigate(destino ?? (u.role === 'admin' ? '/admin/resumen' : '/'), { replace: true })
      } catch (error) {
        setErrorApi(handleApiError(error))
      }
    },
  })


  return (
    <div className="mx-auto max-w-sm py-8">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Ingresar</h1>
        <p className="mb-5 text-sm text-stone-500">Accedé con tu usuario para hacer pedidos.</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (!value.trim() ? 'Ingresá tu usuario' : undefined) }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (!value ? 'Ingresá tu contraseña' : undefined) }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>

          {errorApi && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorApi}</p>}

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
