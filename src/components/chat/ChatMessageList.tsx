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
        <div className="flex flex-col items-center justify-center h-full text-[#8A8A8A] gap-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p className="font-[family-name:var(--font-cormorant)] text-lg">How can I help you today?</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words ${
              msg.sender === 'user'
                ? 'bg-[#C9A96E] text-[#0F0E0C]'
                : msg.sender === 'staff'
                  ? 'bg-[#2A4A3A] text-[#E5E5E5] border border-[#3A6A4A]'
                  : 'bg-[#1A1917] text-[#E5E5E5] border border-[#2A2926]'
            }`}
          >
            {msg.sender !== 'user' && (
              <span className="text-[10px] uppercase tracking-wider text-[#8A8A8A] block mb-1">
                {msg.sender === 'staff' ? 'Staff' : 'ArtCurve AI'}
              </span>
            )}
            <p>{msg.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-[#1A1917] border border-[#2A2926] rounded-2xl px-4 py-3">
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
