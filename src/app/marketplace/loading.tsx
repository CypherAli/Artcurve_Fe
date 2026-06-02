export default function MarketplaceLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#070707', marginTop: 68 }}>
      {/* Header skeleton */}
      <div className="h-10 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
      {/* Tab bar skeleton */}
      <div className="h-9 animate-pulse" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
      <div className="flex flex-1 overflow-hidden">
        {/* List skeleton */}
        <div className="w-[40%] flex flex-col gap-px p-2" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-14 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
        {/* Detail skeleton */}
        <div className="flex-1 p-6 space-y-4">
          <div className="h-48 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="h-6 w-48 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="h-4 w-72 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          <div className="h-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>
    </div>
  )
}
