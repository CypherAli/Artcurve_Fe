'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id:      string
  type:    ToastType
  title:   string
  message?: string
  duration?: number
}

// ── Global toast emitter ──────────────────────────────────────────
type Listener = (toast: Toast) => void
const listeners: Listener[] = []

export const toast = {
  emit(t: Omit<Toast, 'id'>) {
    const full: Toast = { ...t, id: Math.random().toString(36).slice(2) }
    listeners.forEach(l => l(full))
  },
  success(title: string, message?: string) { this.emit({ type: 'success', title, message }) },
  error  (title: string, message?: string) { this.emit({ type: 'error',   title, message }) },
  info   (title: string, message?: string) { this.emit({ type: 'info',    title, message }) },
  warning(title: string, message?: string) { this.emit({ type: 'warning', title, message }) },
}

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: '#4ade80', icon: '✓', bg: 'rgba(74,222,128,0.08)' },
  error:   { border: '#f87171', icon: '✗', bg: 'rgba(248,113,113,0.08)' },
  info:    { border: '#60a5fa', icon: 'ℹ', bg: 'rgba(96,165,250,0.08)'  },
  warning: { border: '#fbbf24', icon: '⚠', bg: 'rgba(251,191,36,0.08)'  },
}

// ── ToastContainer — mount once in layout ─────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler: Listener = (t) => {
      setToasts(prev => [...prev.slice(-4), t])           // max 5
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, t.duration ?? 4000)
    }
    listeners.push(handler)
    return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1) }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="pointer-events-auto min-w-[240px] max-w-[320px] px-4 py-3"
              style={{
                background:   'rgba(10,10,10,0.95)',
                border:       `1px solid ${c.border}33`,
                borderLeft:   `3px solid ${c.border}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-[13px] mt-px shrink-0" style={{ color: c.border }}>{c.icon}</span>
                <div>
                  <div className="font-mono text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>{t.title}</div>
                  {t.message && (
                    <div className="font-sans text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.message}</div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
