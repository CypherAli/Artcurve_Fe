import { authService } from './auth.service'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => mockFetch.mockReset())

const okJson = (data: unknown) => ({
  ok: true, status: 200,
  json: async () => ({ data }),
})

describe('authService', () => {
  it('nonce calls POST /auth/nonce', async () => {
    mockFetch.mockResolvedValue(okJson({ nonce: '123' }))
    const result = await authService.nonce('0xabc')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/auth/nonce')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ wallet_address: '0xabc' })
  })

  it('verify calls POST /auth/verify', async () => {
    mockFetch.mockResolvedValue(okJson({ access_token: 'jwt', user: {} }))
    await authService.verify('0xabc', 'sig', 'msg')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/auth/verify')
    expect(JSON.parse(opts.body)).toEqual({ wallet_address: '0xabc', signature: 'sig', message: 'msg' })
  })

  it('logout calls POST /auth/logout', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204 })
    await authService.logout()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/auth/logout')
    expect(opts.method).toBe('POST')
  })
})
