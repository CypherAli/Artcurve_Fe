'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import Link                                  from 'next/link'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useLocalParticipant,
  useTracks,
  GridLayout,
  ParticipantTile,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { authStore } from '@/lib/auth-store'

const API    = process.env.NEXT_PUBLIC_API_URL    ?? 'https://artcurve-be-production.up.railway.app/api/v1'
const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''

// ── Inner broadcast stage ─────────────────────────────────────────────────────
function BroadcastStage() {
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

// ── LiveBroadcaster ───────────────────────────────────────────────────────────
export function LiveBroadcaster({ roomName }: { roomName: string }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)

  // Lấy host token từ sessionStorage (set bởi GoLiveModal sau khi tạo room)
  useEffect(() => {
    const stored = sessionStorage.getItem(`livekit_host_token_${roomName}`)
    if (stored) {
      setToken(stored)
      return
    }
    // Nếu không có token → redirect về /live
    setError('No host token. Please start stream from the Live page.')
  }, [roomName])

  const handleEndStream = useCallback(async () => {
    setEnding(true)
    try {
      const user = authStore.getUser()
      const jwt  = authStore.getToken()
      await fetch(`${API}/live/${roomName}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${jwt}` },
      })
    } catch { /* ignore */ }
    sessionStorage.removeItem(`livekit_host_token_${roomName}`)
    router.push('/live')
  }, [roomName, router])

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
          Back to Live
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <p className="font-mono text-[9px] tracking-[0.28em] uppercase animate-pulse"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Starting stream…
        </p>
      </div>
    )
  }

  return (
    <div data-lenis-prevent className="min-h-dvh" style={{ background: '#0A0A0A', color: '#FDFBF7' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full animate-pulse" style={{ background: '#f87171' }}/>
            <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: '#f87171' }}>ON AIR</span>
          </span>
          <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {roomName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleEndStream}
          disabled={ending}
          className="font-mono text-[8.5px] tracking-widest uppercase px-4 py-1.5 transition-all"
          style={{
            border:     '1px solid rgba(248,113,113,0.4)',
            color:      '#f87171',
            background: 'rgba(248,113,113,0.08)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}>
          {ending ? 'Ending…' : 'End Stream'}
        </button>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        token={token}
        serverUrl={LK_URL}
        connect={true}
        video={true}
        audio={true}
        data-lenis-prevent
        style={{ height: 'calc(100dvh - 53px)' }}
        onDisconnected={() => router.push('/live')}
      >
        <RoomAudioRenderer />
        <BroadcastStage />
        <ControlBar
          variation="minimal"
          controls={{
            microphone: true,
            camera:     true,
            screenShare:true,
            chat:       false,
            leave:      false,   // dùng "End Stream" button thay thế
          }}
        />
      </LiveKitRoom>
    </div>
  )
}
