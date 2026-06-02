// ─────────────────────────────────────────────────────────────────
//  lib/auth-store.ts  —  Thin localStorage wrapper for JWT + user
//
//  All reads are SSR-safe (typeof window guard).
//  Import anywhere — server components won't throw.
// ─────────────────────────────────────────────────────────────────

import type { AuthUser } from '@/types/api'

const JWT_KEY  = 'artcurve_jwt'
const USER_KEY = 'artcurve_user'

const ok = () => typeof window !== 'undefined'

export const authStore = {
  // JWT
  getJwt():              string | null { return ok() ? localStorage.getItem(JWT_KEY)  : null },
  setJwt(t: string):     void          { if (ok()) localStorage.setItem(JWT_KEY, t) },

  // User
  getUser(): AuthUser | null {
    if (!ok()) return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try   { return JSON.parse(raw) as AuthUser }
    catch { return null }
  },
  setUser(u: AuthUser): void { if (ok()) localStorage.setItem(USER_KEY, JSON.stringify(u)) },

  // Convenience
  bearerHeader(): string | null {
    const t = this.getJwt()
    return t ? `Bearer ${t}` : null
  },

  clear(): void {
    if (!ok()) return
    localStorage.removeItem(JWT_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
