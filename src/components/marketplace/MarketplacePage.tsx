'use client'

// ─────────────────────────────────────────────────────────────────
//  MarketplacePage.tsx  —  Neo-Luxury Trading Floor
//
//  Layout (100% width, no sidebar):
//
//    ┌──────────────────── COMMAND CENTER ────────────────────────┐
//    │  LIVE MARKETPLACE          │  VOL │ LISTINGS │ 24H        │
//    └────────────────────────────────────────────────────────────┘
//    ┌──────────────────── FLOW NAVIGATOR ────────────────────────┐
//    │  [ALL] [ACCUMULATION] [FOMO] [MIGRATION]    [search] [▼]  │
//    └────────────────────────────────────────────────────────────┘
//    ┌──────────────────── TRADING GRID ──────────────────────────┐
//    │  ArtCard  ArtCard  ArtCard  ArtCard  ← Framer stagger      │
//    │  ArtCard  ArtCard  ArtCard  ArtCard                        │
//    └────────────────────────────────────────────────────────────┘
//
//  Core rules:
//    · ZERO sidebar  — every pixel goes to art + data
//    · Art zone = clean image only, no overlays
//    · Data zone = data terminal below the image
//    · Framer Motion staggerChildren re-fires on every filter change
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence }                            from 'framer-motion'
import { gsap }                                               from '@/lib/gsap'
import {
  ArtCard, ArtCardData, Phase, PHASE_COLOR, cardVariants,
} from './ArtCard'

// ── Mock Data (8 artworks with realistic bonding-curve metrics) ────

const ARTWORKS: ArtCardData[] = [
  {
    id: 1, title: 'Nocturne at the Bridge', ticker: '$NOCTURNE',
    artist: 'Elena Vasquez', phase: 'FOMO',
    marketCap: 2.45, marketCapLabel: '2.45 ETH',
    change24h: '+18.4%', changePositive: true, progress: 62,
    image: '/images/artworks/art1.jpg',
  },
  {
    id: 2, title: 'Shattered Embrace', ticker: '$SHATTER',
    artist: 'Marcus Chen', phase: 'Accumulation',
    marketCap: 0.89, marketCapLabel: '0.89 ETH',
    change24h: '+7.2%', changePositive: true, progress: 28,
    image: '/images/artworks/art2.jpg',
  },
  {
    id: 3, title: 'Bloom & Blade', ticker: '$BLOOM',
    artist: 'Aiko Tanaka', phase: 'FOMO',
    marketCap: 4.12, marketCapLabel: '4.12 ETH',
    change24h: '+29.3%', changePositive: true, progress: 71,
    image: '/images/artworks/art3.jpg',
  },
  {
    id: 4, title: 'Self-Portrait with Death', ticker: '$BÖCKLIN',
    artist: 'Arnold Böcklin', phase: 'Migration',
    marketCap: 18.20, marketCapLabel: '18.20 ETH',
    change24h: '+44.1%', changePositive: true, progress: 94,
    image: '/images/artworks/art4.jpg',
  },
  {
    id: 5, title: 'The Last March', ticker: '$MARCH',
    artist: 'Yui Nakamura', phase: 'FOMO',
    marketCap: 5.51, marketCapLabel: '5.51 ETH',
    change24h: '+33.7%', changePositive: true, progress: 78,
    image: '/images/artworks/art5.jpg',
  },
  {
    id: 6, title: 'Ghost of the Meridian', ticker: '$GHOST',
    artist: 'Ivan Sorokin', phase: 'Accumulation',
    marketCap: 0.61, marketCapLabel: '0.61 ETH',
    change24h: '+3.1%', changePositive: true, progress: 12,
    image: '/images/artworks/art1.jpg',
  },
  {
    id: 7, title: 'Pale Architecture', ticker: '$PALE',
    artist: 'Soo-Ah Lim', phase: 'Migration',
    marketCap: 23.40, marketCapLabel: '23.40 ETH',
    change24h: '+51.8%', changePositive: true, progress: 97,
    image: '/images/artworks/art2.jpg',
  },
  {
    id: 8, title: 'Cathedral of Ash', ticker: '$CATHEDRA',
    artist: 'Elena Vasquez', phase: 'FOMO',
    marketCap: 6.77, marketCapLabel: '6.77 ETH',
    change24h: '+28.1%', changePositive: true, progress: 66,
    image: '/images/artworks/art3.jpg',
  },
]

// ── Sort options ───────────────────────────────────────────────────
type SortKey = 'market_cap' | 'price_asc' | 'price_desc' | 'change' | 'newest'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'market_cap',  label: 'Market Cap' },
  { key: 'change',      label: 'Top Gainers' },
  { key: 'price_desc',  label: 'Price: High → Low' },
  { key: 'price_asc',   label: 'Price: Low → High' },
  { key: 'newest',      label: 'Recently Listed' },
]

// ── Phase tab meta ─────────────────────────────────────────────────
const PHASE_TABS: { key: Phase | 'All'; label: string }[] = [
  { key: 'All',          label: 'ALL' },
  { key: 'Accumulation', label: 'ACCUMULATION' },
  { key: 'FOMO',         label: 'FOMO' },
  { key: 'Migration',    label: 'MIGRATION' },
]

// ── Framer Motion: grid container stagger ─────────────────────────
const containerVariants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

// ── Types ──────────────────────────────────────────────────────────
type TxState = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

// ── Buy Modal ──────────────────────────────────────────────────────
function BuyModal({ art, onClose }: { art: ArtCardData; onClose: () => void }) {
  const [txState, setTxState] = useState<TxState>('idle')
  const [qty,     setQty]     = useState(1)
  const overlayRef            = useRef<HTMLDivElement>(null)
  const panelRef              = useRef<HTMLDivElement>(null)

  const phaseColor = PHASE_COLOR[art.phase]
  const total      = (art.marketCap * qty).toFixed(4)

  // Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22 })
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: 32, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.3, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  const close = useCallback(() => {
    gsap.to([panelRef.current, overlayRef.current], {
      autoAlpha: 0, duration: 0.18, ease: 'power3.in', onComplete: onClose,
    })
  }, [onClose])

  const collect = useCallback(async () => {
    if (txState !== 'idle') return
    setTxState('pending')
    await new Promise(r => setTimeout(r, 1800))
    setTxState('confirming')
    await new Promise(r => setTimeout(r, 2400))
    setTxState('success')
  }, [txState])

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === overlayRef.current) close() }}>

      <div ref={panelRef}
        className="relative w-full max-w-[420px] overflow-hidden"
        style={{
          background:  '#0D0D0D',
          border:      `1px solid ${phaseColor}28`,
          boxShadow:   `0 40px 80px rgba(0,0,0,0.85), 0 0 60px -20px ${phaseColor}18`,
        }}>

        {/* Phase stripe top */}
        <div className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${phaseColor}, ${phaseColor}40 60%, transparent)` }}/>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.image} alt={art.title} className="w-full h-full object-cover"/>
            <span className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ background: phaseColor }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] tracking-[0.24em] uppercase mb-0.5"
              style={{ color: 'rgba(255,255,255,0.32)' }}>{art.ticker}</p>
            <h3 className="font-light text-white/90 truncate"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem' }}>
              {art.title}
            </h3>
          </div>
          <button onClick={close} aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Price */}
          <div className="flex items-end justify-between pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-[8px] tracking-[0.24em] uppercase mb-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Market Cap</p>
              <p className="font-light text-white leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem' }}>
                {art.marketCapLabel}
              </p>
            </div>
            <p className="font-mono font-semibold" style={{ color: phaseColor }}>
              {art.change24h} <span className="text-[10px] opacity-60">24h</span>
            </p>
          </div>

          {/* Curve progress */}
          <div>
            <div className="flex justify-between text-[9px] font-mono mb-1.5">
              <span style={{ color: 'rgba(255,255,255,0.32)' }}>Bonding Curve</span>
              <span style={{ color: '#D4AF37' }}>{art.progress}% to Graduation</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full"
                style={{ width: `${art.progress}%`, background: 'linear-gradient(90deg, #D4AF37, #F3E5AB)' }}/>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center border"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1 || txState !== 'idle'}
                className="w-9 h-9 flex items-center justify-center transition-colors duration-150
                           disabled:opacity-30"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="w-9 text-center font-light text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(10, q + 1))}
                disabled={qty >= 10 || txState !== 'idle'}
                className="w-9 h-9 flex items-center justify-center transition-colors duration-150
                           disabled:opacity-30"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 text-right">
              <p className="text-[8px] uppercase tracking-widest mb-0.5"
                style={{ color: 'rgba(255,255,255,0.28)' }}>Total</p>
              <p className="font-mono text-white">{total} ETH</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          {txState === 'idle' && (
            <button onClick={collect}
              className="w-full h-11 text-[10.5px] tracking-[0.3em] uppercase font-semibold
                         transition-opacity duration-200 active:scale-[0.99]"
              style={{ background: phaseColor, color: '#0A0A0A' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Collect {qty > 1 ? `× ${qty}` : 'Now'} — {total} ETH
            </button>
          )}
          {(txState === 'pending' || txState === 'confirming') && (
            <div className="w-full h-11 flex items-center justify-center gap-3"
              style={{ border: `1px solid ${phaseColor}35` }}>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
                style={{ color: phaseColor }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[10px] tracking-[0.24em] uppercase" style={{ color: phaseColor }}>
                {txState === 'pending' ? 'Confirm in Wallet' : 'Confirming on Base…'}
              </span>
            </div>
          )}
          {txState === 'success' && (
            <>
              <div className="w-full h-11 flex items-center justify-center gap-2.5"
                style={{ border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.06)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-400">
                  Collected Successfully
                </span>
              </div>
              <button onClick={close}
                className="w-full h-8 text-[9px] tracking-widest uppercase transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.28)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}>
                Close
              </button>
            </>
          )}
          <p className="text-center text-[8px] tracking-[0.12em] uppercase"
            style={{ color: 'rgba(255,255,255,0.16)' }}>
            Base Network · Bonding Curve Contract
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page Component ────────────────────────────────────────────
export function MarketplacePage() {
  const [activePhase, setActivePhase] = useState<Phase | 'All'>('All')
  const [sortKey,     setSortKey]     = useState<SortKey>('market_cap')
  const [search,      setSearch]      = useState('')
  const [sortOpen,    setSortOpen]    = useState(false)
  const [buyArt,      setBuyArt]      = useState<ArtCardData | null>(null)

  const sortRef    = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)

  // ── Filter + sort ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...ARTWORKS]
    if (activePhase !== 'All') items = items.filter(a => a.phase === activePhase)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q)
      )
    }
    items.sort((a, b) => {
      if (sortKey === 'market_cap')  return b.marketCap - a.marketCap
      if (sortKey === 'price_asc')   return a.marketCap - b.marketCap
      if (sortKey === 'price_desc')  return b.marketCap - a.marketCap
      if (sortKey === 'change')      return parseFloat(b.change24h) - parseFloat(a.change24h)
      return b.id - a.id // newest
    })
    return items
  }, [activePhase, sortKey, search])

  // Phase counts
  const counts = useMemo(() => ({
    All:          ARTWORKS.length,
    Accumulation: ARTWORKS.filter(a => a.phase === 'Accumulation').length,
    FOMO:         ARTWORKS.filter(a => a.phase === 'FOMO').length,
    Migration:    ARTWORKS.filter(a => a.phase === 'Migration').length,
  }), [])

  // Header entrance (GSAP)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = headerRef.current?.querySelectorAll<HTMLElement>('[data-fade]')
      if (els?.length) {
        gsap.fromTo(Array.from(els),
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.1 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  // Sort outside-click
  useEffect(() => {
    if (!sortOpen) return
    const h = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [sortOpen])

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey)!

  // Unique grid key — forces Framer to re-mount + re-stagger on filter change
  const gridKey = `${activePhase}|${sortKey}|${search}`

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', paddingTop: 80 }}>

      {/* ══════════════════════════════════════════════════════
          1. COMMAND CENTER
          Full-width header: title/subtitle left, 3 stat boxes right
      ══════════════════════════════════════════════════════ */}
      <div
        ref={headerRef}
        className="px-8 py-7"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          {/* Left: identity */}
          <div>
            <h1
              data-fade
              className="font-light tracking-[0.06em] leading-none mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize:   'clamp(1.9rem, 3.8vw, 3.2rem)',
                color:      '#FDFBF7',
                opacity:    0,
              }}
            >
              LIVE MARKETPLACE
            </h1>
            <p
              data-fade
              className="text-[12px] tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.38)', opacity: 0 }}
            >
              Trade unique artworks on the bonding curve.
            </p>
          </div>

          {/* Right: 3 market stat boxes */}
          <div data-fade className="flex gap-3 flex-wrap" style={{ opacity: 0 }}>
            {[
              { label: 'TOTAL VOLUME', value: '4,218 ETH', gold: true },
              { label: 'LIVE LISTINGS', value: '2,847', gold: false },
              { label: '24H TRADES', value: '+12.4%', green: true },
            ].map(s => (
              <div
                key={s.label}
                className="px-5 py-3 text-center"
                style={{
                  border:     '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)',
                  minWidth:   110,
                }}
              >
                <p className="font-mono text-[8px] tracking-[0.22em] uppercase mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {s.label}
                </p>
                <p
                  className="font-mono text-[1rem] leading-none"
                  style={{
                    color: s.gold ? '#D4AF37' : s.green ? '#4ade80' : 'rgba(255,255,255,0.85)',
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. FLOW NAVIGATOR
          Sticky bar: phase tabs left  |  search + sort right
      ══════════════════════════════════════════════════════ */}
      <div
        className="sticky z-30 flex items-center justify-between gap-4 px-8"
        style={{
          top:              80,
          borderBottom:     '1px solid rgba(255,255,255,0.08)',
          background:       'rgba(10,10,10,0.97)',
          backdropFilter:   'blur(14px)',
          height:           52,
        }}
      >
        {/* Phase tabs */}
        <nav className="flex items-center h-full overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {PHASE_TABS.map(tab => {
            const active = activePhase === tab.key
            const color  = tab.key === 'All'
              ? '#D4AF37'
              : PHASE_COLOR[tab.key as Phase]
            const count  = counts[tab.key as keyof typeof counts]

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivePhase(tab.key)}
                className="relative flex items-center gap-2 h-full px-4 shrink-0
                           text-[10px] tracking-[0.2em] uppercase
                           transition-colors duration-200"
                style={{ color: active ? color : 'rgba(255,255,255,0.35)' }}
              >
                {/* Active indicator dot (non-All tabs) */}
                {tab.key !== 'All' && active && (
                  <span className="size-[5px] rounded-full" style={{ background: color }}/>
                )}
                {tab.label}
                {/* Count badge */}
                <span
                  className="font-mono text-[8px] px-1.5 py-0.5"
                  style={{
                    background: active ? `${color}18` : 'rgba(255,255,255,0.06)',
                    color:      active ? color : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {count}
                </span>
                {/* Underline */}
                {active && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-px"
                    style={{ background: color }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right: search + sort */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Search — underline style */}
          <div className="relative">
            <svg
              viewBox="0 0 24 24" className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3"
              style={{ color: 'rgba(255,255,255,0.28)' }}
              fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              placeholder="Search works, artists, tickers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-5 pr-2 w-52 text-[11px] bg-transparent outline-none
                         placeholder:text-white/20"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.18)',
                color:        'rgba(255,255,255,0.75)',
              }}
              onFocus={e  => (e.currentTarget.style.borderBottomColor = 'rgba(212,175,55,0.7)')}
              onBlur={e   => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.18)')}
            />
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-2 h-8 px-3 text-[10px] tracking-[0.14em]
                         uppercase transition-colors duration-200"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color:  'rgba(255,255,255,0.5)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
              onMouseLeave={e => !sortOpen && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              <span>Sort: {currentSort.label}</span>
              <svg
                viewBox="0 0 24 24" className={`w-2.5 h-2.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[calc(100%+4px)] z-50 overflow-hidden"
                  style={{
                    background:  '#111',
                    border:      '1px solid rgba(255,255,255,0.1)',
                    minWidth:    180,
                    boxShadow:   '0 16px 40px rgba(0,0,0,0.6)',
                  }}
                >
                  {SORT_OPTIONS.map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => { setSortKey(s.key); setSortOpen(false) }}
                      className="w-full text-left px-4 py-2.5 text-[10.5px] tracking-wide
                                 transition-colors duration-100 flex items-center justify-between"
                      style={{
                        color:      s.key === sortKey ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                        background: s.key === sortKey ? 'rgba(212,175,55,0.08)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (s.key !== sortKey) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      }}
                      onMouseLeave={e => {
                        if (s.key !== sortKey) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {s.label}
                      {s.key === sortKey && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none"
                          stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. TRADING GRID
          100% width, responsive columns, Framer stagger.
          Key changes on every filter/sort → full re-stagger.
      ══════════════════════════════════════════════════════ */}
      <div className="px-8 py-8">

        {/* Result count */}
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase mb-6"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          {filtered.length === 0
            ? 'No results'
            : `${filtered.length} work${filtered.length === 1 ? '' : 's'}`
          }
          {activePhase !== 'All' ? ` · ${activePhase}` : ''}
          {search ? ` · "${search}"` : ''}
        </p>

        {filtered.length === 0 ? (

          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none"
              style={{ color: 'rgba(255,255,255,0.1)' }}>
              <rect x="6" y="6" width="36" height="36" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 18h36M18 42V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No artworks match your filters
            </p>
            <button
              type="button"
              onClick={() => { setActivePhase('All'); setSearch('') }}
              className="text-[10px] tracking-[0.22em] uppercase pb-0.5 transition-colors duration-200"
              style={{ color: '#D4AF37', borderBottom: '1px solid rgba(212,175,55,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.borderBottomColor = '#D4AF37')}
              onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'rgba(212,175,55,0.35)')}>
              Clear filters
            </button>
          </div>

        ) : (

          /* Stagger grid — key forces re-mount → re-stagger on filter change */
          <motion.div
            key={gridKey}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filtered.map(art => (
              <ArtCard
                key={art.id}
                data={art}
                onCollect={setBuyArt}
              />
            ))}
          </motion.div>

        )}

        {/* Load more */}
        {filtered.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              type="button"
              className="h-11 px-10 font-mono text-[10px] tracking-[0.3em] uppercase
                         transition-all duration-300"
              style={{
                border: '1px solid rgba(212,175,55,0.25)',
                color:  'rgba(212,175,55,0.6)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#D4AF37'
                e.currentTarget.style.color       = '#D4AF37'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'
                e.currentTarget.style.color       = 'rgba(212,175,55,0.6)'
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {buyArt && <BuyModal art={buyArt} onClose={() => setBuyArt(null)}/>}
    </div>
  )
}
