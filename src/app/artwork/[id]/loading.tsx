export default function ArtworkDetailLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--ac-paper, #070707)', marginTop: 68 }}>
      <div className="h-10 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
      <div className="flex-1 p-6 space-y-4">
        <div className="h-64 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="h-6 w-48 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="h-4 w-72 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
        <div className="h-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
      </div>
    </div>
  )
}
