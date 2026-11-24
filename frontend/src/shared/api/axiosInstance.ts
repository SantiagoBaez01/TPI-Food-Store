import axios, { AxiosError } from 'axios'

/**
 * Cliente HTTP único. withCredentials: el navegador adjunta la cookie HttpOnly
 * access_token en cada petición; el frontend nunca lee ni guarda el token.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  withCredentials: true,
})

const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'
const RUTAS_SIN_LIMPIEZA = ['/auth/token', '/auth/me']

let onSesionInvalida: (() => void) | null = null

/** El authStore registra aquí cómo limpiar la sesión (evita una importación circular). */
export function registrarSesionInvalida(callback: () => void): void {
  onSesionInvalida = callback
}

interface ErrorDetail {
  detail?: unknown
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorDetail>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const detail = error.response?.data?.detail
    const esRutaAuth = RUTAS_SIN_LIMPIEZA.some((ruta) => url.endsWith(ruta))

    // 401 fuera del login y de /me, o cuenta desactivada: la sesión dejó de ser válida.
    // ProtectedRoute redirige a /login al quedar sin usuario.
    if ((status === 401 && !esRutaAuth) || (status === 400 && detail === CUENTA_DESACTIVADA)) {
      onSesionInvalida?.()
    }
    return Promise.reject(error)
  },
)
