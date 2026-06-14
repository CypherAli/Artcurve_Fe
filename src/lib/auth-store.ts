// ─────────────────────────────────────────────────────────────────
//  lib/auth-store.ts  —  Thin wrapper over Zustand authStore
//
//  Delegates ALL reads/writes to useAuthStore (single source of truth).
//  Kept as a compatibility shim so non-React code (http.ts, etc.)
//  can access auth state without React hooks.
//  SSR-safe — returns null on the server side.
// ─────────────────────────────────────────────────────────────────

import type { AuthUser } from '@/types/api'
import { useAuthStore } from '@/store/authStore'

export const authStore = {
  // JWT
  getJwt(): string | null {
    return useAuthStore.getState().jwt
  },
  setJwt(t: string): void {
    const { user } = useAuthStore.getState()
    // If user already exists, keep it; otherwise set jwt with null user
    useAuthStore.getState().setAuth(t, user!)
  },

  // User
  getUser(): AuthUser | null {
    return useAuthStore.getState().user
  },
  setUser(u: AuthUser): void {
    const { jwt } = useAuthStore.getState()
    if (jwt) {
      useAuthStore.getState().setAuth(jwt, u)
    }
  },

  // Convenience
  bearerHeader(): string | null {
    const t = this.getJwt()
    return t ? `Bearer ${t}` : null
  },

  clear(): void {
    useAuthStore.getState().clearAuth()
  },
}
