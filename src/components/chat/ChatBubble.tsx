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
  const [visible, setVisible] = useState(false)

  const { sendMessage: sendViaSocket } = useChatSocket()

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => setVisible(true), 20)
    return () => { clearTimeout(t); setVisible(false) }
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
    } catch { /* keep dialog open */ }
    finally { setEscalating(false) }
  }, [sessionId])

  if (!isAuthenticated) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleChat}
        aria-label="Toggle chat"
        className="fixed bottom-5 right-5 z-[9998] group"
      >
        <div className={`relative w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-[#1C1B18] border border-[#3A3732] shadow-lg'
            : 'bg-gradient-to-br from-[#D4B37F] via-[#C9A96E] to-[#A8873E] shadow-[0_4px_20px_rgba(201,169,110,0.35)] group-hover:shadow-[0_4px_28px_rgba(201,169,110,0.5)] group-hover:scale-105'
        }`}>
          <svg
            width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke={isOpen ? '#C9A96E' : '#0F0E0C'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform duration-300"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            {isOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            )}
          </svg>
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F0E0C]" />
          )}
        </div>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-[88px] right-5 z-[9998] w-[380px] max-h-[min(560px,calc(100vh-120px))] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.92] translate-y-3'
          }`}
          style={{
            borderRadius: '20px',
            background: '#111110',
            border: '1px solid #2A2825',
            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,110,0.06)',
          }}
        >
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4" style={{ background: 'linear-gradient(180deg, #1A1916 0%, #111110 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#D4B37F] to-[#A8873E] flex items-center justify-center shadow-md">
                    <span className="text-[#0F0E0C] text-sm font-bold tracking-tight">AC</span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1A1916]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#F0EDE6] tracking-tight">
                    ArtCurve Support
                  </h3>
                  <p className="text-[11px] text-[#7A7870] mt-0.5">
                    Typically replies instantly
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {sessionId && (
                  <button
                    onClick={() => setShowEscalation(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7870] hover:text-[#C9A96E] hover:bg-white/5 transition-all"
                    title="Contact staff"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <path d="M20 8v6M23 11h-6" />
                    </svg>
                  </button>
                )}
                <a
                  href="/chat"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7870] hover:text-[#C9A96E] hover:bg-white/5 transition-all"
                  title="Open full chat"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-[#2A2825]" />

          {/* Messages */}
          <ChatMessageList compact />

          {/* Input area */}
          <div className="border-t border-[#2A2825] bg-[#141312]">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
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
