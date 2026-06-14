'use client'

import { useState } from 'react'

interface EscalationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  loading?: boolean
}

export function EscalationDialog({ open, onClose, onConfirm, loading }: EscalationDialogProps) {
  const [reason, setReason] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0F0E0C] border border-[#C9A96E]/30 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl">
        <h3 className="text-lg font-[family-name:var(--font-cormorant)] text-[#C9A96E] mb-1">
          Contact Support Staff
        </h3>
        <p className="text-sm text-[#8A8A8A] mb-4">
          Your conversation will be escalated to a human staff member.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe your issue..."
          rows={3}
          maxLength={500}
          className="w-full resize-none bg-[#1A1917] text-[#E5E5E5] placeholder-[#6A6A6A] rounded-xl px-4 py-3 border border-[#2A2926] focus:border-[#C9A96E] focus:outline-none text-sm"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#2A2926] text-[#8A8A8A] hover:text-[#E5E5E5] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()) }}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#C9A96E] text-[#0F0E0C] font-medium hover:bg-[#B8984D] disabled:opacity-40 transition-colors text-sm"
          >
            {loading ? 'Sending...' : 'Escalate'}
          </button>
        </div>
      </div>
    </div>
  )
}
