'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
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
import { io, Socket } from 'socket.io-client'

import { liveService, type LiveChatMessage, type LiveTipData } from '@/services/live.service'
import { useAuthStore } from '@/store/authStore'

const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''
const STREAM_CHECK_INTERVAL = 15_000

function resolveWsUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try { const u = new URL(api); return `${u.protocol}//${u.host}` } catch { return 'http://localhost:3001' }
}

// ── Stage ────────────────────────────────────────────────────────────
function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  )
}

// ── Colors ───────────────────────────────────────────────────────────
const G = '#D4AF37'
const G2 = 'rgba(212,175,55,0.35)'
const W1 = 'rgba(255,255,255,0.75)'
const W2 = 'rgba(255,255,255,0.4)'
const W3 = 'rgba(255,255,255,0.15)'
const W4 = 'rgba(255,255,255,0.06)'
const BG = '#0A0A0A'
const PANEL = '#111111'

// ── Chat Panel ───────────────────────────────────────────────────────
function ChatPanel({ roomName, hostId }: { roomName: string; hostId?: string }) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [input, setInput] = useState('')
  const [tab, setTab] = useState<'chat' | 'tip'>('chat')
  const [tipAmount, setTipAmount] = useState('')
  const [tipMsg, setTipMsg] = useState('')
  const [tipSending, setTipSending] = useState(false)
  const [tips, setTips] = useState<LiveTipData[]>([])
  const [totalTips, setTotalTips] = useState({ total_eth: 0, tip_count: 0 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const jwt = useAuthStore(s => s.jwt)
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    liveService.chatMessages(roomName, 100).then(msgs => setMessages(msgs.reverse())).catch(() => {})
    liveService.tips(roomName).then(setTips).catch(() => {})
    liveService.totalTips(roomName).then(setTotalTips).catch(() => {})
  }, [roomName])

  useEffect(() => {
    if (!jwt) return
    const socket = io(`${resolveWsUrl()}/events`, {
      auth: { token: jwt },
      transports: ['websocket', 'polling'],
      reconnection: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('live:subscribe', { room_name: roomName })
    })
    socket.on('live:chat:new', (msg: LiveChatMessage) => {
      setMessages(prev => [...prev, msg])
    })
    socket.on('live:tip:new', (tip: LiveTipData) => {
      setTips(prev => [tip, ...prev])
      setTotalTips(prev => ({
        total_eth: prev.total_eth + Number(tip.amount_eth),
        tip_count: prev.tip_count + 1,
      }))
    })

    return () => {
      socket.emit('live:unsubscribe', { room_name: roomName })
      socket.disconnect()
      socketRef.current = null
    }
  }, [jwt, roomName])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || !jwt) return
    setInput('')
    try { await liveService.postChat(roomName, text) } catch { /* broadcast will add it */ }
  }, [input, jwt, roomName])

  const sendTip = useCallback(async () => {
    if (!tipAmount || !jwt || tipSending) return
    setTipSending(true)
    try {
      await liveService.sendTip(roomName, tipAmount, tipMsg || undefined)
      setTipAmount('')
      setTipMsg('')
    } catch { /* ignore */ }
    setTipSending(false)
  }, [tipAmount, tipMsg, jwt, roomName, tipSending])

  const isAuth = !!jwt

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: 340, height: '100%',
      background: PANEL, borderLeft: `1px solid ${W4}`,
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${W4}` }}>
        {(['chat', 'tip'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: tab === t ? G : W2,
            borderBottom: tab === t ? `2px solid ${G}` : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {t === 'chat' ? '💬 Chat' : `💎 Tips (${totalTips.tip_count})`}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <>
          {/* Messages */}
          <div ref={scrollRef} data-lenis-prevent style={{
            flex: 1, overflowY: 'auto', padding: '8px 12px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {messages.length === 0 && (
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: W2, textAlign: 'center', marginTop: 40 }}>
                No messages yet. Say hi!
              </p>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 10, fontWeight: 600,
                  color: m.user_id === hostId ? G : '#8b9cf7',
                  flexShrink: 0,
                }}>
                  {m.user_name}{m.user_id === hostId ? ' ★' : ''}
                </span>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: W1, wordBreak: 'break-word' }}>
                  {m.content}
                </span>
              </div>
            ))}
          </div>

          {/* Input */}
          {isAuth ? (
            <form onSubmit={e => { e.preventDefault(); sendMessage() }} style={{
              display: 'flex', gap: 6, padding: '8px 12px',
              borderTop: `1px solid ${W4}`,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Send a message..."
                maxLength={300}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${W3}`,
                  borderRadius: 6, padding: '8px 10px', color: W1,
                  fontFamily: 'system-ui, sans-serif', fontSize: 12, outline: 'none',
                }}
              />
              <button type="submit" disabled={!input.trim()} style={{
                background: input.trim() ? G : W3, border: 'none', borderRadius: 6,
                padding: '8px 14px', cursor: input.trim() ? 'pointer' : 'default',
                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                color: input.trim() ? '#000' : W2, transition: 'all 0.2s',
              }}>
                ›
              </button>
            </form>
          ) : (
            <div style={{ padding: '12px', borderTop: `1px solid ${W4}`, textAlign: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: W2 }}>
                Connect wallet to chat
              </span>
            </div>
          )}
        </>
      ) : (
        /* Tips tab */
        <div data-lenis-prevent style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Total */}
          <div style={{
            padding: '16px 12px', textAlign: 'center',
            borderBottom: `1px solid ${W4}`,
            background: 'rgba(212,175,55,0.04)',
          }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: G, fontWeight: 600 }}>
              {totalTips.total_eth.toFixed(4)} ETH
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: W2, letterSpacing: '0.15em', marginTop: 4 }}>
              {totalTips.tip_count} TIPS TOTAL
            </div>
          </div>

          {/* Send tip form */}
          {isAuth ? (
            <div style={{ padding: '12px', borderBottom: `1px solid ${W4}` }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {['0.001', '0.005', '0.01', '0.05'].map(amt => (
                  <button key={amt} onClick={() => setTipAmount(amt)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 6, cursor: 'pointer',
                    background: tipAmount === amt ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${tipAmount === amt ? G2 : W3}`,
                    fontFamily: 'monospace', fontSize: 10, color: tipAmount === amt ? G : W2,
                    transition: 'all 0.15s',
                  }}>
                    {amt}
                  </button>
                ))}
              </div>
              <input
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Custom ETH amount"
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 6,
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${W3}`,
                  borderRadius: 6, padding: '8px 10px', color: W1,
                  fontFamily: 'monospace', fontSize: 11, outline: 'none',
                }}
              />
              <input
                value={tipMsg}
                onChange={e => setTipMsg(e.target.value)}
                placeholder="Message (optional)"
                maxLength={200}
                style={{
                  width: '100%', boxSizing: 'border-box', marginBottom: 8,
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${W3}`,
                  borderRadius: 6, padding: '8px 10px', color: W1,
                  fontFamily: 'system-ui, sans-serif', fontSize: 12, outline: 'none',
                }}
              />
              <button onClick={sendTip} disabled={!tipAmount || tipSending} style={{
                width: '100%', padding: '10px',
                background: tipAmount ? `linear-gradient(135deg, ${G}, #b8860b)` : W3,
                border: 'none', borderRadius: 6, cursor: tipAmount ? 'pointer' : 'default',
                fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
                color: tipAmount ? '#000' : W2, textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}>
                {tipSending ? 'Sending...' : `Send ${tipAmount || '0'} ETH`}
              </button>
            </div>
          ) : (
            <div style={{ padding: '16px 12px', textAlign: 'center', borderBottom: `1px solid ${W4}` }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: W2 }}>Connect wallet to send tips</span>
            </div>
          )}

          {/* Recent tips */}
          <div style={{ flex: 1, padding: '8px 12px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: W2, letterSpacing: '0.15em', marginBottom: 8 }}>
              RECENT TIPS
            </div>
            {tips.length === 0 && (
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: W2, textAlign: 'center', marginTop: 20 }}>
                No tips yet
              </p>
            )}
            {tips.slice(0, 20).map(t => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0', borderBottom: `1px solid ${W4}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(139,156,247,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12,
                }}>
                  💎
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8b9cf7', fontWeight: 600 }}>
                      {t.from_user_name}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: G, fontWeight: 700 }}>
                      {t.amount_eth} ETH
                    </span>
                  </div>
                  {t.message && (
                    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: W2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export function LiveViewer({ roomName }: { roomName: string }) {
  const [token, setToken] = useState<string | null>(null)
  const [streamInfo, setStreamInfo] = useState<{
    title: string; host_name: string; host_id: string; category: string; viewer_count: number
  } | null>(null)
  const [error, setError] = useState('')
  const [ended, setEnded] = useState(false)
  const [identity] = useState(() => `viewer-${crypto.randomUUID().slice(0, 8)}`)
  const [retryKey, setRetryKey] = useState(0)
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const [tokenRes, stream] = await Promise.all([
          liveService.viewerToken(roomName, identity),
          liveService.get(roomName),
        ])
        if (cancelled) return
        if (!stream.is_live) { setEnded(true); return }
        setToken(tokenRes.token)
        setStreamInfo({
          title: stream.title,
          host_name: stream.host_name,
          host_id: stream.host_id,
          category: stream.category,
          viewer_count: stream.viewer_count,
        })
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Stream not found or ended')
      }
    }
    init()
    return () => { cancelled = true }
  }, [roomName, identity, retryKey])

  useEffect(() => {
    if (!token || ended) return
    const interval = setInterval(async () => {
      try {
        const stream = await liveService.get(roomName)
        if (!stream.is_live) { setEnded(true); clearInterval(interval); return }
        setStreamInfo(prev => prev ? { ...prev, viewer_count: stream.viewer_count } : prev)
      } catch { setEnded(true); clearInterval(interval) }
    }, STREAM_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [token, ended, roomName])

  // ── States: ended / error / loading ──
  if (ended) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4" style={{ background: BG, color: 'var(--ac-paper)' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: W1 }}>Stream has ended</p>
        <p style={{ fontFamily: 'monospace', fontSize: 10, color: W2 }}>Thanks for watching!</p>
        <Link href="/live" style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
          padding: '10px 24px', border: `1px solid ${G2}`, color: G, textDecoration: 'none',
          borderRadius: 6, marginTop: 8, transition: 'all 0.2s',
        }}>
          ← Back to Live
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4" style={{ background: BG, color: 'var(--ac-paper)' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 10, color: W2 }}>{error}</p>
        <button onClick={() => { setError(''); setRetryKey(k => k + 1) }} style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
          padding: '10px 24px', border: `1px solid ${G2}`, color: G, background: 'none', cursor: 'pointer', borderRadius: 6,
        }}>Retry</button>
        <Link href="/live" style={{
          fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
          padding: '10px 24px', border: `1px solid ${W3}`, color: W2, textDecoration: 'none', borderRadius: 6,
        }}>← Back to Live</Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: BG }}>
        <p style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: W2 }} className="animate-pulse">
          Connecting…
        </p>
      </div>
    )
  }

  return (
    <div data-lenis-prevent style={{ display: 'flex', height: '100dvh', background: BG, color: 'var(--ac-paper)' }}>
      {/* Video area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 52,
          borderBottom: `1px solid ${W4}`, background: 'rgba(0,0,0,0.6)',
        }}>
          <Link href="/live" style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
            color: W2, textDecoration: 'none', transition: 'color 0.2s',
          }}>← Live</Link>

          {streamInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} className="animate-pulse" />
                <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.2em', color: '#4ade80' }}>LIVE</span>
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: W1 }}>
                {streamInfo.title}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: W2 }}>
                {streamInfo.host_name} · {streamInfo.viewer_count} watching
              </span>
            </div>
          )}

          <button onClick={() => setChatOpen(p => !p)} style={{
            background: 'none', border: `1px solid ${chatOpen ? G2 : W3}`,
            borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em',
            color: chatOpen ? G : W2, transition: 'all 0.2s',
          }}>
            {chatOpen ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>

        {/* LiveKit */}
        <div style={{ flex: 1, position: 'relative' }}>
          <LiveKitRoom
            token={token}
            serverUrl={LK_URL}
            connect={true}
            video={false}
            audio={false}
            onDisconnected={() => setEnded(true)}
            data-lenis-prevent
            style={{ height: '100%' }}
          >
            <RoomAudioRenderer />
            <Stage />
            <ControlBar variation="minimal" controls={{
              microphone: false, camera: false, screenShare: false, chat: false, leave: true,
            }} />
          </LiveKitRoom>
        </div>
      </div>

      {/* Chat + Tips panel */}
      {chatOpen && <ChatPanel roomName={roomName} hostId={streamInfo?.host_id} />}
    </div>
  )
}
