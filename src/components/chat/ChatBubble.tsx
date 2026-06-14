'use client'

import { useState, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useChatSocket } from '@/hooks/useChatSocket'
import { chatService } from '@/services/chat.service'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { EscalationDialog } from './EscalationDialog'

export function ChatBubble() {
  const isOpen = useChatStore((s) => s.isOpen)
  const toggleChat = useChatStore((s) => s.toggleChat)
  const sessionId = useChatStore((s) => s.sessionId)
  const isLoading = useChatStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => !!s.jwt)

  const [showEscalation, setShowEscalation] = useState(false)
  const [escalating, setEscalating] = useState(false)

  const { sendMessage: sendViaSocket } = useChatSocket()

  const handleSend = useCallback(async (content: string) => {
    const sent = sendViaSocket(content)
    if (!sent) {
      const store = useChatStore.getState()
      store.addMessage({
        id: `temp-${Date.now()}`,
        session_id: store.sessionId ?? '',
        sender: 'user',
        content,
        metadata: null,
        created_at: new Date().toISOString(),
      })
      store.setLoading(true)
      try {
        const res = await chatService.sendMessage(content, store.sessionId ?? undefined)
        store.setSessionId(res.session_id)
        store.addMessage(res.ai_message)
      } catch {
        store.addMessage({
          id: `err-${Date.now()}`,
          session_id: '',
          sender: 'ai',
          content: 'Sorry, something went wrong. Please try again.',
          metadata: null,
          created_at: new Date().toISOString(),
        })
      } finally {
        store.setLoading(false)
      }
    }
  }, [sendViaSocket])

  const handleEscalate = useCallback(async (reason: string) => {
    if (!sessionId) return
    setEscalating(true)
    try {
      await chatService.escalate(sessionId, reason)
      useChatStore.getState().addMessage({
        id: `esc-${Date.now()}`,
        session_id: sessionId,
        sender: 'ai',
        content: 'Your conversation has been escalated to a staff member. They will reach out to you shortly.',
        metadata: null,
        created_at: new Date().toISOString(),
      })
      setShowEscalation(false)
    } catch {
      // keep dialog open on error
    } finally {
      setEscalating(false)
    }
  }, [sessionId])

  if (!isAuthenticated) return null

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-[#C9A96E] text-[#0F0E0C] shadow-lg hover:bg-[#B8984D] transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[380px] h-[520px] bg-[#0F0E0C] border border-[#C9A96E]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2926]">
            <div>
              <h3 className="text-[#C9A96E] font-[family-name:var(--font-cormorant)] text-lg font-semibold">
                ArtCurve Support
              </h3>
              <p className="text-[10px] text-[#6A6A6A]">We&apos;re here to help</p>
            </div>
            <div className="flex items-center gap-1">
              {sessionId && (
                <button
                  onClick={() => setShowEscalation(true)}
                  className="p-2 text-[#8A8A8A] hover:text-[#C9A96E] transition-colors"
                  title="Contact staff"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <path d="M20 8v6M23 11h-6" />
                  </svg>
                </button>
              )}
              <a
                href="/chat"
                className="p-2 text-[#8A8A8A] hover:text-[#C9A96E] transition-colors"
                title="Open full chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </a>
            </div>
          </div>

          <ChatMessageList compact />
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      )}

      <EscalationDialog
        open={showEscalation}
        onClose={() => setShowEscalation(false)}
        onConfirm={handleEscalate}
        loading={escalating}
      />
    </>
  )
}
