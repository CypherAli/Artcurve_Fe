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
    <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-2.5 ${compact ? 'text-[13px]' : 'text-sm'}`}
      style={{ minHeight: compact ? '320px' : undefined }}
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A96E]/15 to-[#C9A96E]/5 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-[family-name:var(--font-cormorant)] text-[17px] text-[#9A9890] font-medium">
              Welcome to ArtCurve Support
            </p>
            <p className="text-[12px] text-[#5A5850] leading-relaxed max-w-[240px] mx-auto">
              Ask about bonding curves, art tokens, trading, or anything else
            </p>
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isUser = msg.sender === 'user'
        const isStaff = msg.sender === 'staff'
        const prevSender = i > 0 ? messages[i - 1]?.sender : null
        const showAvatar = !isUser && prevSender !== msg.sender

        return (
          <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end pl-10' : 'justify-start pr-10'}`}>
            {!isUser && (
              <div className={`flex-shrink-0 w-6 h-6 ${showAvatar ? '' : 'invisible'}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  isStaff
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-[#C9A96E]/15 text-[#C9A96E]'
                }`}>
                  <span className="text-[9px] font-bold">{isStaff ? 'S' : 'AC'}</span>
                </div>
              </div>
            )}
            <div
              className={`max-w-[85%] px-3.5 py-2.5 whitespace-pre-wrap break-words leading-[1.5] ${
                isUser
                  ? 'bg-gradient-to-br from-[#C9A96E] to-[#B39055] text-[#0F0E0C] rounded-[16px] rounded-br-[4px]'
                  : isStaff
                    ? 'bg-[#182A1F] text-[#E0E0DC] border border-emerald-900/30 rounded-[16px] rounded-bl-[4px]'
                    : 'bg-[#1C1B18] text-[#E0E0DC] border border-[#2A2825] rounded-[16px] rounded-bl-[4px]'
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex items-end gap-2 justify-start pr-10">
          <div className="w-6 h-6 rounded-lg bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-[#C9A96E]">AC</span>
          </div>
          <div className="bg-[#1C1B18] border border-[#2A2825] rounded-[16px] rounded-bl-[4px] px-4 py-3">
            <div className="flex gap-1">
              <span className="w-[6px] h-[6px] bg-[#C9A96E]/60 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-[6px] h-[6px] bg-[#C9A96E]/60 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-[6px] h-[6px] bg-[#C9A96E]/60 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
