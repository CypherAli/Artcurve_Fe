export default function VaultLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--ac-paper, #070707)', marginTop: 68 }}>
      <div className="h-10 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
      <div className="grid grid-cols-4 gap-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
      <div className="mx-4 h-24 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
      <div className="flex-1 mx-4 mt-2 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
    </div>
  )
}
