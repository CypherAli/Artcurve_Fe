'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLanguage()

  useEffect(() => {
    console.error('[ArtCurve Error]', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--ac-paper, #070707)' }}
    >
      <div className="text-center space-y-5 max-w-sm px-4">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: '#f87171' }}>
          {t.error.systemError}
        </div>
        <h2 className="font-sans text-lg font-semibold"
          style={{ color: 'rgba(255,255,255,0.75)' }}>
          {t.error.somethingWentWrong}
        </h2>
        <p className="font-mono text-[10px]"
          style={{ color: 'rgba(255,255,255,0.25)' }}>
          {error.digest ? `Error ID: ${error.digest}` : error.message}
        </p>
        <button
          onClick={reset}
          className="font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3"
          style={{
            border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171',
            background: 'rgba(248,113,113,0.05)',
          }}
        >
          {t.error.tryAgain}
        </button>
      </div>
    </div>
  )
}
