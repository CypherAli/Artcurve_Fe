'use client'

// ─────────────────────────────────────────────────────────────────
//  LiveActivitySection.tsx  —  Real-time Trade Feed
//
//  "Retreat into Line" animation:
//    • Gate line at top of feed = entrance / exit portal
//    • overflow: hidden clips trades retreating above the gate
//    • New trades: slide DOWN from gate (y: -40 → 0, spring)
//    • Old trades exit: retreat UP into gate (y: 0 → -40, easeOut)
//    • Page scroll: feed retreats into gate as section leaves viewport
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion }      from 'framer-motion'
import { gsap }                         from '@/lib/gsap'
import { tradeService }                 from '@/services/trade.service'
import type { RecentTrade }             from '@/types/api'
import { useLanguage }                  from '@/context/LanguageContext'

// Normalize RecentTrade → display format
function normalize(r: RecentTrade, idx: number) {
  const w = r.user.wallet_address
  return {
    id:      r.id,
    type:    (r.tx_type === 'BUY' || r.tx_type === 'MINT' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
    wallet:  `${w.slice(0, 4)}…${w.slice(-4)}`,
    artwork: r.artwork.title,
    img:     r.artwork.ipfs_metadata_uri
      ? `https://ipfs.io/ipfs/${r.artwork.ipfs_metadata_uri.replace('ipfs://', '')}`
      : `/images/artworks/art${(idx % 5) + 1}.jpg`,
    amount:  `${parseFloat(r.share_amount).toFixed(2)} ${r.artwork.ticker ?? 'TOKEN'}`,
    time:    idx === 0 ? 'Just now' : timeAgo(new Date(r.timestamp)),
  }
}
function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
type Trade = ReturnType<typeof normalize>
const MAX_TRADES = 6

const MOCK_TRADES: Trade[] = [
  { id: 'mt1', type: 'BUY',  wallet: '0xA1b2…9B0', artwork: 'Self-Portrait with Death', img: '/images/artworks/art4.jpg', amount: '1000 $SPDTH', time: 'Just now' },
  { id: 'mt2', type: 'BUY',  wallet: '0xC9d0…c7D8', artwork: 'Sakura Overload',          img: '/images/artworks/art2.jpg', amount: '2000 $SAKOL', time: '12s ago'  },
  { id: 'mt3', type: 'SELL', wallet: '0xD0e1…d8E9', artwork: 'Genesis Protocol #7',      img: '/images/artworks/art1.jpg', amount: '500 $GENP7',  time: '28s ago'  },
  { id: 'mt4', type: 'BUY',  wallet: '0xE1f2…e9F0', artwork: 'Neon Seoul 2077',          img: '/images/artworks/art3.jpg', amount: '1500 $NSL77', time: '45s ago'  },
  { id: 'mt5', type: 'BUY',  wallet: '0xF2a3…f0A1', artwork: 'The Last March',           img: '/images/artworks/art5.jpg', amount: '800 $TMRCH',  time: '1m ago'   },
  { id: 'mt6', type: 'SELL', wallet: '0xA1b2…9B0', artwork: 'Entropy Garden',            img: '/images/artworks/art1.jpg', amount: '300 $ENTGD',  time: '2m ago'   },
]
const ROW_H      = 76   // px per row — used for fixed container height

// ── TradeRow ───────────────────────────────────────────────────────
function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
  const { t } = useLanguage()
  const [ripple, setRipple] = useState(false)

  return (
    <motion.li
      layout
      // ── Entrance: materialises FROM the gate line ──────────────
      initial={isNew ? { opacity: 0, y: -40, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      // ── Exit: retreats BACK INTO the gate line ─────────────────
      exit={{
        opacity: 0,
        y: -40,
        scale: 0.9,
        transition: { duration: 0.5, ease: 'easeOut' },
      }}
      transition={isNew
        ? { type: 'spring', stiffness: 120, damping: 20 }
        : { type: 'spring', stiffness: 200, damping: 28 }
      }
      onAnimationComplete={() => { if (isNew) setRipple(true) }}
      whileHover={{ x: 8, backgroundColor: 'rgba(0,0,0,0.015)', transition: { duration: 0.2 } }}
      className="relative flex items-center gap-4 py-3.5 cursor-default overflow-hidden border-b border-[#E4DDD3]/60 last:border-b-0"
      role="listitem"
    >
      {/* Gold ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.13) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            initial={{ backgroundPosition: '-100% 0', opacity: 1 }}
            animate={{ backgroundPosition: '200% 0', opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setRipple(false)}
          />
        )}
      </AnimatePresence>

      {/* Artwork thumbnail */}
      <div className="shrink-0 size-10 overflow-hidden rounded-sm border border-[#E4DDD3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={trade.img} alt={trade.artwork}
          loading="lazy" decoding="async"
          className="w-full h-full object-cover" draggable={false} />
      </div>

      {/* Type icon */}
      <div
        className="shrink-0 flex items-center justify-center size-7 rounded-full"
        style={{
          background: trade.type === 'BUY' ? 'rgba(74,222,128,0.1)'  : 'rgba(248,113,113,0.1)',
          border: `1px solid ${trade.type === 'BUY' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
        }}
      >
        <span className="text-sm leading-none"
          style={{ color: trade.type === 'BUY' ? '#4ade80' : '#f87171' }}
          aria-label={trade.type}>
          {trade.type === 'BUY' ? '↗' : '↘'}
        </span>
      </div>

      {/* Trade details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium tracking-[0.06em] uppercase"
            style={{ color: trade.type === 'BUY' ? '#4ade80' : '#f87171' }}>
            {trade.type === 'BUY' ? t.common.buy : t.common.sell}
          </span>
          <span className="text-[11px] text-[#7A7570]">·</span>
          <span className="text-[0.85rem] text-[#1A1A1A] italic truncate"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {trade.artwork}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[11px] text-[#7A7570] tracking-tight">{trade.wallet}</span>
          <span className="text-[#E4DDD3]">·</span>
          <span className="text-[11px] text-[#7A7570]">{trade.amount}</span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-right">
        <span className="text-[10px] tracking-wide text-[#7A7570] tabular-nums"
          style={{ opacity: trade.time === 'Just now' ? 1 : 0.6 }}>
          {trade.time === 'Just now' ? t.home.liveJustNow : trade.time}
        </span>
        {trade.time === 'Just now' && (
          <div className="flex justify-end mt-1">
            <span className="inline-block size-1.5 rounded-full bg-[#4ade80] animate-pulse" />
          </div>
        )}
      </div>
    </motion.li>
  )
}

// ── Main Section ───────────────────────────────────────────────────
export function LiveActivitySection() {
  const { t } = useLanguage()
  const sectionRef = useRef<HTMLElement>(null)
  const feedRef    = useRef<HTMLDivElement>(null)

  // ── Client-only state ─────────────────────────────────────────
  const [mounted,    setMounted]    = useState(false)
  const [trades,     setTrades]     = useState<Trade[]>(MOCK_TRADES)
  const [newId,      setNewId]      = useState<string | null>(null)
  const [totalToday, setTotalToday] = useState(342)
  const [volume,     setVolume]     = useState('2.84')

  useEffect(() => {
    tradeService.recent(MAX_TRADES).then(data => {
      if (Array.isArray(data) && data.length) {
        const normalized = data.map(normalize)
        setTrades(normalized)
        const vol = data.reduce((s, t) => s + parseFloat(t.eth_amount), 0)
        setVolume(vol.toFixed(2))
        setTotalToday(data.length)
      }
      // else: keep MOCK_TRADES
    }).catch(() => { /* keep MOCK_TRADES */ })
    setMounted(true)
  }, [])

  // ── Section wipe: pin + clip-path scrub khi scroll qua ────────
  useEffect(() => {
    if (!mounted) return
    const el = sectionRef.current
    if (!el) return

    gsap.set(el, { clipPath: 'inset(0 0 0% 0)' })

    const HEADER_H = 80   // px — phải khớp với page.tsx

    const ctx = gsap.context(() => {
      gsap.to(el, {
        clipPath: 'inset(0 0 100% 0)',
        ease:     'none',
        scrollTrigger: {
          // Trigger trực tiếp trên el (section sticky).
          // Khi top của el chạm HEADER_H = element vừa dính sticky → bắt đầu wipe.
          trigger:             el,
          start:               `top ${HEADER_H}px`,
          end:                 '+=700',
          scrub:               true,
          invalidateOnRefresh: true,
          onLeaveBack: () => gsap.set(el, { clipPath: 'inset(0 0 0% 0)' }),
        },
      })
    }, el)

    return () => ctx.revert()
  }, [mounted])

  // ── Pause timers when section is off-screen ───────────────────
  const visibleRef = useRef(false)

  useEffect(() => {
    if (!mounted) return
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting },
      { threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mounted])

  // Refresh timestamps every 30s
  useEffect(() => {
    if (!mounted) return
    const age = setInterval(() => {
      setTrades(prev => prev.map((t, i) => ({ ...t, time: i === 0 ? 'Just now' : t.time })))
    }, 30000)
    return () => clearInterval(age)
  }, [mounted])

  // Poll for new trades every 15s
  useEffect(() => {
    if (!mounted) return
    const poll = setInterval(() => {
      if (!visibleRef.current) return
      tradeService.recent(MAX_TRADES).then(data => {
        if (!Array.isArray(data) || !data.length) return
        const normalized = data.map(normalize)
        const firstId = normalized[0]?.id
        setTrades(prev => {
          if (prev[0]?.id === firstId) return prev
          setNewId(firstId ?? null)
          return normalized
        })
      }).catch(() => {})
    }, 15000)
    return () => clearInterval(poll)
  }, [mounted])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#FDFBF7] py-20 overflow-hidden"
      style={{ minHeight: 'calc(100vh - 80px)' }}
      aria-label="Live Activity Feed"
    >
      <div className="grid-overlay" aria-hidden="true" />

      <div className="relative z-10 px-6 md:px-16 lg:px-24 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-24 items-start">

          {/* ── Left: Header (static — never moves) ───────────────── */}
          <div className="lg:sticky lg:top-32">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#4ade80]" />
              </span>
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#7A7570]">{t.home.liveLabel}</p>
            </div>

            <h2 className="font-light text-[#1A1A1A] leading-[1.1] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.4rem, 4.5vw, 4rem)' }}>
              {t.home.liveHeading1}<br />
              <em className="not-italic text-[#C9A96E]">{t.home.liveHeading2}</em>
            </h2>

            <p className="text-[0.9rem] leading-relaxed text-[#7A7570] max-w-[320px] mb-10">
              {t.home.liveDesc}
            </p>

            <div className="flex gap-8 pt-8 border-t border-[#E4DDD3]">
              <div>
                <p className="text-[2rem] font-light text-[#1A1A1A] leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  suppressHydrationWarning>
                  {mounted ? totalToday : '—'}
                </p>
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#7A7570] mt-1">{t.home.liveTrades}</p>
              </div>
              <div className="w-px bg-[#E4DDD3]" />
              <div>
                <p className="text-[2rem] font-light text-[#1A1A1A] leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  suppressHydrationWarning>
                  {mounted ? volume : '—'}
                  {mounted && <span className="text-[#C9A96E] text-sm ml-1">ETH</span>}
                </p>
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#7A7570] mt-1">{t.home.liveVolume}</p>
              </div>
            </div>
          </div>

          {/* ── Right: Trade Feed ──────────────────────────────────── */}
          {/*
            Layer stack:
              z-20  Gate line — acts as entrance/exit portal
              z-10  Feed list — clips at gate via overflow:hidden
          */}
          <div
            className="relative"
            style={{ height: `${MAX_TRADES * ROW_H}px` }}
          >
            {/* Gate line — the "portal" trades appear from / retreat into */}
            <div
              aria-hidden="true"
              className="absolute top-0 inset-x-0 z-20"
              style={{ height: '2px', background: 'rgba(26,26,26,0.55)' }}
            />

            {/* Feed container: overflow hidden clips anything above gate */}
            <motion.div
              ref={feedRef}
              layoutRoot
              className="absolute inset-0"
              style={{ overflow: 'hidden', paddingTop: '2px' }}
            >
              <ul className="flex flex-col" role="list">
                <AnimatePresence initial={false}>
                  {trades.map((trade) => (
                    <TradeRow
                      key={trade.id}
                      trade={trade}
                      isNew={trade.id === newId}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              {/* Bottom fade */}
              <div
                className="absolute bottom-0 inset-x-0 h-10 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to top, #FDFBF7, transparent)' }}
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
