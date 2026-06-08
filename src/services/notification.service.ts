import { get, request } from '@/lib/http'
import type { AppNotification } from '@/store/notificationStore'

export const notificationService = {
  list:        (limit = 50)  => get<AppNotification[]>(`/notifications?limit=${limit}`, true),
  unreadCount: ()            => get<{ count: number }>('/notifications/unread-count', true),
  markAllRead: ()            => request<void>('/notifications/read-all',  { method: 'PATCH', auth: true }),
  markRead:    (id: string)  => request<void>(`/notifications/${id}/read`, { method: 'PATCH', auth: true }),
  deleteOne:   (id: string)  => request<void>(`/notifications/${id}`,      { method: 'DELETE', auth: true }),
  clearAll:    ()            => request<void>('/notifications',            { method: 'DELETE', auth: true }),
}
