import { api } from '../../../shared/api/axiosInstance'
import type { UserCreate, Usuario } from '../../usuarios/types/usuario'

interface MessageResponse {
  message: string
}

/** Login con formulario OAuth2: el backend responde con la cookie HttpOnly, no con el token. */
export async function login(username: string, password: string): Promise<MessageResponse> {
  const form = new URLSearchParams({ username, password })
  const { data } = await api.post<MessageResponse>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function register(payload: UserCreate): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/register', payload)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/auth/me')
  return data
}
