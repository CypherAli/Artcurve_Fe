import { useAuthStore } from './authStore'
import type { AuthUser } from '@/types/api'

const mockUser: AuthUser = {
  id: 'u1',
  wallet_address: '0xabc',
  username: 'alice',
  avatar_url: null,
  is_verified: false,
  role: 'user',
}

beforeEach(() => {
  useAuthStore.setState({ jwt: null, user: null, isAuthenticated: false })
})

describe('useAuthStore', () => {
  it('starts unauthenticated', () => {
    const s = useAuthStore.getState()
    expect(s.jwt).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })

  it('setAuth stores jwt and user', () => {
    useAuthStore.getState().setAuth('tok', mockUser)
    const s = useAuthStore.getState()
    expect(s.jwt).toBe('tok')
    expect(s.user).toEqual(mockUser)
    expect(s.isAuthenticated).toBe(true)
  })

  it('clearAuth resets state', () => {
    useAuthStore.getState().setAuth('tok', mockUser)
    useAuthStore.getState().clearAuth()
    const s = useAuthStore.getState()
    expect(s.jwt).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })
})
