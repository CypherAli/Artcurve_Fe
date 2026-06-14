'use client'

import { useState, useCallback, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  const { sendMessage: sendViaSocket } = useChatSocket()

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
    } else {
      setMounted(false)
    }
  }, [isOpen])

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
        className={`fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-[#1A1917] border border-[#C9A96E]/40 text-[#C9A96E] rotate-0 hover:bg-[#2A2926]'
            : 'bg-gradient-to-br from-[#C9A96E] to-[#A67C3D] text-[#0F0E0C] hover:scale-110 hover:shadow-[0_0_24px_rgba(201,169,110,0.3)]'
        }`}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
        <div
          className={`fixed bottom-24 right-6 z-[9998] w-[400px] h-[540px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
            mounted
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          style={{
            background: 'linear-gradient(180deg, #141311 0%, #0F0E0C 100%)',
            border: '1px solid rgba(201, 169, 110, 0.15)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,169,110,0.05)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 100%)',
              borderBottom: '1px solid rgba(201,169,110,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#A67C3D] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F0E0C" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[#E5E5E5] font-[family-name:var(--font-cormorant)] text-[17px] font-semibold leading-tight">
                  ArtCurve Support
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] text-[#8A8A8A]">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {sessionId && (
                <button
                  onClick={() => setShowEscalation(true)}
                  className="p-2 rounded-lg text-[#6A6A6A] hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all"
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
                className="p-2 rounded-lg text-[#6A6A6A] hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all"
                title="Open full chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </a>
            </div>
          </div>

          <ChatMessageList compact />

          {/* Divider line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/20 to-transparent" />

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
