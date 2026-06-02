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



// ── Mock data pools ───────────────────────────────────────────────
const ARTWORKS: { name: string; img: string }[] = [
  { name: 'Nocturne at the Bridge',   img: '/images/artworks/art1.jpg' },
  { name: 'Shattered Embrace',        img: '/images/artworks/art2.jpg' },
  { name: 'Bloom & Blade',            img: '/images/artworks/art3.jpg' },
  { name: 'Self-Portrait with Death', img: '/images/artworks/art4.jpg' },
  { name: 'The Last March',           img: '/images/artworks/art5.jpg' },
  { name: 'Golden Ratio',             img: '/images/artworks/art1.jpg' },
  { name: 'Vermillion Dusk',          img: '/images/artworks/art2.jpg' },
  { name: 'The Quiet Storm',          img: '/images/artworks/art3.jpg' },
  { name: 'Ode to Entropy',           img: '/images/artworks/art4.jpg' },
  { name: 'Meridian Blue',            img: '/images/artworks/art5.jpg' },
]
const WALLETS = [
  '0x3F…9aB1', '0xA8…4Ec2', '0x7F…3A2b', '0xD1…77fF',
  '0x5C…0031', '0xBE…A944', '0x92…C3d8', '0x1A…5512', '0x6E…8bC0',
]
const AMOUNTS = [
  '1.0 TOKEN', '2.5 TOKENS', '5.0 TOKENS', '0.5 TOKEN',
  '10 TOKENS', '3.3 TOKENS', '7.0 TOKENS', '1.8 TOKENS', '4.2 TOKENS',
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function generateTrade(timeLabel = 'Just now') {
  const art = randomFrom(ARTWORKS)
  return {
    id:      `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type:    (Math.random() > 0.42 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
    wallet:  randomFrom(WALLETS),
    artwork: art.name,
    img:     art.img,
    amount:  randomFrom(AMOUNTS),
    time:    timeLabel,
  }
}
type Trade = ReturnType<typeof generateTrade>
const MAX_TRADES = 6
const ROW_H      = 76   // px per row — used for fixed container height

// ── TradeRow ───────────────────────────────────────────────────────
function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
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
            {trade.type}
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
          style={{ opacity: trade.time === 'Just now' ? 1 : 0.5 }}>
          {trade.time}
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
  const sectionRef = useRef<HTMLElement>(null)
  const feedRef    = useRef<HTMLDivElement>(null)

  // ── Client-only state ─────────────────────────────────────────
  const [mounted,    setMounted]    = useState(false)
  const [trades,     setTrades]     = useState<Trade[]>([])
  const [newId,      setNewId]      = useState<string | null>(null)
  const [totalToday, setTotalToday] = useState(0)
  const [volume,     setVolume]     = useState('0.00')

  useEffect(() => {
    setTotalToday(Math.floor(Math.random() * 200) + 340)
    setVolume((Math.random() * 2 + 1.2).toFixed(2))
    setTrades(Array.from({ length: MAX_TRADES }, (_, i) =>
      generateTrade(i === 0 ? 'Just now' : `${i * 4}s ago`)
    ))
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

  useEffect(() => {
    if (!mounted) return
    const age = setInterval(() => {
      if (!visibleRef.current) return
      setTrades(prev => prev.map((t, i) => ({
        ...t, time: i === 0 ? 'Just now' : `${(i + 1) * 4}s ago`,
      })))
    }, 4000)
    return () => clearInterval(age)
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        if (visibleRef.current) {
          const t = generateTrade()
          setNewId(t.id)
          setTrades(prev => [t, ...prev].slice(0, MAX_TRADES))
        }
        schedule()
      }, 3000 + Math.random() * 2000)
    }
    schedule()
    return () => clearTimeout(timer)
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
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#7A7570]">Live Network</p>
            </div>

            <h2 className="font-light text-[#1A1A1A] leading-[1.1] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.4rem, 4.5vw, 4rem)' }}>
              The Curve<br />
              <em className="not-italic text-[#C9A96E]">in Motion.</em>
            </h2>

            <p className="text-[0.9rem] leading-relaxed text-[#7A7570] max-w-[320px] mb-10">
              Every transaction shifts the curve. Watch collectors shape the price of art in real time.
            </p>

            <div className="flex gap-8 pt-8 border-t border-[#E4DDD3]">
              <div>
                <p className="text-[2rem] font-light text-[#1A1A1A] leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  suppressHydrationWarning>
                  {mounted ? totalToday : '—'}
                </p>
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#7A7570] mt-1">Trades Today</p>
              </div>
              <div className="w-px bg-[#E4DDD3]" />
              <div>
                <p className="text-[2rem] font-light text-[#1A1A1A] leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  suppressHydrationWarning>
                  {mounted ? volume : '—'}
                  {mounted && <span className="text-[#C9A96E] text-sm ml-1">ETH</span>}
                </p>
                <p className="text-[9px] tracking-[0.25em] uppercase text-[#7A7570] mt-1">24h Volume</p>
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
