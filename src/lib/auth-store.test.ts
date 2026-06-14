import { authStore } from './auth-store'
import { useAuthStore } from '@/store/authStore'

beforeEach(() => {
  // Reset Zustand store before each test
  useAuthStore.getState().clearAuth()
})

describe('authStore (Zustand wrapper)', () => {
  describe('JWT', () => {
    it('should store and retrieve JWT', () => {
      useAuthStore.getState().setAuth('my-token', { id: '1', wallet_address: '0x1', username: null, avatar_url: null, role: 'user', is_verified: false })
      expect(authStore.getJwt()).toBe('my-token')
    })

    it('should return null when no JWT', () => {
      expect(authStore.getJwt()).toBeNull()
    })
  })

  describe('User', () => {
    it('should store and retrieve user', () => {
      const user = { id: '1', wallet_address: '0x123', username: 'test', avatar_url: null, role: 'user' as const, is_verified: false }
      useAuthStore.getState().setAuth('tok', user)
      expect(authStore.getUser()).toEqual(user)
    })

    it('should return null when no user stored', () => {
      expect(authStore.getUser()).toBeNull()
    })
  })

  describe('bearerHeader', () => {
    it('should return Bearer token when JWT exists', () => {
      useAuthStore.getState().setAuth('abc123', { id: '1', wallet_address: '0x1', username: null, avatar_url: null, role: 'user', is_verified: false })
      expect(authStore.bearerHeader()).toBe('Bearer abc123')
    })

    it('should return null when no JWT', () => {
      expect(authStore.bearerHeader()).toBeNull()
    })
  })

  describe('clear', () => {
    it('should remove JWT and user', () => {
      useAuthStore.getState().setAuth('token', { id: '1', wallet_address: '0x1', username: null, avatar_url: null, role: 'user', is_verified: false })
      authStore.clear()
      expect(authStore.getJwt()).toBeNull()
      expect(authStore.getUser()).toBeNull()
    })
  })

  describe('setJwt', () => {
    it('should update JWT while keeping user', () => {
      const user = { id: '1', wallet_address: '0x1', username: null, avatar_url: null, role: 'user' as const, is_verified: false }
      useAuthStore.getState().setAuth('old', user)
      authStore.setJwt('new-token')
      expect(authStore.getJwt()).toBe('new-token')
      expect(authStore.getUser()).toEqual(user)
    })
  })

  describe('setUser', () => {
    it('should update user while keeping JWT', () => {
      const user1 = { id: '1', wallet_address: '0x1', username: null, avatar_url: null, role: 'user' as const, is_verified: false }
      const user2 = { id: '2', wallet_address: '0x2', username: 'updated', avatar_url: null, role: 'user' as const, is_verified: true }
      useAuthStore.getState().setAuth('tok', user1)
      authStore.setUser(user2)
      expect(authStore.getUser()).toEqual(user2)
      expect(authStore.getJwt()).toBe('tok')
    })
  })
})
