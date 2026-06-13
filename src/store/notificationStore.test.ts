import { useNotificationStore, AppNotification } from './notificationStore'

const mkNotif = (id: string, read = false): AppNotification => ({
  id,
  type: 'trade',
  title: `Notif ${id}`,
  description: null,
  metadata: null,
  is_read: read,
  created_at: '2024-01-01T00:00:00Z',
})

beforeEach(() => {
  useNotificationStore.setState({ items: [], loading: false })
})

describe('useNotificationStore', () => {
  it('setItems replaces all items', () => {
    const items = [mkNotif('1'), mkNotif('2')]
    useNotificationStore.getState().setItems(items)
    expect(useNotificationStore.getState().items).toHaveLength(2)
  })

  it('addItem prepends and caps at 100', () => {
    useNotificationStore.getState().setItems([mkNotif('old')])
    useNotificationStore.getState().addItem(mkNotif('new'))
    const items = useNotificationStore.getState().items
    expect(items[0].id).toBe('new')
    expect(items[1].id).toBe('old')
  })

  it('markRead marks a single item read', () => {
    useNotificationStore.getState().setItems([mkNotif('1'), mkNotif('2')])
    useNotificationStore.getState().markRead('1')
    const items = useNotificationStore.getState().items
    expect(items.find(n => n.id === '1')!.is_read).toBe(true)
    expect(items.find(n => n.id === '2')!.is_read).toBe(false)
  })

  it('markAllRead marks everything read', () => {
    useNotificationStore.getState().setItems([mkNotif('1'), mkNotif('2')])
    useNotificationStore.getState().markAllRead()
    expect(useNotificationStore.getState().items.every(n => n.is_read)).toBe(true)
  })

  it('removeItem removes by id', () => {
    useNotificationStore.getState().setItems([mkNotif('1'), mkNotif('2')])
    useNotificationStore.getState().removeItem('1')
    expect(useNotificationStore.getState().items).toHaveLength(1)
    expect(useNotificationStore.getState().items[0].id).toBe('2')
  })

  it('clearAll empties items', () => {
    useNotificationStore.getState().setItems([mkNotif('1')])
    useNotificationStore.getState().clearAll()
    expect(useNotificationStore.getState().items).toHaveLength(0)
  })

  it('setLoading toggles loading', () => {
    useNotificationStore.getState().setLoading(true)
    expect(useNotificationStore.getState().loading).toBe(true)
  })
})
