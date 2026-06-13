import { notificationService } from './notification.service'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => mockFetch.mockReset())

describe('notificationService', () => {
  it('list calls GET /notifications with limit', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) })
    await notificationService.list(10)
    expect(mockFetch.mock.calls[0][0]).toContain('/notifications?limit=10')
  })

  it('unreadCount calls GET /notifications/unread-count', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { count: 5 } }) })
    const result = await notificationService.unreadCount()
    expect(mockFetch.mock.calls[0][0]).toContain('/notifications/unread-count')
    expect(result).toEqual({ count: 5 })
  })

  it('markAllRead calls PATCH /notifications/read-all', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204 })
    await notificationService.markAllRead()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/notifications/read-all')
    expect(opts.method).toBe('PATCH')
  })

  it('deleteOne calls DELETE /notifications/:id', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204 })
    await notificationService.deleteOne('n1')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/notifications/n1')
    expect(opts.method).toBe('DELETE')
  })
})
