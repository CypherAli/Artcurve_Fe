import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/api'

interface AuthState {
  jwt:          string | null
  refreshToken: string | null
  user:         AuthUser | null
  /** Set full auth state. refreshToken là optional — nếu không truyền sẽ giữ giá trị cũ. */
  setAuth:   (jwt: string, user: AuthUser, refreshToken?: string) => void
  /** Cập nhật token sau khi silent-refresh — giữ nguyên user hiện tại. */
  setTokens: (jwt: string, refreshToken?: string) => void
  clearAuth: () => void
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      jwt:          null,
      refreshToken: null,
      user:         null,
      isAuthenticated: false,
      setAuth: (jwt, user, refreshToken) =>
        set({
          jwt,
          user,
          // giữ refreshToken cũ nếu lần gọi này không cung cấp (vd: hydrate profile)
          refreshToken: refreshToken ?? get().refreshToken,
          isAuthenticated: true,
        }),
      setTokens: (jwt, refreshToken) =>
        set({
          jwt,
          refreshToken: refreshToken ?? get().refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({ jwt: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    { name: 'artcurve-auth' },
  )
)
