export default function GuildLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#070707', marginTop: 68 }}>
      <div className="h-10 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
      <div className="flex-1 p-6 space-y-4">
        <div className="h-8 w-40 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
