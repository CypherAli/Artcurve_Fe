'use client'
// hooks/useNotifications.ts
// Fetch notifications từ API khi user đăng nhập.
// Real-time push sẽ được add khi có Socket.IO integration.

import { useEffect } from 'react'
import { useAuthStore }         from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { notificationService }  from '@/services/notification.service'

export function useNotifications() {
  const { user }     = useAuthStore()
  const store        = useNotificationStore()

  useEffect(() => {
    if (!user) return

    store.setLoading(true)
    notificationService.list(50)
      .then(items => store.setItems(items))
      .catch(() => {/* silent — không crash UI */})
      .finally(() => store.setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const unreadCount = store.items.filter(n => !n.is_read).length

  async function handleMarkAllRead() {
    store.markAllRead()
    notificationService.markAllRead().catch(() => {})
  }

  async function handleMarkRead(id: string) {
    store.markRead(id)
    notificationService.markRead(id).catch(() => {})
  }

  async function handleDelete(id: string) {
    store.removeItem(id)
    notificationService.deleteOne(id).catch(() => {})
  }

  async function handleClearAll() {
    store.clearAll()
    notificationService.clearAll().catch(() => {})
  }

  return {
    items:          store.items,
    unreadCount,
    loading:        store.loading,
    markAllRead:    handleMarkAllRead,
    markRead:       handleMarkRead,
    deleteOne:      handleDelete,
    clearAll:       handleClearAll,
  }
}
