import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import * as authApi from '../features/auth/api/auth'
import type { Rol, Usuario } from '../features/usuarios/types/usuario'
import { registrarSesionInvalida } from '../shared/api/axiosInstance'
import { queryClient } from '../shared/api/queryClient'

/** Datos de sesión que se guardan en el cliente: nunca el token (viaja en la cookie HttpOnly). */
export interface UsuarioSesion {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
}

interface AuthState {
  usuario: UsuarioSesion | null
  /** true mientras checkSession confirma la sesión con /auth/me. */
  cargando: boolean
  login: (username: string, password: string) => Promise<UsuarioSesion>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiar: () => void
}

function aSesion(u: Usuario): UsuarioSesion {
  return { id: u.id, username: u.username, full_name: u.full_name, email: u.email, role: u.role }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await authApi.login(username, password)
        const usuario = aSesion(await authApi.getMe())
        queryClient.clear()
        set({ usuario, cargando: false })
        return usuario
      },

      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          queryClient.clear()
          set({ usuario: null, cargando: false })
        }
      },

      checkSession: async () => {
        set({ cargando: true })
        try {
          const usuario = aSesion(await authApi.getMe())
          set({ usuario, cargando: false })
        } catch {
          set({ usuario: null, cargando: false })
        }
      },

      limpiar: () => {
        queryClient.clear()
        set({ usuario: null, cargando: false })
      },
    }),
    {
      name: 'foodstore-auth',
      storage: createJSONStorage(() => localStorage),
      // Solo se persiste el usuario (nombre, email y rol); nunca el token.
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

// Ante un 401 o una cuenta desactivada, el interceptor de Axios limpia la sesión.
registrarSesionInvalida(() => useAuthStore.getState().limpiar())
