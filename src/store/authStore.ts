import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/api'

interface AuthState {
  jwt:     string | null
  user:    AuthUser | null
  setAuth: (jwt: string, user: AuthUser) => void
  clearAuth: () => void
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      jwt:     null,
      user:    null,
      isAuthenticated: false,
      setAuth: (jwt, user) => set({ jwt, user, isAuthenticated: true }),
      clearAuth: ()        => set({ jwt: null, user: null, isAuthenticated: false }),
    }),
    { name: 'artcurve-auth' },
  )
)
