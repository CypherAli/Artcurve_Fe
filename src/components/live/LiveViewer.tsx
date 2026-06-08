'use client'

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://artcurve-be.onrender.com/api/v1'
const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''

// ── Inner component (used inside LiveKitRoom context) ─────────────────────────
function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera,      withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 120px)' }}>
      <ParticipantTile />
    </GridLayout>
  )
}

// ── LiveViewer ─────────────────────────────────────────────────────────────────
export function LiveViewer({ roomName }: { roomName: string }) {
  const router = useRouter()
  const [token,      setToken]      = useState<string | null>(null)
  const [streamInfo, setStreamInfo] = useState<{
    title: string; host_name: string; category: string; viewer_count: number
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const identity = `viewer-${Math.random().toString(36).slice(2, 8)}`
    const url = `${API}/live/${roomName}/viewer-token?identity=${identity}`

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Stream not found or ended')
        return r.json()
      })
      .then(data => {
        setToken(data.token)
        setStreamInfo(data.stream)
      })
      .catch(e => setError(e.message))
  }, [roomName])

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: '#0A0A0A', color: '#FDFBF7' }}>
        <p className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {error}
        </p>
        <Link href="/live"
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>
          ← Back to Live
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center"
        style={{ background: '#0A0A0A' }}>
        <p className="font-mono text-[9px] tracking-[0.28em] uppercase animate-pulse"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Connecting…
        </p>
      </div>
    )
  }

  return (
    <div data-lenis-prevent className="min-h-dvh" style={{ background: '#0A0A0A', color: '#FDFBF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.6)' }}>
        <Link href="/live"
          className="font-mono text-[9px] tracking-widest uppercase transition-colors"
          style={{ color: 'rgba(255,255,255,0.28)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#D4AF37')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}>
          ← Live
        </Link>
        {streamInfo && (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full animate-pulse" style={{ background: '#4ade80' }}/>
              <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: '#4ade80' }}>LIVE</span>
            </span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.75)',
            }}>
              {streamInfo.title}
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {streamInfo.host_name}
            </span>
          </div>
        )}
        <div/>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        token={token}
        serverUrl={LK_URL}
        connect={true}
        video={false}
        audio={false}
        data-lenis-prevent
        style={{ height: 'calc(100dvh - 53px)' }}
      >
        <RoomAudioRenderer />
        <Stage />
        <ControlBar variation="minimal" controls={{ microphone: false, camera: false, screenShare: false, chat: false, leave: true }} />
      </LiveKitRoom>
    </div>
  )
}
