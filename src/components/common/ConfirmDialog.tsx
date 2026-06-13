'use client'

import { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Confirm',
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = '#C9A96E',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: '#0E0E0E',
          border: '1px solid rgba(201,169,110,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Gold accent */}
        <div className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${confirmColor}, rgba(201,169,110,0.2) 70%, transparent)` }} />

        <div className="px-6 pt-5 pb-2">
          <h3 className="text-[16px] font-semibold text-white/90"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {title}
          </h3>
        </div>

        <div className="px-6 pb-5 text-[13px] text-white/55 leading-relaxed">
          {children}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-5 text-[12px] font-mono tracking-wider uppercase rounded-lg transition-colors duration-200"
            style={{
              color: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-5 text-[12px] font-mono tracking-wider uppercase rounded-lg transition-colors duration-200"
            style={{
              color: '#0E0E0E',
              background: confirmColor,
              border: `1px solid ${confirmColor}`,
              fontWeight: 600,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
