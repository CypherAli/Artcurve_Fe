import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessageData } from '@/services/chat.service'

interface ChatState {
  isOpen:    boolean
  sessionId: string | null
  messages:  ChatMessageData[]
  isLoading: boolean

  toggleChat:   () => void
  openChat:     () => void
  closeChat:    () => void
  setSessionId: (id: string | null) => void
  setMessages:  (msgs: ChatMessageData[]) => void
  addMessage:   (msg: ChatMessageData) => void
  setLoading:   (v: boolean) => void
  clearChat:    () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen:    false,
      sessionId: null,
      messages:  [],
      isLoading: false,

      toggleChat:   ()    => set((s) => ({ isOpen: !s.isOpen })),
      openChat:     ()    => set({ isOpen: true }),
      closeChat:    ()    => set({ isOpen: false }),
      setSessionId: (id)  => set({ sessionId: id }),
      setMessages:  (msgs) => set({ messages: msgs }),
      addMessage:   (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      setLoading:   (v)   => set({ isLoading: v }),
      clearChat:    ()    => set({ sessionId: null, messages: [], isOpen: false }),
    }),
    {
      name: 'artcurve-chat',
      partialize: (state) => ({ sessionId: state.sessionId }),
    },
  ),
)
