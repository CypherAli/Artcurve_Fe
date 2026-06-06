'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://artcurve-be-production.up.railway.app/api/v1'

// ── Types ─────────────────────────────────────────────────────────
interface StreamItem {
  id: string
  type: 'live' | 'video'
  artist: string
  handle: string
  title: string
  ticker: string
  category: string
  viewers?: number
  views?: string
  duration?: string     // for VOD: "12:34"
  liveFor?: string      // for live: "2h 15m"
  uploadedAt?: string   // for VOD: "3 days ago"
  marketCap: string
  color: string
  glow1: string
  glow2: string
  base: string
  spark: number[]
  roomName?: string     // live only → /live/[roomName]
}

// ── Sample data ───────────────────────────────────────────────────
const ITEMS: StreamItem[] = [
  {
    id: 's1', type: 'live',
    artist: 'Soo-ah Kim', handle: 'soo_ah.eth',
    title: 'Pale Architecture — panel 3, oil on canvas',
    ticker: '$PALE', category: 'Painting',
    viewers: 342, liveFor: '1h 23m', marketCap: '$84.2K',
    color: '#a78bfa',
    glow1: 'rgba(139,92,246,0.35)', glow2: 'rgba(91,33,182,0.18)',
    base: 'linear-gradient(158deg,#09091e 0%,#0f0f2a 60%,#0a0a1c 100%)',
    spark: [.42,.44,.40,.47,.52,.50,.57,.62,.59,.66,.71,.68,.73,.76,.72,.79,.83,.80,.86,.90],
    roomName: 'soo-ah-2024',
  },
  {
    id: 's2', type: 'live',
    artist: 'Marcus Adler', handle: 'markus.eth',
    title: 'Threshold Fragment — oil, live session',
    ticker: '$THRESH', category: 'Painting',
    viewers: 189, liveFor: '42m', marketCap: '$31.5K',
    color: '#f87171',
    glow1: 'rgba(239,68,68,0.32)', glow2: 'rgba(185,28,28,0.16)',
    base: 'linear-gradient(158deg,#1a0808 0%,#220d0d 60%,#160606 100%)',
    spark: [.60,.55,.58,.52,.50,.54,.48,.45,.50,.52,.55,.52,.50,.48,.45,.46,.44,.42,.40,.38],
    roomName: 'marcus-2024',
  },
  {
    id: 's3', type: 'live',
    artist: 'Aiko Tanaka', handle: 'aiko.base',
    title: 'Generative bloom — live coding in p5.js',
    ticker: '$BLOOM', category: 'Digital',
    viewers: 97, liveFor: '18m', marketCap: '$4.1K',
    color: '#4ade80',
    glow1: 'rgba(74,222,128,0.28)', glow2: 'rgba(22,163,74,0.15)',
    base: 'linear-gradient(158deg,#040f08 0%,#07180d 60%,#040d07 100%)',
    spark: [.30,.35,.40,.38,.42,.46,.51,.49,.53,.56,.61,.59,.63,.66,.69,.71,.73,.76,.79,.83],
    roomName: 'aiko-2024',
  },
  {
    id: 'v1', type: 'video',
    artist: 'Böcklin', handle: 'böcklin.eth',
    title: 'Self-Portrait with Death — full process, 4h timelapse',
    ticker: '$BÖCKLIN', category: 'Painting',
    views: '12.4K', duration: '4:02:11', uploadedAt: '3 days ago', marketCap: '$18.2K',
    color: '#D4AF37',
    glow1: 'rgba(212,175,55,0.30)', glow2: 'rgba(161,120,24,0.15)',
    base: 'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
    spark: [.50,.52,.55,.60,.63,.66,.69,.73,.76,.79,.81,.83,.86,.89,.91,.89,.86,.91,.93,.96],
  },
  {
    id: 's4', type: 'live',
    artist: 'Böcklin', handle: 'böcklin.eth',
    title: 'Self-Portrait with Death — oil reinterpretation',
    ticker: '$BÖCKLIN', category: 'Drawing',
    viewers: 234, liveFor: '3h 1m', marketCap: '$18.2K',
    color: '#D4AF37',
    glow1: 'rgba(212,175,55,0.30)', glow2: 'rgba(161,120,24,0.15)',
    base: 'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
    spark: [.50,.52,.55,.60,.63,.66,.69,.73,.76,.79,.81,.83,.86,.89,.91,.89,.86,.91,.93,.96],
    roomName: 'bocklin-2024',
  },
  {
    id: 'v2', type: 'video',
    artist: 'Lena Volkov', handle: 'lena_v.base',
    title: 'Dissolution Study No.1 — charcoal technique explained',
    ticker: '$DISS', category: 'Drawing',
    views: '5.8K', duration: '38:22', uploadedAt: '1 week ago', marketCap: '$3.9K',
    color: '#60a5fa',
    glow1: 'rgba(96,165,250,0.25)', glow2: 'rgba(37,99,235,0.12)',
    base: 'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
    spark: [.50,.48,.45,.42,.44,.40,.38,.42,.45,.48,.50,.52,.50,.48,.45,.42,.40,.38,.35,.32],
  },
  {
    id: 's5', type: 'live',
    artist: 'Lena Volkov', handle: 'lena_v.base',
    title: 'Dissolution Study No.4 — charcoal & shadow',
    ticker: '$DISS', category: 'Drawing',
    viewers: 56, liveFor: '31m', marketCap: '$3.9K',
    color: '#60a5fa',
    glow1: 'rgba(96,165,250,0.25)', glow2: 'rgba(37,99,235,0.12)',
    base: 'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
    spark: [.50,.48,.45,.42,.44,.40,.38,.42,.45,.48,.50,.52,.50,.48,.45,.42,.40,.38,.35,.32],
    roomName: 'lena-2024',
  },
  {
    id: 'v3', type: 'video',
    artist: 'Ivan Sorokin', handle: 'ivan_sorokin.eth',
    title: 'Nocturne at the Bridge — full watercolor from sketch to finish',
    ticker: '$NOCTURNE', category: 'Painting',
    views: '8.1K', duration: '1:14:39', uploadedAt: '2 days ago', marketCap: '$2.4K',
    color: '#38bdf8',
    glow1: 'rgba(56,189,248,0.28)', glow2: 'rgba(14,116,144,0.14)',
    base: 'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
    spark: [.30,.32,.35,.38,.36,.34,.38,.40,.42,.46,.49,.51,.53,.56,.59,.61,.63,.66,.69,.72],
  },
  {
    id: 's6', type: 'live',
    artist: 'Ivan Sorokin', handle: 'ivan_sorokin.eth',
    title: 'Nocturne at the Bridge — watercolor session',
    ticker: '$NOCTURNE', category: 'Painting',
    viewers: 143, liveFor: '2h 7m', marketCap: '$2.4K',
    color: '#38bdf8',
    glow1: 'rgba(56,189,248,0.28)', glow2: 'rgba(14,116,144,0.14)',
    base: 'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
    spark: [.30,.32,.35,.38,.36,.34,.38,.40,.42,.46,.49,.51,.53,.56,.59,.61,.63,.66,.69,.72],
    roomName: 'ivan-2024',
  },
  {
    id: 'v4', type: 'video',
    artist: 'Yui Nakamura', handle: 'yui_n.base',
    title: 'Amber Protocol — process video, mixed media on digital canvas',
    ticker: '$AMBER', category: 'Mixed Media',
    views: '3.2K', duration: '55:40', uploadedAt: '5 days ago', marketCap: '$3.2K',
    color: '#fb923c',
    glow1: 'rgba(251,146,60,0.28)', glow2: 'rgba(194,65,12,0.14)',
    base: 'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
    spark: [.40,.45,.42,.48,.51,.56,.53,.59,.61,.63,.66,.69,.66,.71,.73,.76,.73,.79,.81,.83],
  },
  {
    id: 's7', type: 'live',
    artist: 'Yui Nakamura', handle: 'yui_n.base',
    title: 'Amber Protocol — abstract mixed media',
    ticker: '$AMBER', category: 'Mixed Media',
    viewers: 78, liveFor: '55m', marketCap: '$3.2K',
    color: '#fb923c',
    glow1: 'rgba(251,146,60,0.28)', glow2: 'rgba(194,65,12,0.14)',
    base: 'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
    spark: [.40,.45,.42,.48,.51,.56,.53,.59,.61,.63,.66,.69,.66,.71,.73,.76,.73,.79,.81,.83],
    roomName: 'yui-2024',
  },
  {
    id: 'v5', type: 'video',
    artist: 'Paulo Rodrigues', handle: 'paulo_r.base',
    title: 'Convergence I — full sculpture build timelapse (8 weeks)',
    ticker: '$CONV1', category: 'Sculpture',
    views: '1.9K', duration: '22:08', uploadedAt: '2 weeks ago', marketCap: '$1.3K',
    color: '#94a3b8',
    glow1: 'rgba(148,163,184,0.20)', glow2: 'rgba(71,85,105,0.12)',
    base: 'linear-gradient(158deg,#080a0e 0%,#0c0f14 60%,#080a0e 100%)',
    spark: [.50,.52,.50,.48,.50,.52,.54,.52,.50,.48,.50,.52,.50,.52,.54,.56,.58,.60,.62,.64],
  },
]

const CATEGORIES = ['All', 'Live', 'Videos', 'Painting', 'Drawing', 'Digital', 'Sculpture', 'Mixed Media']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

// ── Sparkline ─────────────────────────────────────────────────────
function Spark({ data, color = '#22c55e', w = 52, h = 18 }: {
  data: number[]; color?: string; w?: number; h?: number
}) {
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v * h * 0.76 + h * 0.12),
  }))
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    const mx = (p.x + c.x) / 2
    d += ` C ${mx.toFixed(1)} ${p.y.toFixed(1)} ${mx.toFixed(1)} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
  }
  const fill = `${d} L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg${color.replace('#','')})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
    </svg>
  )
}

// ── Thumbnail background ──────────────────────────────────────────
function ThumbBg({ item }: { item: StreamItem }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: item.base }}/>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 55% at 25% 30%, ${item.glow1} 0%, transparent 65%)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 45% 40% at 75% 70%, ${item.glow2} 0%, transparent 60%)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, color: 'rgba(255,255,255,0.04)', transform: 'rotate(-12deg)', fontSize: item.ticker.length > 7 ? 26 : 34, whiteSpace: 'nowrap' }}>
          {item.ticker}
        </span>
      </div>
    </>
  )
}

// ── Video Card (YouTube style) ────────────────────────────────────
function VideoCard({ item, onClick }: { item: StreamItem; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer flex flex-col gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'tween', duration: 0.3 }}>

      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: '#111' }}>
        <ThumbBg item={item}/>

        {/* Hover overlay */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }}/>

        {/* LIVE badge */}
        {item.type === 'live' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5"
            style={{ background: '#dc2626', borderRadius: 2 }}>
            <motion.span
              className="size-[5px] rounded-full"
              style={{ background: 'white', display: 'inline-block' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}/>
            <span className="font-mono text-[7px] font-bold text-white tracking-[0.15em]">LIVE</span>
          </div>
        )}

        {/* Duration (VOD) */}
        {item.type === 'video' && item.duration && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-white"
            style={{ background: 'rgba(0,0,0,0.82)', borderRadius: 2 }}>
            {item.duration}
          </div>
        )}

        {/* Viewer count overlay for live */}
        {item.type === 'live' && item.viewers !== undefined && (
          <div className="absolute bottom-1.5 left-2 font-mono text-[7px]"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            {fmt(item.viewers)} watching
          </div>
        )}

        {/* Market cap chip */}
        <div className="absolute top-2 right-2 font-mono text-[7px] font-bold px-1.5 py-0.5"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#4ade80', borderRadius: 2 }}>
          {item.marketCap}
        </div>
      </div>

      {/* Meta row — YouTube style */}
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div className="size-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[10px] font-bold mt-0.5"
          style={{ background: `${item.color}18`, border: `1.5px solid ${item.color}45`, color: item.color }}>
          {item.artist[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[11px] font-semibold leading-snug line-clamp-2"
            style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>
            {item.title}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-mono text-[8.5px] font-semibold" style={{ color: item.color }}>
              {item.ticker}
            </span>
            <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.28)' }}>·</span>
            <span className="font-sans text-[8.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {item.artist}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            {item.type === 'live' ? (
              <>
                <span className="font-mono text-[7.5px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {fmt(item.viewers ?? 0)} viewers · {item.liveFor}
                </span>
              </>
            ) : (
              <span className="font-mono text-[7.5px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {item.views} views · {item.uploadedAt}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Section header ─────────────────────────────────────────────────
function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20, fontWeight: 600,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: '-0.02em',
      }}>
        {label}
      </h2>
      <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
        {count} {count === 1 ? 'result' : 'results'}
      </span>
    </div>
  )
}

// ── Live chip ─────────────────────────────────────────────────────
function LiveChip({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span className="size-1.5 rounded-full" style={{ background: '#22c55e', display: 'inline-block' }}
        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}/>
      <span className="font-mono text-[7.5px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
        {count} live · {(count * 100 + 850).toLocaleString()} watching
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Go Live modal
// ─────────────────────────────────────────────────────────────────
const CATS_LIVE = ['Painting', 'Drawing', 'Digital', 'Sculpture', 'Mixed Media']

function GoLiveModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [title,   setTitle]   = useState('')
  const [cat,     setCat]     = useState('Painting')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleStart = useCallback(async () => {
    if (!title.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const jwt = authStore.getJwt()
      const res = await fetch(`${API}/live/create`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ title: title.trim(), category: cat }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Failed to create stream')
      }
      const data = await res.json()
      sessionStorage.setItem(`livekit_host_token_${data.roomName}`, data.token)
      router.push(`/studio/stream/${data.roomName}`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not start stream. Try again.')
      setLoading(false)
    }
  }, [title, cat, loading, router])

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="w-[440px] overflow-hidden"
        style={{ background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'tween', duration: 0.22 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <motion.span className="size-2 rounded-full" style={{ background: '#dc2626', display: 'inline-block' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }}/>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              Go Live
            </span>
          </div>
          <button type="button" onClick={onClose}
            className="font-mono text-[13px] transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
            ✕
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Title input */}
          <div>
            <label className="font-mono text-[7px] tracking-widest uppercase block mb-2"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              Stream Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="What are you creating today?"
              className="w-full bg-transparent font-sans text-[11.5px] px-3 py-2.5 outline-none transition-colors"
              style={{
                border: `1px solid ${title ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)'}`,
                color: 'rgba(255,255,255,0.82)',
                caretColor: '#D4AF37',
              }}/>
          </div>

          {/* Category */}
          <div>
            <label className="font-mono text-[7px] tracking-widest uppercase block mb-2"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATS_LIVE.map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className="py-2 font-mono text-[7.5px] transition-all"
                  style={{
                    border:     `1px solid ${cat === c ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    background: cat === c ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color:      cat === c ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="font-mono text-[8.5px] px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {error}
            </p>
          )}

          <motion.button
            type="button"
            onClick={handleStart}
            disabled={!title.trim() || loading}
            className="w-full py-3 font-mono text-[8.5px] tracking-widest font-semibold mt-1"
            style={{
              background: title.trim() ? 'rgba(220,38,38,0.18)' : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${title.trim() ? 'rgba(220,38,38,0.45)' : 'rgba(255,255,255,0.07)'}`,
              color:      title.trim() ? '#f87171' : 'rgba(255,255,255,0.18)',
              cursor:     title.trim() && !loading ? 'pointer' : 'default',
            }}
            whileHover={title.trim() && !loading ? { background: 'rgba(220,38,38,0.28)' } : {}}
            whileTap={title.trim() && !loading ? { scale: 0.98 } : {}}>
            {loading ? '● STARTING…' : '● START STREAMING'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Main LivePage
// ─────────────────────────────────────────────────────────────────
export function LivePage() {
  const router = useRouter()
  const [category,   setCategory]   = useState('All')
  const [goLiveOpen, setGoLiveOpen] = useState(false)

  const handleCardClick = (item: StreamItem) => {
    if (item.type === 'live' && item.roomName) {
      router.push(`/live/${item.roomName}`)
    }
    // VOD: could navigate to /watch/[id] when that page exists
  }

  const filtered = useMemo(() => {
    if (category === 'All')    return ITEMS
    if (category === 'Live')   return ITEMS.filter(i => i.type === 'live')
    if (category === 'Videos') return ITEMS.filter(i => i.type === 'video')
    return ITEMS.filter(i => i.category === category)
  }, [category])

  const liveItems  = filtered.filter(i => i.type === 'live')
  const videoItems = filtered.filter(i => i.type === 'video')

  const showLiveSection  = category !== 'Videos' && liveItems.length > 0
  const showVideoSection = category !== 'Live'   && videoItems.length > 0

  const totalLive = ITEMS.filter(i => i.type === 'live').length

  return (
    <>
      <AnimatePresence>
        {goLiveOpen && <GoLiveModal key="golive" onClose={() => setGoLiveOpen(false)}/>}
      </AnimatePresence>

      <div style={{ marginTop: 68, background: '#0a0a0a', minHeight: 'calc(100vh - 68px)' }}>

        {/* ── Top bar ── */}
        <div className="sticky top-[68px] z-10 flex items-center gap-0 px-4"
          style={{
            height: 46,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(16px)',
          }}>
          {/* Filter tabs */}
          <div className="flex items-center flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <motion.button key={cat} type="button" onClick={() => setCategory(cat)}
                className="shrink-0 px-3.5 h-full font-sans text-[9px] font-medium relative"
                style={{ color: category === cat ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.32)' }}
                whileHover={{ color: 'rgba(255,255,255,0.65)' }}>
                {cat}
                {cat === 'Live' && (
                  <span className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full font-mono text-[6px] font-bold"
                    style={{ background: '#dc2626', color: 'white', verticalAlign: 'middle' }}>
                    {totalLive}
                  </span>
                )}
                {category === cat && (
                  <motion.div
                    layoutId="tabline"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: 'rgba(255,255,255,0.7)' }}/>
                )}
              </motion.button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <LiveChip count={totalLive}/>

            <motion.button type="button" onClick={() => setGoLiveOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-[7.5px] font-semibold tracking-wider"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', color: '#f87171' }}
              whileHover={{ background: 'rgba(220,38,38,0.24)' }}
              whileTap={{ scale: 0.97 }}>
              <motion.span className="size-1.5 rounded-full" style={{ background: '#f87171', display: 'inline-block' }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }}/>
              GO LIVE
            </motion.button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 py-6">

          {/* Live section */}
          {showLiveSection && (
            <div className="mb-8">
              <SectionTitle label="Live now" count={liveItems.length}/>
              <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                {liveItems.map(item => (
                  <VideoCard key={item.id} item={item} onClick={() => handleCardClick(item)}/>
                ))}
              </div>
            </div>
          )}

          {/* Divider between sections */}
          {showLiveSection && showVideoSection && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 28 }}/>
          )}

          {/* Videos section */}
          {showVideoSection && (
            <div>
              <SectionTitle label="Published videos" count={videoItems.length}/>
              <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                {videoItems.map(item => (
                  <VideoCard key={item.id} item={item} onClick={() => handleCardClick(item)}/>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <span className="font-mono text-[8.5px] tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.18)' }}>
                No content in this category
              </span>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
