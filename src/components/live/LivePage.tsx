'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { authStore } from '@/lib/auth-store'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://artcurve-be-production.up.railway.app/api/v1'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
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
  roomName?: string
}

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────
const ALL_ITEMS: Item[] = [
  {
    id:'s1', type:'live', artist:'Soo-ah Kim', handle:'soo_ah.eth', verified:true,
    title:'Pale Architecture — panel 3, oil on canvas · live from the studio',
    ticker:'$PALE', category:'Painting', viewers:3420, liveFor:'1h 23m', marketCap:'$84.2K',
    color:'#a78bfa', glow1:'rgba(139,92,246,0.38)', glow2:'rgba(91,33,182,0.20)',
    base:'linear-gradient(158deg,#09091e 0%,#0f0f2a 60%,#0a0a1c 100%)',
    roomName:'soo-ah-2024',
  },
  {
    id:'s2', type:'live', artist:'Marcus Adler', handle:'markus.eth', verified:true,
    title:'Threshold Fragment — oil painting, live session from Berlin',
    ticker:'$THRESH', category:'Painting', viewers:1890, liveFor:'42m', marketCap:'$31.5K',
    color:'#f87171', glow1:'rgba(239,68,68,0.32)', glow2:'rgba(185,28,28,0.16)',
    base:'linear-gradient(158deg,#1a0808 0%,#220d0d 60%,#160606 100%)',
    roomName:'marcus-2024',
  },
  {
    id:'s3', type:'live', artist:'Aiko Tanaka', handle:'aiko.base', verified:false,
    title:'Generative Bloom — live coding in p5.js, open canvas session',
    ticker:'$BLOOM', category:'Digital', viewers:970, liveFor:'18m', marketCap:'$4.1K',
    color:'#4ade80', glow1:'rgba(74,222,128,0.28)', glow2:'rgba(22,163,74,0.15)',
    base:'linear-gradient(158deg,#040f08 0%,#07180d 60%,#040d07 100%)',
    roomName:'aiko-2024',
  },
  {
    id:'s4', type:'live', artist:'Böcklin', handle:'böcklin.eth', verified:true,
    title:'Self-Portrait with Death — oil reinterpretation, live commentary',
    ticker:'$BÖCKLIN', category:'Drawing', viewers:2340, liveFor:'3h 1m', marketCap:'$18.2K',
    color:'#D4AF37', glow1:'rgba(212,175,55,0.30)', glow2:'rgba(161,120,24,0.15)',
    base:'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
    roomName:'bocklin-2024',
  },
  {
    id:'s5', type:'live', artist:'Lena Volkov', handle:'lena_v.base', verified:false,
    title:'Dissolution Study No.4 — charcoal & shadow, watching the process',
    ticker:'$DISS', category:'Drawing', viewers:560, liveFor:'31m', marketCap:'$3.9K',
    color:'#60a5fa', glow1:'rgba(96,165,250,0.25)', glow2:'rgba(37,99,235,0.12)',
    base:'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
    roomName:'lena-2024',
  },
  {
    id:'s6', type:'live', artist:'Ivan Sorokin', handle:'ivan_sorokin.eth', verified:true,
    title:'Nocturne at the Bridge — watercolor session, live from Warsaw',
    ticker:'$NOCTURNE', category:'Painting', viewers:1430, liveFor:'2h 7m', marketCap:'$2.4K',
    color:'#38bdf8', glow1:'rgba(56,189,248,0.28)', glow2:'rgba(14,116,144,0.14)',
    base:'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
    roomName:'ivan-2024',
  },
  {
    id:'s7', type:'live', artist:'Yui Nakamura', handle:'yui_n.base', verified:false,
    title:'Amber Protocol — abstract mixed media experiment',
    ticker:'$AMBER', category:'Mixed Media', viewers:780, liveFor:'55m', marketCap:'$3.2K',
    color:'#fb923c', glow1:'rgba(251,146,60,0.28)', glow2:'rgba(194,65,12,0.14)',
    base:'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
    roomName:'yui-2024',
  },
  {
    id:'s8', type:'live', artist:'Paulo Rodrigues', handle:'paulo_r.base', verified:false,
    title:'Convergence I — live sculpture, clay session vol.3',
    ticker:'$CONV1', category:'Sculpture', viewers:410, liveFor:'22m', marketCap:'$1.3K',
    color:'#94a3b8', glow1:'rgba(148,163,184,0.20)', glow2:'rgba(71,85,105,0.12)',
    base:'linear-gradient(158deg,#080a0e 0%,#0c0f14 60%,#080a0e 100%)',
    roomName:'paulo-2024',
  },
  {
    id:'v1', type:'video', artist:'Böcklin', handle:'böcklin.eth', verified:true,
    title:'Self-Portrait with Death — full 4-hour process timelapse',
    ticker:'$BÖCKLIN', category:'Painting',
    views:'12.4K', duration:'4:02:11', uploadedAt:'3 days ago', marketCap:'$18.2K',
    color:'#D4AF37', glow1:'rgba(212,175,55,0.30)', glow2:'rgba(161,120,24,0.15)',
    base:'linear-gradient(158deg,#0f0a03 0%,#180f05 60%,#0d0903 100%)',
  },
  {
    id:'v2', type:'video', artist:'Lena Volkov', handle:'lena_v.base', verified:false,
    title:'Dissolution Study No.1 — charcoal technique full walkthrough',
    ticker:'$DISS', category:'Drawing',
    views:'5.8K', duration:'38:22', uploadedAt:'1 week ago', marketCap:'$3.9K',
    color:'#60a5fa', glow1:'rgba(96,165,250,0.25)', glow2:'rgba(37,99,235,0.12)',
    base:'linear-gradient(158deg,#050810 0%,#080c18 60%,#050810 100%)',
  },
  {
    id:'v3', type:'video', artist:'Ivan Sorokin', handle:'ivan_sorokin.eth', verified:true,
    title:'Nocturne at the Bridge — full watercolor, sketch to finish',
    ticker:'$NOCTURNE', category:'Painting',
    views:'8.1K', duration:'1:14:39', uploadedAt:'2 days ago', marketCap:'$2.4K',
    color:'#38bdf8', glow1:'rgba(56,189,248,0.28)', glow2:'rgba(14,116,144,0.14)',
    base:'linear-gradient(158deg,#030c14 0%,#05121e 60%,#030c14 100%)',
  },
  {
    id:'v4', type:'video', artist:'Yui Nakamura', handle:'yui_n.base', verified:false,
    title:'Amber Protocol — full process recording, mixed media on digital canvas',
    ticker:'$AMBER', category:'Mixed Media',
    views:'3.2K', duration:'55:40', uploadedAt:'5 days ago', marketCap:'$3.2K',
    color:'#fb923c', glow1:'rgba(251,146,60,0.28)', glow2:'rgba(194,65,12,0.14)',
    base:'linear-gradient(158deg,#100804 0%,#180f05 60%,#100804 100%)',
  },
  {
    id:'v5', type:'video', artist:'Soo-ah Kim', handle:'soo_ah.eth', verified:true,
    title:'Pale Architecture — panels 1 & 2 completed, full session recording',
    ticker:'$PALE', category:'Painting',
    views:'9.7K', duration:'2:33:05', uploadedAt:'1 week ago', marketCap:'$84.2K',
    color:'#a78bfa', glow1:'rgba(139,92,246,0.38)', glow2:'rgba(91,33,182,0.20)',
    base:'linear-gradient(158deg,#09091e 0%,#0f0f2a 60%,#0a0a1c 100%)',
  },
  {
    id:'v6', type:'video', artist:'Aiko Tanaka', handle:'aiko.base', verified:false,
    title:'Generative Art Workshop — full 3-hour p5.js session recording',
    ticker:'$BLOOM', category:'Digital',
    views:'4.4K', duration:'3:01:18', uploadedAt:'3 days ago', marketCap:'$4.1K',
    color:'#4ade80', glow1:'rgba(74,222,128,0.28)', glow2:'rgba(22,163,74,0.15)',
    base:'linear-gradient(158deg,#040f08 0%,#07180d 60%,#040d07 100%)',
  },
]

const CHIPS = ['All', 'Live', 'Videos', 'Painting', 'Drawing', 'Digital', 'Sculpture', 'Mixed Media', 'Trending']

// ─────────────────────────────────────────────────────────────────
// Sidebar nav items  (YouTube mini-sidebar equivalents)
// ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ),
  },
  {
    label: 'Live',
    href: '/live',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/>
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 7.76a6 6 0 0 0 0 8.49"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
  {
    label: 'Artists',
    href: '/guild',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'You',
    href: '/wallet',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

// ─────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────
function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed z-20 flex flex-col items-center pt-2 pb-4"
      style={{
        top: 68,
        left: 0,
        width: 80,
        height: 'calc(100vh - 68px)',
        background: '#0f0f0f',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href || (item.href === '/live' && pathname.startsWith('/live'))
        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              className="flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              style={{
                width: 68,
                padding: '10px 6px',
                borderRadius: 12,
                color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.42)',
              }}
              whileHover={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.88)' }}
              whileTap={{ scale: 0.93 }}
              animate={{ background: active ? 'rgba(255,255,255,0.11)' : 'transparent' }}
              transition={{ duration: 0.13 }}>
              {item.icon}
              <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
                {item.label}
              </span>
            </motion.div>
          </Link>
        )
      })}
    </aside>
  )
}

function fmtViewers(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}K`
  if (n >= 1000)  return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ─────────────────────────────────────────────────────────────────
// Animation variants (cinematic timing from skill)
// ─────────────────────────────────────────────────────────────────
const EASE_OUT_CUBIC: [number, number, number, number] = [0.215, 0.61, 0.355, 1.0]

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT_CUBIC } },
}

// ─────────────────────────────────────────────────────────────────
// Thumbnail background
// ─────────────────────────────────────────────────────────────────
function ThumbBg({ item }: { item: Item }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: item.base }}/>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 65% 55% at 25% 30%, ${item.glow1} 0%, transparent 65%)` }}/>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 45% 40% at 75% 70%, ${item.glow2} 0%, transparent 60%)` }}/>
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
        <span className="font-mono font-black rotate-[-12deg] whitespace-nowrap"
          style={{ color: 'rgba(255,255,255,0.04)', fontSize: item.ticker.length > 7 ? 30 : 40 }}>
          {item.ticker}
        </span>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Verified checkmark
// ─────────────────────────────────────────────────────────────────
function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
      <path d="M8 12l3 3 5-5" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────
// Three-dot context menu
// ─────────────────────────────────────────────────────────────────
const MENU_ACTIONS = ['Save to playlist', 'Share', 'Report']

function ContextMenu({ visible, open, onToggle }: { visible: boolean; open: boolean; onToggle: () => void }) {
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <motion.button
        type="button"
        aria-label="More options"
        onClick={onToggle}
        className="size-8 flex items-center justify-center rounded-full"
        animate={{ opacity: visible || open ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.92 }}
        style={{ color: 'rgba(255,255,255,0.6)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-9 w-44 z-50 overflow-hidden rounded-lg py-1"
            style={{ background: '#282828', boxShadow: '0 4px 24px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}>
            {MENU_ACTIONS.map(action => (
              <button key={action} type="button"
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {action}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Video card
// ─────────────────────────────────────────────────────────────────
function VideoCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const [hovered,  setHovered]  = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.article
      variants={cardVariants}
      className="cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      onClick={onClick}>

      {/* Thumbnail */}
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '16/9', background: '#1a1a1a' }}>
        <ThumbBg item={item}/>

        {/* Hover veil */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.12 }}
          style={{ background: 'rgba(0,0,0,0.2)' }}/>

        {/* LIVE badge */}
        {item.type === 'live' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-sm"
            style={{ background: '#dc2626' }}>
            <motion.span
              className="size-[5px] rounded-full bg-white"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}/>
            <span className="text-[10px] font-bold text-white tracking-wide font-sans">LIVE</span>
          </div>
        )}

        {/* Viewer pill (live) */}
        {item.type === 'live' && item.viewers !== undefined && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-sm text-[10px] font-medium text-white font-sans"
            style={{ background: 'rgba(0,0,0,0.78)' }}>
            {fmtViewers(item.viewers)} watching
          </div>
        )}

        {/* Duration (VOD) */}
        {item.type === 'video' && item.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-sm text-[11px] font-semibold text-white font-sans"
            style={{ background: 'rgba(0,0,0,0.82)' }}>
            {item.duration}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex gap-3 mt-3">

        {/* Channel avatar */}
        <div className="size-9 rounded-full shrink-0 flex items-center justify-center font-sans text-sm font-bold"
          style={{ background: `${item.color}20`, border: `2px solid ${item.color}40`, color: item.color }}>
          {item.artist[0]}
        </div>

        {/* Info + menu */}
        <div className="flex-1 min-w-0 flex gap-1">

          {/* Text block */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-snug line-clamp-2"
              style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
              {item.title}
            </p>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {item.artist}
              </span>
              {item.verified && <CheckMark/>}
            </div>

            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
              {item.type === 'live'
                ? `${fmtViewers(item.viewers ?? 0)} viewers · ${item.ticker}`
                : `${item.views} views · ${item.uploadedAt}`
              }
            </p>
          </div>

          {/* 3-dot menu */}
          <div className="shrink-0">
            <ContextMenu
              visible={hovered}
              open={menuOpen}
              onToggle={() => setMenuOpen(v => !v)}/>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ─────────────────────────────────────────────────────────────────
// Go Live modal
// ─────────────────────────────────────────────────────────────────
const LIVE_CATEGORIES = ['Painting', 'Drawing', 'Digital', 'Sculpture', 'Mixed Media']

function GoLiveModal({ onClose }: { onClose: () => void }) {
  const router  = useRouter()
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body:    JSON.stringify({ title: title.trim(), category: cat }),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Failed to create stream')
      const data = await res.json()
      sessionStorage.setItem(`livekit_host_token_${data.roomName}`, data.token)
      router.push(`/studio/stream/${data.roomName}`)
    } catch (err: unknown) {
      setError((err as Error).message || 'Could not start stream. Try again.')
      setLoading(false)
    }
  }, [title, cat, loading, router])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <motion.div
        className="w-[460px] rounded-xl overflow-hidden"
        style={{ background: '#212121', border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full flex items-center justify-center bg-red-600">
              <motion.span className="size-2 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }}/>
            </div>
            <span className="font-sans font-semibold text-base" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Go Live
            </span>
          </div>
          <motion.button
            type="button" onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full text-base"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
            whileTap={{ scale: 0.92 }}>
            ✕
          </motion.button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Stream title */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.48)' }}>
              Stream Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="What are you creating today?"
              className="w-full bg-transparent text-sm px-3.5 py-2.5 rounded-md outline-hidden"
              style={{
                border: `1px solid rgba(255,255,255,${title ? '0.22' : '0.1'})`,
                color: 'rgba(255,255,255,0.88)',
                caretColor: '#dc2626',
                transition: 'border-color 0.15s',
              }}/>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.48)' }}>
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {LIVE_CATEGORIES.map(c => (
                <motion.button
                  key={c} type="button" onClick={() => setCat(c)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full"
                  animate={{
                    background: cat === c ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.06)',
                    borderColor: cat === c ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.1)',
                    color: cat === c ? '#f87171' : 'rgba(255,255,255,0.42)',
                  }}
                  style={{ border: '1px solid' }}
                  whileTap={{ scale: 0.95 }}>
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="px-3.5 py-2.5 text-xs rounded-md"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            type="button"
            onClick={handleStart}
            disabled={!title.trim() || loading}
            className="w-full py-3 text-sm font-semibold rounded-md mt-1"
            animate={{
              background: title.trim() ? '#dc2626' : 'rgba(255,255,255,0.07)',
              color: title.trim() ? '#ffffff' : 'rgba(255,255,255,0.22)',
            }}
            whileHover={title.trim() && !loading ? { background: '#b91c1c' } : {}}
            whileTap={title.trim() && !loading ? { scale: 0.98 } : {}}
            style={{ opacity: loading ? 0.65 : 1, cursor: title.trim() && !loading ? 'pointer' : 'default' }}>
            {loading ? 'Starting…' : '● Start Streaming'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Live Page
// ─────────────────────────────────────────────────────────────────
export function LivePage() {
  const router = useRouter()
  const [chip,       setChip]       = useState('All')
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const chipsRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    switch (chip) {
      case 'Live':     return ALL_ITEMS.filter(i => i.type === 'live')
      case 'Videos':   return ALL_ITEMS.filter(i => i.type === 'video')
      case 'Trending': return [...ALL_ITEMS].sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0))
      case 'All':      return ALL_ITEMS
      default:         return ALL_ITEMS.filter(i => i.category === chip)
    }
  }, [chip])

  const totalLive = ALL_ITEMS.filter(i => i.type === 'live').length

  return (
    <>
      <AnimatePresence>
        {goLiveOpen && <GoLiveModal key="golive" onClose={() => setGoLiveOpen(false)}/>}
      </AnimatePresence>

      {/* ── YouTube-style left sidebar ── */}
      <Sidebar/>

      <div className="min-h-dvh" style={{ marginTop: 68, marginLeft: 80, background: '#0f0f0f' }}>

        {/* ── Sticky chip bar ── */}
        <div className="sticky z-10"
          style={{ top: 68, background: 'rgba(13,13,13,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center px-6" style={{ height: 64 }}>

            {/* Chips */}
            <div ref={chipsRef}
              className="flex items-center gap-3 overflow-x-auto flex-1"
              style={{ scrollbarWidth: 'none' }}>
              {CHIPS.map(c => (
                <motion.button
                  key={c} type="button"
                  onClick={() => setChip(c)}
                  className="shrink-0 whitespace-nowrap font-medium"
                  style={{
                    fontSize: 14,
                    padding: '7px 16px',
                    borderRadius: 8,
                    border: chip === c ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}
                  animate={{
                    background: chip === c ? 'rgba(255,255,255,0.93)' : 'transparent',
                    color:      chip === c ? '#0d0d0d'                : 'rgba(255,255,255,0.72)',
                  }}
                  whileHover={{
                    background: chip === c ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.13 }}>
                  {c}
                  {c === 'Live' && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                      style={{ background: chip === c ? '#dc2626' : 'rgba(220,38,38,0.9)', color: 'white', verticalAlign: 'middle' }}>
                      {totalLive}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-6 shrink-0" style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }}/>

            {/* Go Live */}
            <motion.button
              type="button"
              onClick={() => setGoLiveOpen(true)}
              className="shrink-0 flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full"
              style={{ background: '#dc2626', color: 'white' }}
              whileHover={{ background: '#b91c1c' }}
              whileTap={{ scale: 0.96 }}>
              <motion.span
                className="size-2 rounded-full bg-white"
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.1, repeat: Infinity }}/>
              Go Live
            </motion.button>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={chip}
                className="grid grid-cols-4 gap-x-5 gap-y-9"
                variants={gridVariants}
                initial="hidden"
                animate="show">
                {filtered.map(item => (
                  <VideoCard
                    key={item.id}
                    item={item}
                    onClick={() => item.type === 'live' && item.roomName
                      ? router.push(`/live/${item.roomName}`)
                      : undefined
                    }/>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-40 gap-3">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.12 }}>
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                    stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.22)' }}>No content in this category</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </>
  )
}
