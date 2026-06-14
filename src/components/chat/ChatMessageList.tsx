'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'

export function ChatMessageList({ compact = false }: { compact?: boolean }) {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${compact ? 'text-sm' : ''}`}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-[#6A6A6A] gap-3 px-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/5 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#8A8A8A]">
              How can we help you today?
            </p>
            <p className="text-xs text-[#5A5A5A] mt-1">
              Ask anything about ArtCurve
            </p>
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isUser = msg.sender === 'user'
        const isStaff = msg.sender === 'staff'
        const showAvatar = !isUser && (i === 0 || messages[i - 1]?.sender === 'user')

        return (
          <div
            key={msg.id}
            className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isUser && (
              <div className={`flex-shrink-0 w-7 h-7 mt-1 ${showAvatar ? '' : 'invisible'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isStaff
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                    : 'bg-gradient-to-br from-[#C9A96E]/30 to-[#C9A96E]/10 text-[#C9A96E]'
                }`}>
                  {isStaff ? 'S' : 'A'}
                </div>
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words leading-relaxed ${
                isUser
                  ? 'bg-gradient-to-br from-[#C9A96E] to-[#B08A4A] text-[#0F0E0C] rounded-br-md'
                  : isStaff
                    ? 'bg-[#1A2E22] text-[#E5E5E5] border border-emerald-800/40 rounded-bl-md'
                    : 'bg-[#1A1917] text-[#E5E5E5] border border-[#2A2926] rounded-bl-md'
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex gap-2 justify-start">
          <div className="flex-shrink-0 w-7 h-7 mt-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A96E]/30 to-[#C9A96E]/10 flex items-center justify-center text-[10px] font-bold text-[#C9A96E]">
              A
            </div>
          </div>
          <div className="bg-[#1A1917] border border-[#2A2926] rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-[#C9A96E] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-[#C9A96E] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-[#C9A96E] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
