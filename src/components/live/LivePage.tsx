'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://artcurve-be-production.up.railway.app/api/v1'

// ── Types ──────────────────────────────────────────────────────────
interface Item {
  id: string
  type: 'live' | 'video'
  artist: string
  handle: string
  verified: boolean
  title: string
  ticker: string
  category: string
  viewers?: number
  views?: string
  duration?: string
  liveFor?: string
  uploadedAt?: string
  marketCap: string
  color: string
  glow1: string
  glow2: string
  base: string
  spark: number[]
  roomName?: string
}

// ── Data ───────────────────────────────────────────────────────────
const ALL_ITEMS: Item[] = [
  {
    id:'s1', type:'live', artist:'Soo-ah Kim', handle:'soo_ah.eth', verified:true,
    title:'Pale Architecture — panel 3, oil on canvas · live from the studio',
    ticker:'$PALE', category:'Painting', viewers:3420, liveFor:'1h 23m', marketCap:'$84.2K',
    color:'#a78bfa', glow1:'rgba(139,92,246,0.38)', glow2:'rgba(91,33,182,0.20)',
    base:'linear-gradient(158deg,#09091e 0%,#0f0f2a 60%,#0a0a1c 100%)',
    spark:[.42,.44,.40,.47,.52,.50,.57,.62,.59,.66,.71,.68,.73,.76,.72,.79,.83,.80,.86,.90],
    roomName:'soo-ah-2024',
  },
  {
    id:'s2', type:'live', artist:'Marcus Adler', handle:'markus.eth', verified:true,
    title:'Threshold Fragment — oil painting, live session',
    ticker:'$THRESH', category:'Painting', viewers:1890, liveFor:'42m', marketCap:'$31.5K',
    color:'#f87171', glow1:'rgba(239,68,68,0.32)', glow2:'rgba(185,28,28,0.16)',
    base:'linear-gradient(158deg,#1a0808 0%,#220d0d 60%,#160606 100%)',
    spark:[.60,.55,.58,.52,.50,.54,.48,.45,.50,.52,.55,.52,.50,.48,.45,.46,.44,.42,.40,.38],
    roomName:'marcus-2024',
  },
  {
    id:'s3', type:'live', artist:'Aiko Tanaka', handle:'aiko.base', verified:false,
    title:'Generative bloom — live coding in p5.js, open canvas session',
    ticker:'$BLOOM', category:'Digital', viewers:970, liveFor:'18m', marketCap:'$4.1K',
    color:'#4ade80', glow1:'rgba(74,222,128,0.28)', glow2:'rgba(22,163,74,0.15)',
    base:'linear-gradient(158deg,#040f08 0%,#07180d 60%,#040d07 100%)',
    spark:[.30,.35,.40,.38,.42,.46,.51,.49,.53,.56,.61,.59,.63,.66,.69,.71,.73,.76,.79,.83],
    roomName:'aiko-2024',
  },
  {
    id:'s4', type:'live', artist:'Böcklin', handle:'böcklin.eth', verified:true,
    title:'Self-Portrait with Death — oil reinterpretation, live commentary',
    ticker:'$BÖCKLIN', category:'Drawing', viewers:2340, liveFor:'3h 1m', marketCap:'$18.2K',
    color:'#D4AF37', glow1:'rgba(212,175,55,0.30)', glow2:'rgba(161,120,24,0.15)',
    base:'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
    spark:[.50,.52,.55,.60,.63,.66,.69,.73,.76,.79,.81,.83,.86,.89,.91,.89,.86,.91,.93,.96],
    roomName:'bocklin-2024',
  },
  {
    id:'s5', type:'live', artist:'Lena Volkov', handle:'lena_v.base', verified:false,
    title:'Dissolution Study No.4 — charcoal & shadow, watching the process',
    ticker:'$DISS', category:'Drawing', viewers:560, liveFor:'31m', marketCap:'$3.9K',
    color:'#60a5fa', glow1:'rgba(96,165,250,0.25)', glow2:'rgba(37,99,235,0.12)',
    base:'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
    spark:[.50,.48,.45,.42,.44,.40,.38,.42,.45,.48,.50,.52,.50,.48,.45,.42,.40,.38,.35,.32],
    roomName:'lena-2024',
  },
  {
    id:'s6', type:'live', artist:'Ivan Sorokin', handle:'ivan_sorokin.eth', verified:true,
    title:'Nocturne at the Bridge — watercolor, live from Warsaw',
    ticker:'$NOCTURNE', category:'Painting', viewers:1430, liveFor:'2h 7m', marketCap:'$2.4K',
    color:'#38bdf8', glow1:'rgba(56,189,248,0.28)', glow2:'rgba(14,116,144,0.14)',
    base:'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
    spark:[.30,.32,.35,.38,.36,.34,.38,.40,.42,.46,.49,.51,.53,.56,.59,.61,.63,.66,.69,.72],
    roomName:'ivan-2024',
  },
  {
    id:'s7', type:'live', artist:'Yui Nakamura', handle:'yui_n.base', verified:false,
    title:'Amber Protocol — abstract mixed media experiment',
    ticker:'$AMBER', category:'Mixed Media', viewers:780, liveFor:'55m', marketCap:'$3.2K',
    color:'#fb923c', glow1:'rgba(251,146,60,0.28)', glow2:'rgba(194,65,12,0.14)',
    base:'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
    spark:[.40,.45,.42,.48,.51,.56,.53,.59,.61,.63,.66,.69,.66,.71,.73,.76,.73,.79,.81,.83],
    roomName:'yui-2024',
  },
  {
    id:'s8', type:'live', artist:'Paulo Rodrigues', handle:'paulo_r.base', verified:false,
    title:'Convergence I — sculpture live, clay session vol.3',
    ticker:'$CONV1', category:'Sculpture', viewers:410, liveFor:'22m', marketCap:'$1.3K',
    color:'#94a3b8', glow1:'rgba(148,163,184,0.20)', glow2:'rgba(71,85,105,0.12)',
    base:'linear-gradient(158deg,#080a0e 0%,#0c0f14 60%,#080a0e 100%)',
    spark:[.50,.52,.50,.48,.50,.52,.54,.52,.50,.48,.50,.52,.50,.52,.54,.56,.58,.60,.62,.64],
    roomName:'paulo-2024',
  },
  // ── VODs ──────────────────────────────────────────────────────────
  {
    id:'v1', type:'video', artist:'Böcklin', handle:'böcklin.eth', verified:true,
    title:'Self-Portrait with Death — full 4-hour process timelapse',
    ticker:'$BÖCKLIN', category:'Painting',
    views:'12.4K', duration:'4:02:11', uploadedAt:'3 ngày trước', marketCap:'$18.2K',
    color:'#D4AF37', glow1:'rgba(212,175,55,0.30)', glow2:'rgba(161,120,24,0.15)',
    base:'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
    spark:[.50,.52,.55,.60,.63,.66,.69,.73,.76,.79,.81,.83,.86,.89,.91,.89,.86,.91,.93,.96],
  },
  {
    id:'v2', type:'video', artist:'Lena Volkov', handle:'lena_v.base', verified:false,
    title:'Dissolution Study No.1 — charcoal technique full walkthrough',
    ticker:'$DISS', category:'Drawing',
    views:'5.8K', duration:'38:22', uploadedAt:'1 tuần trước', marketCap:'$3.9K',
    color:'#60a5fa', glow1:'rgba(96,165,250,0.25)', glow2:'rgba(37,99,235,0.12)',
    base:'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
    spark:[.50,.48,.45,.42,.44,.40,.38,.42,.45,.48,.50,.52,.50,.48,.45,.42,.40,.38,.35,.32],
  },
  {
    id:'v3', type:'video', artist:'Ivan Sorokin', handle:'ivan_sorokin.eth', verified:true,
    title:'Nocturne at the Bridge — full watercolor from sketch to finish',
    ticker:'$NOCTURNE', category:'Painting',
    views:'8.1K', duration:'1:14:39', uploadedAt:'2 ngày trước', marketCap:'$2.4K',
    color:'#38bdf8', glow1:'rgba(56,189,248,0.28)', glow2:'rgba(14,116,144,0.14)',
    base:'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
    spark:[.30,.32,.35,.38,.36,.34,.38,.40,.42,.46,.49,.51,.53,.56,.59,.61,.63,.66,.69,.72],
  },
  {
    id:'v4', type:'video', artist:'Yui Nakamura', handle:'yui_n.base', verified:false,
    title:'Amber Protocol — process video, mixed media on digital canvas',
    ticker:'$AMBER', category:'Mixed Media',
    views:'3.2K', duration:'55:40', uploadedAt:'5 ngày trước', marketCap:'$3.2K',
    color:'#fb923c', glow1:'rgba(251,146,60,0.28)', glow2:'rgba(194,65,12,0.14)',
    base:'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
    spark:[.40,.45,.42,.48,.51,.56,.53,.59,.61,.63,.66,.69,.66,.71,.73,.76,.73,.79,.81,.83],
  },
  {
    id:'v5', type:'video', artist:'Soo-ah Kim', handle:'soo_ah.eth', verified:true,
    title:'Pale Architecture — panel 1 & 2 completed, full recording',
    ticker:'$PALE', category:'Painting',
    views:'9.7K', duration:'2:33:05', uploadedAt:'1 tuần trước', marketCap:'$84.2K',
    color:'#a78bfa', glow1:'rgba(139,92,246,0.38)', glow2:'rgba(91,33,182,0.20)',
    base:'linear-gradient(158deg,#09091e 0%,#0f0f2a 60%,#0a0a1c 100%)',
    spark:[.42,.44,.40,.47,.52,.50,.57,.62,.59,.66,.71,.68,.73,.76,.72,.79,.83,.80,.86,.90],
  },
  {
    id:'v6', type:'video', artist:'Aiko Tanaka', handle:'aiko.base', verified:false,
    title:'p5.js generative art workshop — full 3-hour session recording',
    ticker:'$BLOOM', category:'Digital',
    views:'4.4K', duration:'3:01:18', uploadedAt:'3 ngày trước', marketCap:'$4.1K',
    color:'#4ade80', glow1:'rgba(74,222,128,0.28)', glow2:'rgba(22,163,74,0.15)',
    base:'linear-gradient(158deg,#040f08 0%,#07180d 60%,#040d07 100%)',
    spark:[.30,.35,.40,.38,.42,.46,.51,.49,.53,.56,.61,.59,.63,.66,.69,.71,.73,.76,.79,.83],
  },
]

// ── Category chips ─────────────────────────────────────────────────
const CHIPS = ['Tất cả', 'Trực tiếp', 'Video', 'Painting', 'Drawing', 'Digital', 'Sculpture', 'Mixed Media', 'Trending', 'Mới phát hành']

function fmt(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}K`
  if (n >= 1000)  return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ── Thumbnail background ───────────────────────────────────────────
function ThumbBg({ item }: { item: Item }) {
  return (
    <>
      <div style={{ position:'absolute', inset:0, background: item.base }}/>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 65% 55% at 25% 30%, ${item.glow1} 0%, transparent 65%)` }}/>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 45% 40% at 75% 70%, ${item.glow2} 0%, transparent 60%)` }}/>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'monospace', fontWeight:900, color:'rgba(255,255,255,0.045)', transform:'rotate(-12deg)', fontSize: item.ticker.length > 7 ? 28 : 38, whiteSpace:'nowrap', userSelect:'none' }}>
          {item.ticker}
        </span>
      </div>
    </>
  )
}

// ── Video Card — YouTube style ─────────────────────────────────────
function VideoCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered]  = useState(false)

  return (
    <div
      className="cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      onClick={onClick}>

      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio:'16/9', borderRadius: 8, background:'#1a1a1a' }}>
        <ThumbBg item={item}/>

        {/* Hover darken */}
        <motion.div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.18)' }}
          animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.12 }}/>

        {/* LIVE badge */}
        {item.type === 'live' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5"
            style={{ background:'#dc2626', borderRadius: 3 }}>
            <motion.span className="size-[5px] rounded-full" style={{ background:'white', display:'inline-block' }}
              animate={{ opacity:[1,0.2,1] }} transition={{ duration:1.1, repeat:Infinity }}/>
            <span className="font-sans text-[10px] font-bold text-white tracking-wide">TRỰC TIẾP</span>
          </div>
        )}

        {/* Viewer count for live */}
        {item.type === 'live' && item.viewers !== undefined && (
          <div className="absolute bottom-2 right-2 font-sans text-[10px] font-medium px-1.5 py-0.5 text-white"
            style={{ background:'rgba(0,0,0,0.75)', borderRadius:3 }}>
            {fmt(item.viewers)} người xem
          </div>
        )}

        {/* Duration for VOD */}
        {item.type === 'video' && item.duration && (
          <div className="absolute bottom-2 right-2 font-sans text-[11px] font-semibold text-white px-1.5 py-0.5"
            style={{ background:'rgba(0,0,0,0.82)', borderRadius:3 }}>
            {item.duration}
          </div>
        )}
      </div>

      {/* Meta — YouTube style */}
      <div className="flex gap-3 mt-3" onClick={e => e.stopPropagation()}>
        {/* Channel avatar */}
        <div className="shrink-0 cursor-pointer"
          onClick={() => {}}>
          <div className="size-9 rounded-full flex items-center justify-center font-sans text-[13px] font-bold"
            style={{ background:`${item.color}20`, border:`2px solid ${item.color}40`, color: item.color }}>
            {item.artist[0]}
          </div>
        </div>

        {/* Right info */}
        <div className="flex-1 min-w-0 relative" onClick={onClick}>
          {/* Title */}
          <p className="font-sans font-semibold leading-snug line-clamp-2 pr-6"
            style={{ fontSize:13, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.01em' }}>
            {item.title}
          </p>

          {/* Channel name */}
          <div className="flex items-center gap-1 mt-1">
            <span className="font-sans text-[12px]" style={{ color:'rgba(255,255,255,0.5)' }}>
              {item.artist}
            </span>
            {item.verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
                <path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          {/* Stats */}
          <p className="font-sans text-[12px] mt-0.5" style={{ color:'rgba(255,255,255,0.35)' }}>
            {item.type === 'live'
              ? `${fmt(item.viewers ?? 0)} người đang xem • ${item.ticker}`
              : `${item.views} lượt xem • ${item.uploadedAt}`
            }
          </p>
        </div>

        {/* 3-dot menu */}
        <div className="absolute top-0 right-0 shrink-0 relative" onClick={e => e.stopPropagation()}>
          <motion.button
            type="button"
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="size-8 flex items-center justify-center rounded-full"
            style={{ color:'rgba(255,255,255,0.5)' }}
            animate={{ opacity: hovered || menuOpen ? 1 : 0 }}
            whileHover={{ background:'rgba(255,255,255,0.1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="absolute right-0 top-9 w-44 z-50 overflow-hidden"
                style={{ background:'#282828', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8 }}
                initial={{ opacity:0, y:-4, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, scale:0.97 }}
                transition={{ duration:0.12 }}>
                {['Lưu vào danh sách', 'Chia sẻ', 'Báo cáo'].map(action => (
                  <button key={action} type="button"
                    className="w-full text-left px-4 py-2.5 font-sans text-[12px] transition-colors"
                    style={{ color:'rgba(255,255,255,0.78)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {action}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Go Live Modal
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
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${jwt}` },
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
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="w-[460px] overflow-hidden"
        style={{ background:'#212121', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity:0, scale:0.96, y:16 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96 }}
        transition={{ type:'tween', duration:0.2 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full flex items-center justify-center"
              style={{ background:'#dc2626' }}>
              <motion.span className="size-2 rounded-full" style={{ background:'white', display:'inline-block' }}
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.1, repeat:Infinity }}/>
            </div>
            <span className="font-sans font-semibold text-[15px]" style={{ color:'rgba(255,255,255,0.9)' }}>
              Phát trực tiếp
            </span>
          </div>
          <button type="button" onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full font-sans text-[16px] transition-colors"
            style={{ color:'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            ✕
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="font-sans text-[12px] font-medium block mb-2"
              style={{ color:'rgba(255,255,255,0.55)' }}>
              Tiêu đề buổi phát
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="Hôm nay bạn đang sáng tác gì?"
              className="w-full bg-transparent font-sans text-[13px] px-3.5 py-2.5 outline-none"
              style={{ border:`1px solid rgba(255,255,255,${title ? '0.25' : '0.1'})`, borderRadius:6, color:'rgba(255,255,255,0.85)', caretColor:'#dc2626', transition:'border-color 0.15s' }}/>
          </div>

          {/* Category */}
          <div>
            <label className="font-sans text-[12px] font-medium block mb-2"
              style={{ color:'rgba(255,255,255,0.55)' }}>
              Danh mục
            </label>
            <div className="flex flex-wrap gap-2">
              {CATS_LIVE.map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className="px-3 py-1.5 font-sans text-[12px] font-medium transition-all"
                  style={{ borderRadius:20, border:`1px solid ${cat === c ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.12)'}`, background: cat === c ? 'rgba(220,38,38,0.12)' : 'transparent', color: cat === c ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 font-sans text-[12px]"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#f87171' }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={!title.trim() || loading}
            className="w-full py-3 font-sans text-[13px] font-semibold transition-all mt-1"
            style={{ borderRadius:6, background: title.trim() ? '#dc2626' : 'rgba(255,255,255,0.08)', color: title.trim() ? 'white' : 'rgba(255,255,255,0.25)', cursor: title.trim() && !loading ? 'pointer' : 'default', opacity: loading ? 0.7 : 1 }}
            onMouseEnter={e => { if (title.trim() && !loading) e.currentTarget.style.background = '#b91c1c' }}
            onMouseLeave={e => { if (title.trim() && !loading) e.currentTarget.style.background = '#dc2626' }}>
            {loading ? 'Đang khởi động...' : '● Bắt đầu phát trực tiếp'}
          </button>
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
  const [chip,       setChip]       = useState('Tất cả')
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const chipsRef = useRef<HTMLDivElement>(null)

  const handleCardClick = (item: Item) => {
    if (item.type === 'live' && item.roomName) {
      router.push(`/live/${item.roomName}`)
    }
  }

  const filtered = useMemo(() => {
    if (chip === 'Tất cả')   return ALL_ITEMS
    if (chip === 'Trực tiếp') return ALL_ITEMS.filter(i => i.type === 'live')
    if (chip === 'Video')     return ALL_ITEMS.filter(i => i.type === 'video')
    if (chip === 'Trending')  return [...ALL_ITEMS].sort((a,b) => (b.viewers ?? 0) - (a.viewers ?? 0))
    if (chip === 'Mới phát hành') return ALL_ITEMS.filter(i => i.type === 'video')
    return ALL_ITEMS.filter(i => i.category === chip)
  }, [chip])

  const totalLive = ALL_ITEMS.filter(i => i.type === 'live').length

  return (
    <>
      <AnimatePresence>
        {goLiveOpen && <GoLiveModal key="golive" onClose={() => setGoLiveOpen(false)}/>}
      </AnimatePresence>

      <div style={{ marginTop:68, background:'#0f0f0f', minHeight:'calc(100vh - 68px)' }}>

        {/* ── Category chips + Go Live button ── */}
        <div className="sticky z-10 flex items-center gap-0"
          style={{ top:68, background:'rgba(15,15,15,0.98)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>

          {/* Chips scroll area */}
          <div ref={chipsRef} className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto flex-1"
            style={{ scrollbarWidth:'none' }}>
            {CHIPS.map(c => (
              <button key={c} type="button" onClick={() => setChip(c)}
                className="shrink-0 px-3 py-1 font-sans text-[12px] font-medium transition-all"
                style={{
                  borderRadius: 20,
                  background:   chip === c ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)',
                  color:        chip === c ? '#0f0f0f' : 'rgba(255,255,255,0.72)',
                  whiteSpace:   'nowrap',
                }}>
                {c}
                {c === 'Trực tiếp' && (
                  <span className="ml-1.5 inline-flex items-center justify-center font-sans text-[10px] font-bold w-4 h-4 rounded-full"
                    style={{ background: chip === c ? '#dc2626' : 'rgba(220,38,38,0.8)', color:'white', verticalAlign:'middle' }}>
                    {totalLive}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Go Live */}
          <div className="shrink-0 px-4 py-2.5">
            <button type="button" onClick={() => setGoLiveOpen(true)}
              className="flex items-center gap-2 px-4 py-2 font-sans text-[12px] font-semibold transition-all"
              style={{ borderRadius:20, background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.4)', color:'#f87171' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.15)')}>
              <motion.span className="size-2 rounded-full" style={{ background:'#f87171', display:'inline-block' }}
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.1, repeat:Infinity }}/>
              Phát trực tiếp
            </button>
          </div>
        </div>

        {/* ── Video grid ── */}
        <div className="px-6 py-5">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-3 gap-x-4 gap-y-8">
              {filtered.map(item => (
                <VideoCard key={item.id} item={item} onClick={() => handleCardClick(item)}/>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 gap-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity:0.15 }}>
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="font-sans text-[13px]" style={{ color:'rgba(255,255,255,0.25)' }}>
                Không có nội dung nào
              </p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
