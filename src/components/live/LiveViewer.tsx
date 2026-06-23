'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

import { liveService } from '@/services/live.service'

const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''
const STREAM_CHECK_INTERVAL = 15_000

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

export function LiveViewer({ roomName }: { roomName: string }) {
  const router = useRouter()
  const [token,      setToken]      = useState<string | null>(null)
  const [streamInfo, setStreamInfo] = useState<{
    title: string; host_name: string; category: string; viewer_count: number
  } | null>(null)
  const [error, setError] = useState('')
  const [ended, setEnded] = useState(false)
  const identityRef = useRef(`viewer-${Math.random().toString(36).slice(2, 8)}`)

  const fetchToken = useCallback(async () => {
    try {
      const [tokenRes, stream] = await Promise.all([
        liveService.viewerToken(roomName, identityRef.current),
        liveService.get(roomName),
      ])

      if (!stream.is_live) {
        setEnded(true)
        return
      }

      setToken(tokenRes.token)
      setStreamInfo({
        title: stream.title,
        host_name: stream.host_name,
        category: stream.category,
        viewer_count: stream.viewer_count,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Stream not found or ended')
    }
  }, [roomName])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  useEffect(() => {
    if (!token || ended) return
    const interval = setInterval(async () => {
      try {
        const stream = await liveService.get(roomName)
        if (!stream.is_live) {
          setEnded(true)
          clearInterval(interval)
          return
        }
        setStreamInfo(prev => prev ? { ...prev, viewer_count: stream.viewer_count } : prev)
      } catch {
        // stream might have been deleted
        setEnded(true)
        clearInterval(interval)
      }
    }, STREAM_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [token, ended, roomName])

  if (ended) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: '#0A0A0A', color: 'var(--ac-paper)' }}>
        <p className="font-mono text-[12px] tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          Stream has ended
        </p>
        <Link href="/live"
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}>
          ← Back to Live
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: '#0A0A0A', color: 'var(--ac-paper)' }}>
        <p className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {error}
        </p>
        <button onClick={() => { setError(''); fetchToken() }}
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', background: 'none', cursor: 'pointer' }}>
          Retry
        </button>
        <Link href="/live"
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
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
    <div data-lenis-prevent className="min-h-dvh" style={{ background: '#0A0A0A', color: 'var(--ac-paper)' }}>
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
              {streamInfo.host_name} · {streamInfo.viewer_count} watching
            </span>
          </div>
        )}
        <div/>
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={LK_URL}
        connect={true}
        video={false}
        audio={false}
        onDisconnected={() => setEnded(true)}
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
