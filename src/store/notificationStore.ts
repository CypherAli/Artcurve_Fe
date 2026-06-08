import { create } from 'zustand'

export interface AppNotification {
  id:          string
  type:        'trade' | 'price' | 'follow' | 'sale' | 'graduation'
  title:       string
  description: string | null
  metadata:    Record<string, unknown> | null
  is_read:     boolean
  created_at:  string
}

interface NotificationState {
  items:    AppNotification[]
  loading:  boolean

  setItems:   (items: AppNotification[]) => void
  addItem:    (item: AppNotification) => void       // prepend (từ WS push)
  markRead:   (id: string) => void
  markAllRead: () => void
  removeItem: (id: string) => void
  clearAll:   () => void
  setLoading: (v: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items:   [],
  loading: false,

  setItems:    (items)  => set({ items }),
  addItem:     (item)   => set(s => ({ items: [item, ...s.items].slice(0, 100) })),
  markRead:    (id)     => set(s => ({ items: s.items.map(n => n.id === id ? { ...n, is_read: true } : n) })),
  markAllRead: ()       => set(s => ({ items: s.items.map(n => ({ ...n, is_read: true })) })),
  removeItem:  (id)     => set(s => ({ items: s.items.filter(n => n.id !== id) })),
  clearAll:    ()       => set({ items: [] }),
  setLoading:  (v)      => set({ loading: v }),
}))
