import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { handleApiError } from '../../../shared/api/handleApiError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input, primerError } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'
import { register } from '../api/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[A-Za-z0-9_.-]+$/

export function RegisterPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [errorApi, setErrorApi] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirmar: '' },
    onSubmit: async ({ value }) => {
      setErrorApi(null)
      try {
        await register({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        })
        // Tras registrarse, inicia sesión automáticamente.
        await login(value.username.trim(), value.password)
        navigate('/', { replace: true })
      } catch (error) {
        setErrorApi(handleApiError(error))
      }
    },
  })


  return (
    <div className="mx-auto max-w-md py-8">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Crear cuenta</h1>
        <p className="mb-5 text-sm text-stone-500">Registrate para comprar en Food Store.</p>
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
            validators={{
              onChange: ({ value }) => {
                const v = value.trim()
                if (v.length < 3) return 'Mínimo 3 caracteres'
                if (v.length > 50) return 'Máximo 50 caracteres'
                if (!USERNAME_RE.test(v)) return 'Solo letras, números, punto, guion y guion bajo'
                return undefined
              },
            }}
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
            name="full_name"
            validators={{ onChange: ({ value }) => (value.trim().length < 2 ? 'Ingresá tu nombre completo' : undefined) }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Nombre completo"
                autoComplete="name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>
          <form.Field
            name="email"
            validators={{ onChange: ({ value }) => (!EMAIL_RE.test(value.trim()) ? 'Email inválido' : undefined) }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value.length < 8 ? 'Mínimo 8 caracteres' : undefined) }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta)}
              />
            )}
          </form.Field>
          <form.Field
            name="confirmar"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue('password') ? 'Las contraseñas no coinciden' : undefined,
            }}
          >
            {(field) => (
              <Input
                id={field.name}
                label="Repetir contraseña"
                type="password"
                autoComplete="new-password"
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
                Crear cuenta
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="mt-4 text-center text-sm text-stone-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Ingresá
          </Link>
        </p>
      </Card>
    </div>
  )
}
