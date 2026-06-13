import { authStore } from './auth-store'

const mockStorage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => mockStorage[key] ?? null),
      setItem: jest.fn((key: string, val: string) => { mockStorage[key] = val }),
      removeItem: jest.fn((key: string) => { delete mockStorage[key] }),
    },
    writable: true,
  })
})

describe('authStore', () => {
  describe('JWT', () => {
    it('should store and retrieve JWT', () => {
      authStore.setJwt('my-token')
      expect(authStore.getJwt()).toBe('my-token')
    })

    it('should return null when no JWT', () => {
      expect(authStore.getJwt()).toBeNull()
    })
  })

  describe('User', () => {
    it('should store and retrieve user', () => {
      const user = { id: '1', wallet_address: '0x123', username: 'test' }
      authStore.setUser(user as any)
      expect(authStore.getUser()).toEqual(user)
    })

    it('should return null when no user stored', () => {
      expect(authStore.getUser()).toBeNull()
    })

    it('should return null for invalid JSON', () => {
      mockStorage['artcurve_user'] = 'invalid-json'
      expect(authStore.getUser()).toBeNull()
    })
  })

  describe('bearerHeader', () => {
    it('should return Bearer token when JWT exists', () => {
      authStore.setJwt('abc123')
      expect(authStore.bearerHeader()).toBe('Bearer abc123')
    })

    it('should return null when no JWT', () => {
      expect(authStore.bearerHeader()).toBeNull()
    })
  })

  describe('clear', () => {
    it('should remove JWT and user', () => {
      authStore.setJwt('token')
      authStore.setUser({ id: '1' } as any)
      authStore.clear()
      expect(authStore.getJwt()).toBeNull()
      expect(authStore.getUser()).toBeNull()
    })
  })
})
