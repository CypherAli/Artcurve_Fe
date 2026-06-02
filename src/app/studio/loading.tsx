export default function StudioLoading() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707', marginTop: 68 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-1 p-4 space-y-3" style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
          <div className="h-6 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-12 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ))}
    </div>
  )
}
