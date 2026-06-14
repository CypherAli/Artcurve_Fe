'use client'

import { useState, useRef, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = 'Type a message...' }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="flex items-end gap-2 px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); handleInput() }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-[#1C1B18] text-[#E0E0DC] placeholder-[#5A5850] rounded-xl px-3.5 py-2.5 border border-[#2A2825] focus:border-[#C9A96E]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/20 transition-all text-[13px] leading-[1.4]"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !hasValue}
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
          hasValue && !disabled
            ? 'bg-gradient-to-br from-[#D4B37F] to-[#A8873E] text-[#0F0E0C] shadow-sm hover:shadow-md hover:shadow-[#C9A96E]/20'
            : 'bg-[#1C1B18] text-[#3A3832] border border-[#2A2825]'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </div>
  )
}
