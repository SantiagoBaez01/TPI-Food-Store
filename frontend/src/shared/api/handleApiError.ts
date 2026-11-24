import { isAxiosError } from 'axios'

interface ValidationIssue {
  loc?: (string | number)[]
  msg?: string
}

function esValidationIssue(valor: unknown): valor is ValidationIssue {
  return typeof valor === 'object' && valor !== null && 'msg' in valor
}

/** Convierte el `detail` de la API (string o lista de errores 422) en un mensaje para la pantalla. */
export function handleApiError(error: unknown): string {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?'
    const detail = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .filter(esValidationIssue)
        .map((issue) => {
          const campo = issue.loc?.filter((p) => p !== 'body').join('.')
          return campo ? `${campo}: ${issue.msg ?? ''}` : (issue.msg ?? '')
        })
        .join(' · ')
    }
    return `Error ${error.response.status}`
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado'
}
