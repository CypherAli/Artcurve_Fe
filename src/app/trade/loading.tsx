export default function TradeLoading() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ac-paper, #070707)', marginTop: 68 }}>
      <div className="w-56 flex flex-col gap-1 p-2" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-10 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-2 p-4">
        <div className="h-12 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="flex-1 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
      </div>
      <div className="w-72 flex flex-col gap-2 p-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="h-40 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="flex-1 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
      </div>
    </div>
  )
}
