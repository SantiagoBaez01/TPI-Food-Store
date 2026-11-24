import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-100'

interface CampoProps {
  label?: string
  error?: string
  id: string
  children: ReactNode
}

/** Envoltorio de label + control + mensaje de error. */
function Campo({ label, error, id, children }: CampoProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  id: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <Campo label={label} error={error} id={id}>
      <input id={id} className={`${base} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
    </Campo>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  id: string
}

export function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  return (
    <Campo label={label} error={error} id={id}>
      <select id={id} className={`${base} ${error ? 'border-red-400' : ''} ${className}`} {...props}>
        {children}
      </select>
    </Campo>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  id: string
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  return (
    <Campo label={label} error={error} id={id}>
      <textarea id={id} className={`${base} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
    </Campo>
  )
}

/** Primer error de un campo de TanStack Form, solo si el campo ya fue tocado. */
export function primerError(meta: { isTouched: boolean; errors: unknown[] }): string | undefined {
  if (!meta.isTouched) return undefined
  const error = meta.errors.find((e) => typeof e === 'string')
  return typeof error === 'string' ? error : undefined
}
