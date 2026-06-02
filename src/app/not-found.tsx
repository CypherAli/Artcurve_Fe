import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#070707', color: 'rgba(255,255,255,0.7)' }}
    >
      <div className="text-center space-y-6">
        <div className="font-mono text-[80px] font-bold leading-none"
          style={{ color: 'rgba(212,175,55,0.15)', letterSpacing: '-0.05em' }}>
          404
        </div>
        <div className="font-mono text-[11px] tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Page not found
        </div>
        <p className="font-sans text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          This curve doesn&apos;t exist — or hasn&apos;t been deployed yet.
        </p>
        <Link href="/"
          className="inline-block font-mono text-[10px] tracking-[0.2em] uppercase px-6 py-3 mt-4"
          style={{
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
            background: 'rgba(212,175,55,0.05)',
          }}>
          Return to Market
        </Link>
      </div>
    </div>
  )
}
