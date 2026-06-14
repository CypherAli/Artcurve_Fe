'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useChatSocket } from '@/hooks/useChatSocket'
import { chatService, type ChatSession } from '@/services/chat.service'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { EscalationDialog } from '@/components/chat/EscalationDialog'

export default function ChatPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => !!s.jwt)
  const sessionId = useChatStore((s) => s.sessionId)
  const isLoading = useChatStore((s) => s.isLoading)
  const clearChat = useChatStore((s) => s.clearChat)

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showEscalation, setShowEscalation] = useState(false)
  const [escalating, setEscalating] = useState(false)

  const { sendMessage: sendViaSocket } = useChatSocket()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    chatService.getSessions().then(setSessions).catch(() => {})
  }, [isAuthenticated, router])

  const loadSession = useCallback(async (sid: string) => {
    useChatStore.getState().setSessionId(sid)
    try {
      const msgs = await chatService.getHistory(sid)
      useChatStore.getState().setMessages(msgs)
    } catch { /* keep current */ }
  }, [])

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

  const handleNewChat = useCallback(() => {
    clearChat()
  }, [clearChat])

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-[#0F0E0C]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#2A2926] flex flex-col">
        <div className="p-4 border-b border-[#2A2926]">
          <h2 className="font-[family-name:var(--font-cormorant)] text-xl text-[#C9A96E] font-semibold">
            Chat
          </h2>
        </div>

        <button
          onClick={handleNewChat}
          className="mx-3 mt-3 px-4 py-2.5 rounded-xl border border-dashed border-[#C9A96E]/40 text-[#C9A96E] text-sm hover:bg-[#C9A96E]/10 transition-colors"
        >
          + New conversation
        </button>

        <div className="flex-1 overflow-y-auto mt-2 px-3 space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                sessionId === s.id
                  ? 'bg-[#C9A96E]/15 text-[#C9A96E]'
                  : 'text-[#8A8A8A] hover:text-[#E5E5E5] hover:bg-[#1A1917]'
              }`}
            >
              <span className="block truncate">
                {s.status === 'escalated' ? '🔴 ' : s.status === 'closed' ? '⚫ ' : ''}
                Session {s.id.slice(0, 8)}...
              </span>
              <span className="text-[10px] text-[#6A6A6A]">
                {new Date(s.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-[#2A2926]">
          <div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-lg text-[#E5E5E5]">
              ArtCurve Support
            </h1>
            <p className="text-xs text-[#6A6A6A]">
              {sessionId ? `Session ${sessionId.slice(0, 8)}...` : 'New conversation'}
            </p>
          </div>
          {sessionId && (
            <button
              onClick={() => setShowEscalation(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C9A96E]/30 text-[#C9A96E] text-sm hover:bg-[#C9A96E]/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
              Contact Staff
            </button>
          )}
        </header>

        <ChatMessageList />
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </main>

      <EscalationDialog
        open={showEscalation}
        onClose={() => setShowEscalation(false)}
        onConfirm={handleEscalate}
        loading={escalating}
      />
    </div>
  )
}
