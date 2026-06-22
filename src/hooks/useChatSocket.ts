'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import type { ChatMessageData, SendMessageResponse } from '@/services/chat.service'

function resolveChatWsUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try {
    const u = new URL(api)
    return `${u.protocol}//${u.host}`
  } catch {
    return 'http://localhost:3001'
  }
}

export function useChatSocket() {
  const socketRef = useRef<Socket | null>(null)
  const jwt = useAuthStore(s => s.jwt)

  useEffect(() => {
    if (!jwt) return

    const socket = io(`${resolveChatWsUrl()}/chat`, {
      auth: { token: jwt },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('chat:ai_response', (data: SendMessageResponse) => {
      useChatStore.getState().setSessionId(data.session_id)
      useChatStore.getState().addMessage(data.ai_message)
      useChatStore.getState().setLoading(false)
    })

    socket.on('chat:error', (data: { message: string }) => {
      useChatStore.getState().addMessage({
        id: `err-${Date.now()}`,
        session_id: '',
        sender: 'ai',
        content: `Error: ${data.message}`,
        metadata: null,
        created_at: new Date().toISOString(),
      })
      useChatStore.getState().setLoading(false)
    })

    socket.on('chat:history_response', (data: { messages: ChatMessageData[] }) => {
      useChatStore.getState().setMessages(data.messages)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [jwt])

  const sendMessage = useCallback((content: string) => {
    const socket = socketRef.current
    const sessionId = useChatStore.getState().sessionId

    if (!socket?.connected) {
      // Fallback to REST
      return false
    }

    const optimisticMsg: ChatMessageData = {
      id: `temp-${Date.now()}`,
      session_id: sessionId ?? '',
      sender: 'user',
      content,
      metadata: null,
      created_at: new Date().toISOString(),
    }
    useChatStore.getState().addMessage(optimisticMsg)
    useChatStore.getState().setLoading(true)

    socket.emit('chat:send', {
      content,
      session_id: sessionId ?? undefined,
    })

    return true
  }, [])

  return { sendMessage }
}
