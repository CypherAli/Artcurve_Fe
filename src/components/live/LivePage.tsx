'use client'
// ─────────────────────────────────────────────────────────────────
//  LivePage.tsx  —  Artist live streaming channels
//  Added: category filter, Go Live button, chat panel, upcoming streams
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://artcurve-be-production.up.railway.app/api/v1'

// ── Types ─────────────────────────────────────────────────────────
interface Stream {
  id:          string
  artist:      string
  handle:      string
  title:       string
  ticker:      string
  category:    string
  viewers:     number
  marketCap:   string
  duration:    string
  color:       string
  glow1:       string
  glow2:       string
  base:        string
  spark:       number[]
}

interface UpcomingStream {
  id:      string
  artist:  string
  handle:  string
  ticker:  string
  title:   string
  color:   string
  startsIn: string
}

interface ChatMsg {
  id:    string
  user:  string
  msg:   string
  color: string
}

// ── Data ──────────────────────────────────────────────────────────
const STREAMS: Stream[] = [
  {
    id:'s1', artist:'Soo-ah Kim', handle:'soo_ah.eth',
    title:'Pale Architecture — panel 3, oil on canvas',
    ticker:'$PALE', category:'Painting',
    viewers:342, marketCap:'$84.2K', duration:'1h 23m',
    color:'#a78bfa',
    glow1:'rgba(139,92,246,0.35)', glow2:'rgba(91,33,182,0.18)',
    base:'linear-gradient(158deg,#09091e 0%,#0f0f2a 60%,#0a0a1c 100%)',
    spark:[.42,.44,.40,.47,.52,.50,.57,.62,.59,.66,.71,.68,.73,.76,.72,.79,.83,.80,.86,.90],
  },
  {
    id:'s2', artist:'Marcus Adler', handle:'markus.eth',
    title:'Threshold Fragment — oil, live session',
    ticker:'$THRESH', category:'Painting',
    viewers:189, marketCap:'$31.5K', duration:'42m',
    color:'#f87171',
    glow1:'rgba(239,68,68,0.32)', glow2:'rgba(185,28,28,0.16)',
    base:'linear-gradient(158deg,#1a0808 0%,#220d0d 60%,#160606 100%)',
    spark:[.60,.55,.58,.52,.50,.54,.48,.45,.50,.52,.55,.52,.50,.48,.45,.46,.44,.42,.40,.38],
  },
  {
    id:'s3', artist:'Aiko Tanaka', handle:'aiko.base',
    title:'Generative bloom — live coding in p5.js',
    ticker:'$BLOOM', category:'Digital',
    viewers:97, marketCap:'$4.1K', duration:'18m',
    color:'#4ade80',
    glow1:'rgba(74,222,128,0.28)', glow2:'rgba(22,163,74,0.15)',
    base:'linear-gradient(158deg,#040f08 0%,#07180d 60%,#040d07 100%)',
    spark:[.30,.35,.40,.38,.42,.46,.51,.49,.53,.56,.61,.59,.63,.66,.69,.71,.73,.76,.79,.83],
  },
  {
    id:'s4', artist:'Böcklin', handle:'böcklin.eth',
    title:'Self-Portrait with Death — oil reinterpretation',
    ticker:'$BÖCKLIN', category:'Drawing',
    viewers:234, marketCap:'$18.2K', duration:'3h 1m',
    color:'#D4AF37',
    glow1:'rgba(212,175,55,0.30)', glow2:'rgba(161,120,24,0.15)',
    base:'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
    spark:[.50,.52,.55,.60,.63,.66,.69,.73,.76,.79,.81,.83,.86,.89,.91,.89,.86,.91,.93,.96],
  },
  {
    id:'s5', artist:'Lena Volkov', handle:'lena_v.base',
    title:'Dissolution Study No.4 — charcoal & shadow',
    ticker:'$DISS', category:'Drawing',
    viewers:56, marketCap:'$3.9K', duration:'31m',
    color:'#60a5fa',
    glow1:'rgba(96,165,250,0.25)', glow2:'rgba(37,99,235,0.12)',
    base:'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
    spark:[.50,.48,.45,.42,.44,.40,.38,.42,.45,.48,.50,.52,.50,.48,.45,.42,.40,.38,.35,.32],
  },
  {
    id:'s6', artist:'Ivan Sorokin', handle:'ivan_sorokin.eth',
    title:'Nocturne at the Bridge — watercolor session',
    ticker:'$NOCTURNE', category:'Painting',
    viewers:143, marketCap:'$2.4K', duration:'2h 7m',
    color:'#38bdf8',
    glow1:'rgba(56,189,248,0.28)', glow2:'rgba(14,116,144,0.14)',
    base:'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
    spark:[.30,.32,.35,.38,.36,.34,.38,.40,.42,.46,.49,.51,.53,.56,.59,.61,.63,.66,.69,.72],
  },
  {
    id:'s7', artist:'Yui Nakamura', handle:'yui_n.base',
    title:'Amber Protocol — abstract mixed media',
    ticker:'$AMBER', category:'Mixed Media',
    viewers:78, marketCap:'$3.2K', duration:'55m',
    color:'#fb923c',
    glow1:'rgba(251,146,60,0.28)', glow2:'rgba(194,65,12,0.14)',
    base:'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
    spark:[.40,.45,.42,.48,.51,.56,.53,.59,.61,.63,.66,.69,.66,.71,.73,.76,.73,.79,.81,.83],
  },
  {
    id:'s8', artist:'Paulo Rodrigues', handle:'paulo_r.base',
    title:'Convergence I — sculpture timelapse',
    ticker:'$CONV1', category:'Sculpture',
    viewers:41, marketCap:'$1.3K', duration:'22m',
    color:'#94a3b8',
    glow1:'rgba(148,163,184,0.20)', glow2:'rgba(71,85,105,0.12)',
    base:'linear-gradient(158deg,#080a0e 0%,#0c0f14 60%,#080a0e 100%)',
    spark:[.50,.52,.50,.48,.50,.52,.54,.52,.50,.48,.50,.52,.50,.52,.54,.56,.58,.60,.62,.64],
  },
]

const UPCOMING: UpcomingStream[] = [
  { id:'u1', artist:'Mira Okonkwo',  handle:'mira_ok.eth',  ticker:'$SHATTER', title:'Shattered Embrace — charcoal series premiere', color:'#f9a8d4', startsIn:'starts in 2h' },
  { id:'u2', artist:'Yuki Tanaka',   handle:'yuki_t.eth',   ticker:'$GHOST',   title:'Ghost of the Meridian — ink & digital', color:'#94a3b8', startsIn:'starts in 4h' },
  { id:'u3', artist:'Ivan Sorokin',  handle:'ivan_sorokin.eth', ticker:'$NOCTURNE', title:'Late Night Watercolor vol.2', color:'#38bdf8', startsIn:'tomorrow 8pm' },
]

const CHAT_SEED: ChatMsg[] = [
  { id:'c1', user:'collector_9',   msg:'the blue tones here are incredible',         color:'#60a5fa' },
  { id:'c2', user:'aiko.base',     msg:'loving this series soo_ah 🔥',               color:'#4ade80' },
  { id:'c3', user:'0x4f2…a91',     msg:'just picked up 0.3 tokens',                  color:'#D4AF37' },
  { id:'c4', user:'mira_ok.eth',   msg:'is this going on the bonding curve?',         color:'#a78bfa' },
  { id:'c5', user:'yui_n.base',    msg:'the composition is so calm',                 color:'rgba(255,255,255,0.4)' },
  { id:'c6', user:'collector_9',   msg:'$PALE mooning rn while watching 😂',         color:'#60a5fa' },
  { id:'c7', user:'böcklin.eth',   msg:'fellow artist support 💙',                   color:'#D4AF37' },
]

const INCOMING_MSGS = [
  { user:'yuki_t.eth',   msg:'watching from Tokyo 🌸',               color:'#f9a8d4' },
  { user:'0x7d8…9f0',   msg:'bought 0.1 just now',                   color:'#D4AF37' },
  { user:'collector_2', msg:'the texture on this one 🔥',            color:'rgba(255,255,255,0.4)' },
  { user:'aiko.base',   msg:'when is the next piece dropping?',       color:'#4ade80' },
  { user:'paulo_r',     msg:'incredible composition',                 color:'#60a5fa' },
  { user:'markus.eth',  msg:'I can see the influence of de Chirico',  color:'#f87171' },
  { user:'0x9c4…e17',  msg:'tipped 0.05 ETH ✨',                     color:'#D4AF37' },
]

const CATEGORIES = ['All', 'Painting', 'Drawing', 'Digital', 'Sculpture', 'Mixed Media']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── Smooth sparkline ──────────────────────────────────────────────
function Spark({ data, color = '#22c55e', w = 68, h = 26 }: {
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
        <linearGradient id={`sg${w}${h}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg${w}${h})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    </svg>
  )
}

// ── Rich thumbnail ────────────────────────────────────────────────
function Thumb({ stream, style, children }: {
  stream: Stream; style?: React.CSSProperties; children?: React.ReactNode
}) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: stream.base, ...style }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 55% at 22% 28%, ${stream.glow1} 0%, transparent 65%)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 45% 40% at 78% 72%, ${stream.glow2} 0%, transparent 60%)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.045)', transform: 'rotate(-14deg)', whiteSpace: 'nowrap', lineHeight: 1, fontSize: stream.ticker.length > 7 ? 28 : 36 }}>
          {stream.ticker}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Framer variants ───────────────────────────────────────────────
const EASE: [number,number,number,number] = [0.215,0.61,0.355,1.0]
const CARD_V = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'tween' as const, duration: 0.38, ease: EASE } },
}
const LIST_V = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

// ─────────────────────────────────────────────────────────────────
//  Chat panel
// ─────────────────────────────────────────────────────────────────
function ChatPanel({ stream }: { stream: Stream }) {
  const [messages, setMessages] = useState<ChatMsg[]>(CHAT_SEED)
  const [input, setInput] = useState('')

  useEffect(() => {
    let idx = 0
    const schedule = () => {
      const delay = 3500 + Math.random() * 3000
      return setTimeout(() => {
        const m = INCOMING_MSGS[idx % INCOMING_MSGS.length]
        setMessages(prev => [...prev.slice(-40), { id: `live-${Date.now()}-${idx}`, ...m }])
        idx++
        schedule()
      }, delay)
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [stream.id])

  return (
    <div className="flex flex-col h-full"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,4,6,0.92)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-sans text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Chat
        </span>
        <div className="flex items-center gap-1.5">
          <motion.span className="size-1.5 rounded-full" style={{ background: '#22c55e', display: 'inline-block' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}/>
          <span className="font-mono text-[7px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {fmt(stream.viewers)}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5"
        style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'tween', duration: 0.18 }}
              className="flex items-start gap-1.5 leading-snug">
              <span className="font-mono text-[7.5px] font-semibold shrink-0 mt-px" style={{ color: msg.color }}>
                {msg.user}
              </span>
              <span className="font-sans text-[8px]" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {msg.msg}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '5px 10px' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Send a message…"
            className="flex-1 bg-transparent outline-none font-sans text-[8.5px] placeholder:opacity-25"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim()) {
                setMessages(prev => [...prev.slice(-40), { id: `me-${Date.now()}`, user: 'you', msg: input.trim(), color: '#D4AF37' }])
                setInput('')
              }
            }}/>
          <span className="font-mono text-[7px] shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>↵</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Hero — featured stream
// ─────────────────────────────────────────────────────────────────
function Hero({ stream }: { stream: Stream }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={stream.id} className="relative flex-1 min-w-0 overflow-hidden"
        style={{ background: stream.base }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}>
        <Thumb stream={stream} style={{ position: 'absolute', inset: 0 }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.55) 42%,rgba(0,0,0,0.1) 100%)' }}/>
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 120, background: 'linear-gradient(to top,rgba(7,7,7,0.92) 0%,transparent 100%)' }}/>

        <div className="absolute inset-0 flex flex-col justify-center px-8" style={{ maxWidth: 520 }}>
          {/* LIVE + viewers + duration */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: '#16a34a' }}>
              <motion.span style={{ background: 'white', display: 'inline-block' }}
                className="size-1.5 rounded-full"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.1, repeat: Infinity }}/>
              <span className="font-mono text-[7.5px] font-bold text-white tracking-[0.2em]">LIVE</span>
            </div>
            <span className="font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {fmt(stream.viewers)} viewers
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.22)' }}>· {stream.duration}</span>
          </div>

          {/* Artist name */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 42, lineHeight: 1.0, color: 'rgba(255,255,255,0.94)', letterSpacing: '-0.025em', marginBottom: 8, textShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
            {stream.artist}
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', letterSpacing: '-0.01em', lineHeight: 1.4, maxWidth: 400, marginBottom: 18 }}>
            {stream.title}
          </p>

          {/* Creator row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="size-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-bold"
              style={{ background: `${stream.color}18`, border: `1.5px solid ${stream.color}45`, color: stream.color }}>
              {stream.artist[0]}
            </div>
            <div>
              <div className="font-mono text-[7.5px]" style={{ color: 'rgba(255,255,255,0.32)' }}>{stream.handle}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[11px] font-bold" style={{ color: stream.color }}>{stream.ticker}</span>
                <span className="font-mono text-[9.5px] font-semibold px-2 py-0.5"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                  {stream.marketCap}
                </span>
              </div>
            </div>
            <Spark data={stream.spark} color={stream.color} w={88} h={30}/>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <motion.button type="button"
              className="px-5 py-2 font-mono text-[8px] font-semibold tracking-wider"
              style={{ background: `${stream.color}18`, border: `1px solid ${stream.color}35`, color: stream.color }}
              whileHover={{ background: `${stream.color}28` }} whileTap={{ scale: 0.97 }}>
              TIP ARTIST
            </motion.button>
            <motion.button type="button"
              className="px-5 py-2 font-mono text-[8px] font-semibold tracking-wider"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.38)' }}
              whileHover={{ background: 'rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.97 }}>
              SHARE
            </motion.button>
          </div>
        </div>

        {/* Category tag */}
        <div className="absolute top-4 right-4 font-mono text-[7px] tracking-wider px-2.5 py-1"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.32)' }}>
          {stream.category.toUpperCase()}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Thumbnail strip
// ─────────────────────────────────────────────────────────────────
function Strip({ streams, activeId, onSelect }: {
  streams: Stream[]; activeId: string; onSelect: (s: Stream) => void
}) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.45)' }}>
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 px-4 py-2.5" style={{ width: 'max-content' }}>
          {streams.map(s => (
            <motion.div key={s.id} onClick={() => onSelect(s)}
              className="relative cursor-pointer overflow-hidden shrink-0"
              style={{ width: 148, height: 84, outline: activeId === s.id ? `2px solid ${s.color}` : '2px solid transparent', outlineOffset: activeId === s.id ? -2 : 0 }}
              whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }}>
              <Thumb stream={s} style={{ position: 'absolute', inset: 0 }}/>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)' }}/>
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5" style={{ background: '#16a34a' }}>
                <span className="size-[4px] rounded-full animate-pulse" style={{ background: 'white' }}/>
                <span className="font-mono text-[6px] font-bold text-white">LIVE</span>
              </div>
              <div className="absolute top-1.5 right-1.5 font-mono text-[7px] font-bold px-1 py-0.5"
                style={{ background: 'rgba(0,0,0,0.65)', color: '#4ade80' }}>{s.marketCap}</div>
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 pb-1.5">
                <span className="font-mono text-[6.5px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{fmt(s.viewers)} viewers</span>
                <Spark data={s.spark} color={s.color} w={38} h={16}/>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Stream card — grid tile
// ─────────────────────────────────────────────────────────────────
function Card({ stream, onClick }: { stream: Stream; onClick: () => void }) {
  return (
    <motion.div variants={CARD_V} onClick={onClick}
      className="cursor-pointer group overflow-hidden"
      style={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}
      whileHover={{ borderColor: 'rgba(255,255,255,0.14)' }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Thumb stream={stream} style={{ position: 'absolute', inset: 0 }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 100%)' }}/>
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5" style={{ background: '#16a34a' }}>
          <span className="size-[4px] rounded-full animate-pulse" style={{ background: 'white' }}/>
          <span className="font-mono text-[6.5px] font-bold text-white">LIVE</span>
        </div>
        <div className="absolute top-2 right-2 font-mono text-[7.5px] font-bold px-1.5 py-0.5"
          style={{ background: 'rgba(0,0,0,0.68)', color: '#4ade80' }}>{stream.marketCap}</div>
        <div className="absolute bottom-2 left-0 right-0 flex items-end justify-between px-2.5">
          <span className="font-mono text-[7px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{fmt(stream.viewers)} viewers</span>
          <Spark data={stream.spark} color={stream.color} w={52} h={20}/>
        </div>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: 'rgba(6,6,6,0.95)' }}>
        <div className="size-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[9px] font-bold"
          style={{ background: `${stream.color}15`, border: `1.5px solid ${stream.color}35`, color: stream.color }}>
          {stream.artist[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[9px] font-semibold truncate leading-tight"
            style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em' }}>{stream.title}</div>
          <div className="font-mono text-[7px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{stream.handle}</div>
        </div>
        <div className="font-mono text-[8px] font-bold shrink-0" style={{ color: stream.color }}>{stream.ticker}</div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Section
// ─────────────────────────────────────────────────────────────────
function Section({ title, streams, onSelect }: {
  title: string; streams: Stream[]; onSelect: (s: Stream) => void
}) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600, color: 'rgba(255,255,255,0.82)', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        <button type="button" className="font-mono text-[8px] tracking-wider" style={{ color: 'rgba(255,255,255,0.22)' }}>
          Show all ›
        </button>
      </div>
      <motion.div className="grid grid-cols-4 gap-3" variants={LIST_V} initial="hidden" animate="show">
        {streams.slice(0, 4).map(s => <Card key={s.id} stream={s} onClick={() => onSelect(s)}/>)}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Upcoming streams strip
// ─────────────────────────────────────────────────────────────────
function Upcoming() {
  return (
    <div className="px-6 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600, color: 'rgba(255,255,255,0.82)', letterSpacing: '-0.02em' }}>
          Upcoming
        </h2>
      </div>
      <div className="flex gap-3">
        {UPCOMING.map(u => (
          <motion.div key={u.id}
            className="flex-1 flex items-center gap-3 px-4 py-3 cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
            {/* Avatar */}
            <div className="size-8 rounded-full shrink-0 flex items-center justify-center font-mono text-[10px] font-bold"
              style={{ background: `${u.color}15`, border: `1.5px solid ${u.color}35`, color: u.color }}>
              {u.artist[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-[9.5px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.01em' }}>
                {u.title}
              </div>
              <div className="font-mono text-[7.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {u.handle} · <span style={{ color: u.color }}>{u.ticker}</span>
              </div>
            </div>
            <div className="font-mono text-[7px] shrink-0 px-2 py-1"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
              {u.startsIn}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Go Live modal (simple)
// ─────────────────────────────────────────────────────────────────
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
      const jwt  = authStore.getToken()
      const res  = await fetch(`${API}/live/create`, {
        method:  'POST',
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
      // Lưu host token vào sessionStorage trước khi redirect
      sessionStorage.setItem(`livekit_host_token_${data.roomName}`, data.token)
      router.push(`/studio/stream/${data.roomName}`)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Could not start stream. Try again.')
      setLoading(false)
    }
  }, [title, cat, loading, router])

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="w-[420px] overflow-hidden"
        style={{ background: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', duration: 0.22 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            Go Live
          </span>
          <button type="button" onClick={onClose}
            className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}>Stream Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="What are you creating today?"
              className="w-full bg-transparent font-sans text-[11px] px-3 py-2 outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.78)', caretColor: '#D4AF37' }}/>
          </div>
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}>Category</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <button key={c} type="button" onClick={() => setCat(c)}
                  className="py-1.5 font-mono text-[7px]"
                  style={{
                    border:     `1px solid ${cat === c ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    background: cat === c ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color:      cat === c ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  }}>{c}</button>
              ))}
            </div>
          </div>

          {error && (
            <p className="font-mono text-[8px]" style={{ color: '#f87171' }}>{error}</p>
          )}

          <motion.button
            type="button"
            onClick={handleStart}
            disabled={!title.trim() || loading}
            className="w-full py-2.5 font-mono text-[8.5px] tracking-widest font-semibold mt-1"
            style={{
              background: title ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${title ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.07)'}`,
              color:      title ? '#D4AF37' : 'rgba(255,255,255,0.18)',
              cursor:     title && !loading ? 'pointer' : 'default',
            }}
            whileHover={title && !loading ? { background: 'rgba(212,175,55,0.22)' } : {}}
            whileTap={title && !loading ? { scale: 0.98 } : {}}>
            {loading ? 'STARTING…' : 'START STREAMING'}
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
  const [featured,    setFeatured]    = useState<Stream>(STREAMS[0])
  const [category,    setCategory]    = useState('All')
  const [goLiveOpen,  setGoLiveOpen]  = useState(false)

  const filtered = category === 'All' ? STREAMS : STREAMS.filter(s => s.category === category)

  const byViewers  = useMemo(() => [...filtered].sort((a, b) => b.viewers - a.viewers), [filtered])
  const byTrending = useMemo(() => [...filtered].sort((a, b) => {
    const last = (s: Stream) => s.spark[s.spark.length - 1]
    return last(b) - last(a)
  }), [filtered])

  const handleSelect = (s: Stream) => {
    setFeatured(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalViewers = filtered.reduce((s, x) => s + x.viewers, 0)

  return (
    <>
      <AnimatePresence>
        {goLiveOpen && <GoLiveModal key="golive" onClose={() => setGoLiveOpen(false)}/>}
      </AnimatePresence>

      <motion.div className="overflow-y-auto"
        style={{ marginTop: 68, background: '#070707', minHeight: 'calc(100vh - 68px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}>

        {/* Top bar: categories + total + Go Live */}
        <div className="flex items-center gap-1 px-4 shrink-0 sticky top-0 z-10"
          style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,7,7,0.95)', backdropFilter: 'blur(12px)' }}>
          <span className="font-sans text-[11px] font-semibold mr-2"
            style={{ color: 'rgba(255,255,255,0.28)' }}>Live Now</span>

          {CATEGORIES.map(cat => (
            <motion.button key={cat} type="button" onClick={() => setCategory(cat)}
              className="px-3 py-1 font-sans text-[9px]"
              style={{
                color:        category === cat ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.3)',
                borderBottom: category === cat ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
              }}
              whileHover={{ color: 'rgba(255,255,255,0.6)' }}>
              {cat}
            </motion.button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <motion.span className="size-1.5 rounded-full" style={{ background: '#22c55e', display: 'inline-block' }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}/>
              <span className="font-mono text-[7.5px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                {filtered.length} streams · {fmt(totalViewers)} watching
              </span>
            </div>
            <motion.button type="button" onClick={() => setGoLiveOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[8px] font-semibold tracking-wider"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
              whileHover={{ background: 'rgba(239,68,68,0.24)' }}
              whileTap={{ scale: 0.97 }}>
              <span className="size-1.5 rounded-full animate-pulse" style={{ background: '#f87171' }}/>
              GO LIVE
            </motion.button>
          </div>
        </div>

        {/* Hero + Chat side by side */}
        <div className="flex" style={{ height: 360 }}>
          {filtered.length > 0
            ? <Hero stream={filtered.includes(featured) ? featured : filtered[0]}/>
            : (
              <div className="flex-1 flex items-center justify-center"
                style={{ background: '#0a0a0a' }}>
                <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  No streams in this category
                </span>
              </div>
            )
          }
          {/* Chat */}
          <div className="shrink-0" style={{ width: 256 }}>
            <ChatPanel stream={filtered.includes(featured) ? featured : (filtered[0] ?? STREAMS[0])}/>
          </div>
        </div>

        {/* Thumbnail strip */}
        <Strip streams={filtered.length > 0 ? filtered : STREAMS}
          activeId={featured.id} onSelect={handleSelect}/>

        {/* Stream sections */}
        {byViewers.length > 0 && (
          <Section title="Most viewers" streams={byViewers} onSelect={handleSelect}/>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}/>

        {byTrending.length > 0 && (
          <Section title="Trending now" streams={byTrending} onSelect={handleSelect}/>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}/>

        {/* Upcoming */}
        <Upcoming/>

        <div style={{ height: 40 }}/>
      </motion.div>
    </>
  )
}
