import { ApiError, request } from './http'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('ApiError', () => {
  it('should create error with status and message', () => {
    const err = new ApiError(404, 'Not Found')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not Found')
    expect(err.name).toBe('ApiError')
  })

  it('isUnauthorized should be true for 401', () => {
    expect(new ApiError(401, 'Unauthorized').isUnauthorized).toBe(true)
    expect(new ApiError(403, 'Forbidden').isUnauthorized).toBe(false)
  })

  it('isNotFound should be true for 404', () => {
    expect(new ApiError(404, 'Not Found').isNotFound).toBe(true)
    expect(new ApiError(500, 'Server Error').isNotFound).toBe(false)
  })
})

describe('request', () => {
  it('should return data from successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: '1', name: 'test' } }),
    })

    const result = await request<{ id: string; name: string }>('/test')
    expect(result).toEqual({ id: '1', name: 'test' })
  })

  it('should handle list responses without unwrapping', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: '1' }], total: 1, page: 1 }),
    })

    const result = await request<{ data: { id: string }[]; total: number; page: number }>('/artworks')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('data')
  })

  it('should handle 204 No Content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    })

    const result = await request('/notifications/read-all', { method: 'PATCH' })
    expect(result).toBeUndefined()
  })

  it('should throw ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Artwork not found' }),
    })

    await expect(request('/artworks/bad-id')).rejects.toThrow(ApiError)
    await expect(request('/artworks/bad-id')).rejects.toMatchObject({
      status: 404,
      message: 'Artwork not found',
    })
  })

  it('should throw ApiError with statusText when body parse fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => { throw new Error('not json') },
    })

    await expect(request('/crash')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    })
  })

  it('should handle array error messages', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: ['field1 is required', 'field2 is invalid'] }),
    })

    await expect(request('/validate')).rejects.toMatchObject({
      message: 'field1 is required',
    })
  })
})
