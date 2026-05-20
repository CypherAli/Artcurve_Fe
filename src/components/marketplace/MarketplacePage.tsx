'use client'

// ─────────────────────────────────────────────────────────────────
//  MarketplacePage.tsx  —  Full marketplace browsing experience
//
//  Design: neo-luxury (cream #FDFBF7, charcoal #1A1A1A, gold #C9A96E)
//  Animations: cinematic GSAP — power3.out / expo.out, no bounce
//  dApp: 4-state transaction machine (idle→pending→confirming→done)
//
//  Layout:
//    • Stats bar (total volume, listings, artists)
//    • Search + Filter bar (phase tabs + sort)
//    • Responsive artwork grid (1→2→3→4 cols)
//    • Each card: image, phase badge, sparkline, price, collect button
//    • BuyModal: full transaction flow with wagmi patterns
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { gsap, ScrollTrigger }                               from '@/lib/gsap'

// ── Types ──────────────────────────────────────────────────────────

type Phase = 'Accumulation' | 'FOMO' | 'Migration'
type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'change' | 'volume'
type TxState = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

interface Artwork {
  id: number
  title: string
  artist: string
  artistAddr: string
  price: string        // ETH string
  priceUsd: string
  change: string
  volume: string       // 24h volume ETH
  phase: Phase
  phaseColor: string
  supply: number       // tokens sold
  maxSupply: number
  edition: string
  sparkline: number[]
  image: string
  createdAt: number    // unix ms
}

// ── Mock artwork catalogue (12 works across 3 phases) ──────────────

const ARTWORKS: Artwork[] = [
  {
    id: 1, title: 'Nocturne at the Bridge', artist: 'Elena Vasquez',
    artistAddr: '0x4f2…a91', price: '0.0234', priceUsd: '82.19',
    change: '+18.4%', volume: '1.42', phase: 'FOMO', phaseColor: '#C9A96E',
    supply: 62, maxSupply: 100, edition: 'Open Edition',
    sparkline: [4, 5.2, 6.8, 6.1, 5.4, 7.0, 9.5, 14.2, 19.8, 23.4],
    image: '/images/artworks/art1.jpg', createdAt: Date.now() - 3_600_000,
  },
  {
    id: 2, title: 'Shattered Embrace', artist: 'Marcus Chen',
    artistAddr: '0x8d3…f44', price: '0.0089', priceUsd: '31.27',
    change: '+7.2%', volume: '0.38', phase: 'Accumulation', phaseColor: '#4ade80',
    supply: 28, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [5, 4.8, 5.3, 5.1, 5.6, 5.4, 6.2, 7.1, 7.8, 8.9],
    image: '/images/artworks/art2.jpg', createdAt: Date.now() - 7_200_000,
  },
  {
    id: 3, title: 'Bloom & Blade', artist: 'Aiko Tanaka',
    artistAddr: '0x1a9…c33', price: '0.0412', priceUsd: '144.81',
    change: '+29.3%', volume: '2.87', phase: 'FOMO', phaseColor: '#C9A96E',
    supply: 71, maxSupply: 100, edition: 'Open Edition',
    sparkline: [3, 7.5, 14.0, 9.2, 6.8, 10.5, 16.0, 12.4, 28.0, 41.2],
    image: '/images/artworks/art3.jpg', createdAt: Date.now() - 10_800_000,
  },
  {
    id: 4, title: 'Self-Portrait with Death', artist: 'Arnold Böcklin',
    artistAddr: '0x7e1…b22', price: '0.1820', priceUsd: '639.74',
    change: '+44.1%', volume: '8.62', phase: 'Migration', phaseColor: '#f87171',
    supply: 94, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [2, 2.3, 2.8, 3.5, 5.0, 9.0, 22.0, 58.0, 120.0, 182.0],
    image: '/images/artworks/art4.jpg', createdAt: Date.now() - 86_400_000,
  },
  {
    id: 5, title: 'The Last March', artist: 'Yui Nakamura',
    artistAddr: '0x2b5…d81', price: '0.0551', priceUsd: '193.65',
    change: '+33.7%', volume: '3.21', phase: 'FOMO', phaseColor: '#C9A96E',
    supply: 78, maxSupply: 100, edition: 'Open Edition',
    sparkline: [8, 6.0, 4.2, 5.8, 8.5, 6.5, 9.0, 14.5, 22.0, 55.1],
    image: '/images/artworks/art5.jpg', createdAt: Date.now() - 14_400_000,
  },
  {
    id: 6, title: 'Ghost of the Meridian', artist: 'Ivan Sorokin',
    artistAddr: '0x9c4…e17', price: '0.0061', priceUsd: '21.44',
    change: '+3.1%', volume: '0.14', phase: 'Accumulation', phaseColor: '#4ade80',
    supply: 12, maxSupply: 100, edition: 'Open Edition',
    sparkline: [4, 4.2, 3.9, 4.5, 4.3, 5.1, 5.4, 5.8, 5.9, 6.1],
    image: '/images/artworks/art1.jpg', createdAt: Date.now() - 1_800_000,
  },
  {
    id: 7, title: 'Pale Architecture', artist: 'Soo-Ah Lim',
    artistAddr: '0x3f7…a04', price: '0.2340', priceUsd: '822.54',
    change: '+51.8%', volume: '12.40', phase: 'Migration', phaseColor: '#f87171',
    supply: 97, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [1, 1.5, 2.2, 4.0, 8.5, 18.0, 42.0, 88.0, 164.0, 234.0],
    image: '/images/artworks/art2.jpg', createdAt: Date.now() - 172_800_000,
  },
  {
    id: 8, title: 'Veiled Geometry', artist: 'Mei Zhou',
    artistAddr: '0x6a8…f93', price: '0.0078', priceUsd: '27.42',
    change: '+5.6%', volume: '0.22', phase: 'Accumulation', phaseColor: '#4ade80',
    supply: 19, maxSupply: 100, edition: 'Open Edition',
    sparkline: [5, 5.3, 5.1, 5.8, 6.0, 6.4, 6.9, 7.1, 7.5, 7.8],
    image: '/images/artworks/art3.jpg', createdAt: Date.now() - 5_400_000,
  },
  {
    id: 9, title: 'Ember Requiem', artist: 'Lucas Ferreira',
    artistAddr: '0x5e2…c60', price: '0.0318', priceUsd: '111.77',
    change: '+22.0%', volume: '1.94', phase: 'FOMO', phaseColor: '#C9A96E',
    supply: 55, maxSupply: 100, edition: 'Open Edition',
    sparkline: [6, 7, 8.5, 8, 9.2, 11.5, 16.2, 21.0, 28.4, 31.8],
    image: '/images/artworks/art4.jpg', createdAt: Date.now() - 21_600_000,
  },
  {
    id: 10, title: 'The Brass Oracle', artist: 'Nadia Osei',
    artistAddr: '0xb3d…7f2', price: '0.1450', priceUsd: '509.67',
    change: '+39.4%', volume: '6.18', phase: 'Migration', phaseColor: '#f87171',
    supply: 91, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [3, 3.8, 5.0, 8.0, 15.0, 32.0, 68.0, 110.0, 138.0, 145.0],
    image: '/images/artworks/art5.jpg', createdAt: Date.now() - 259_200_000,
  },
  {
    id: 11, title: 'Drift of Centuries', artist: 'Amir Khalil',
    artistAddr: '0xd91…3b5', price: '0.0042', priceUsd: '14.76',
    change: '+1.8%', volume: '0.07', phase: 'Accumulation', phaseColor: '#4ade80',
    supply: 6, maxSupply: 100, edition: 'Open Edition',
    sparkline: [4, 3.8, 4.1, 4.3, 4.0, 4.4, 4.2, 4.5, 4.3, 4.2],
    image: '/images/artworks/art1.jpg', createdAt: Date.now() - 900_000,
  },
  {
    id: 12, title: 'Cathedral of Ash', artist: 'Elena Vasquez',
    artistAddr: '0x4f2…a91', price: '0.0677', priceUsd: '237.96',
    change: '+28.1%', volume: '4.03', phase: 'FOMO', phaseColor: '#C9A96E',
    supply: 66, maxSupply: 100, edition: 'Open Edition',
    sparkline: [5, 6.2, 7.8, 9.5, 8.1, 11.0, 15.5, 20.3, 29.0, 67.7],
    image: '/images/artworks/art3.jpg', createdAt: Date.now() - 43_200_000,
  },
]

// ── Global stats ───────────────────────────────────────────────────
const STATS = [
  { label: 'Total Volume', value: '4,218 ETH',   sub: '+12.4% this week' },
  { label: 'Artworks',     value: '2,847',        sub: '483 active listings' },
  { label: 'Artists',      value: '319',          sub: '42 new this month' },
  { label: 'Floor Price',  value: '0.0042 ETH',  sub: 'Accumulation phase' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',     label: 'Newest' },
  { key: 'price_asc',  label: 'Price: Low → High' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'change',     label: 'Top Gainers' },
  { key: 'volume',     label: 'Most Traded' },
]

const PHASES: { key: Phase | 'All'; label: string; color: string }[] = [
  { key: 'All',          label: 'All Works',    color: '#C9A96E' },
  { key: 'Accumulation', label: 'Accumulation', color: '#4ade80' },
  { key: 'FOMO',         label: 'FOMO',         color: '#C9A96E' },
  { key: 'Migration',    label: 'Migration',    color: '#f87171' },
]

// ── Sparkline ──────────────────────────────────────────────────────
function buildPath(data: number[], w: number, h: number, pad: number) {
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const d     = `M${pts.join(' L')}`
  const areaD = `${d} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`
  return { d, areaD }
}

function Sparkline({ data, color, id }: { data: number[]; color: string; id: number }) {
  const w = 96, h = 36, pad = 2
  const { d, areaD } = buildPath(data, w, h, pad)
  const gid = `sp-${id}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <path d={d}     fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Phase pill ─────────────────────────────────────────────────────
function PhasePill({ phase, color }: { phase: string; color: string }) {
  return (
    <div
      className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5
                 text-[9px] tracking-[0.25em] uppercase font-medium text-white"
      style={{ background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.14)' }}
    >
      <span className="shrink-0 size-[5px] rounded-full" style={{ background: color }} />
      {phase}
    </div>
  )
}

// ── Buy Modal — 4-state dApp transaction machine ───────────────────
function BuyModal({ art, onClose }: { art: Artwork; onClose: () => void }) {
  const [txState, setTxState] = useState<TxState>('idle')
  const [qty,     setQty]     = useState(1)
  const overlayRef            = useRef<HTMLDivElement>(null)
  const panelRef              = useRef<HTMLDivElement>(null)

  const total = (parseFloat(art.price) * qty).toFixed(4)
  const totalUsd = (parseFloat(art.priceUsd) * qty).toFixed(2)

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: 'power3.out' }
      )
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: 24, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.32, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  const handleClose = useCallback(() => {
    gsap.to([panelRef.current, overlayRef.current], {
      autoAlpha: 0, y: 12, duration: 0.2, ease: 'power3.in',
      onComplete: onClose,
    })
  }, [onClose])

  // Simulate dApp 4-state flow
  const handleCollect = useCallback(async () => {
    if (txState !== 'idle') return
    setTxState('pending')      // Waiting for wallet signature
    await new Promise(r => setTimeout(r, 1800))
    setTxState('confirming')   // TX broadcasted, waiting for block
    await new Promise(r => setTimeout(r, 2400))
    setTxState('success')      // Confirmed on-chain
  }, [txState])

  const supply_pct = Math.round((art.supply / art.maxSupply) * 100)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 sm:p-0"
      style={{ background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === overlayRef.current) handleClose() }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-[440px] rounded-2xl overflow-hidden"
        style={{
          background:   '#0E0E0E',
          border:       '1px solid rgba(201,169,110,0.18)',
          boxShadow:    '0 40px 100px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.03)',
          transformOrigin: 'center bottom',
        }}
      >
        {/* Gold accent top */}
        <div className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, #C9A96E, rgba(201,169,110,0.3) 60%, transparent)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#C9A96E] mb-1">
              Collect Artwork
            </p>
            <h3 className="text-[1.3rem] font-light text-white/90 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {art.title}
            </h3>
            <p className="text-[11px] text-white/35 mt-0.5">{art.artist}</p>
          </div>
          <button onClick={handleClose} aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center
                       text-white/30 hover:text-white/70 hover:bg-white/8
                       transition-all duration-150">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Supply progress */}
          <div>
            <div className="flex justify-between text-[10px] mb-2">
              <span className="tracking-[0.2em] uppercase text-white/30">Curve Progress</span>
              <span className="text-[#C9A96E] font-mono">{art.supply}/{art.maxSupply} sold</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${supply_pct}%`,
                  background: `linear-gradient(90deg, ${art.phaseColor}88, ${art.phaseColor})`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] mt-1 text-white/18 font-mono">
              <span>Accumulation</span>
              <span>FOMO</span>
              <span>Migration</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-[9px] tracking-[0.22em] uppercase text-white/28 mb-1">Current Price</p>
              <p className="text-[2rem] font-light text-white leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {art.price}
                <span className="text-[#C9A96E] text-sm ml-1.5">ETH</span>
              </p>
              <p className="text-[11px] text-white/28 mt-0.5 font-mono">${art.priceUsd}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-[0.22em] uppercase text-white/28 mb-1">24h Change</p>
              <p className="text-[1.2rem] font-light" style={{ color: art.phaseColor,
                fontFamily: "'Cormorant Garamond', serif" }}>
                {art.change}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-white/30 mb-3">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1 || txState !== 'idle'}
                className="w-9 h-9 rounded-full border border-white/12 text-white/50
                           hover:border-[#C9A96E]/50 hover:text-white/90
                           disabled:opacity-30 disabled:cursor-not-allowed
                           flex items-center justify-center transition-all duration-200">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="text-[1.5rem] font-light text-white w-8 text-center"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {qty}
              </span>
              <button
                onClick={() => setQty(q => Math.min(10, q + 1))}
                disabled={qty >= 10 || txState !== 'idle'}
                className="w-9 h-9 rounded-full border border-white/12 text-white/50
                           hover:border-[#C9A96E]/50 hover:text-white/90
                           disabled:opacity-30 disabled:cursor-not-allowed
                           flex items-center justify-center transition-all duration-200">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="ml-auto text-right">
                <p className="text-[10px] text-white/28 uppercase tracking-wider">Total</p>
                <p className="text-white font-mono text-sm">{total} ETH</p>
                <p className="text-white/28 font-mono text-[10px]">${totalUsd}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          {txState === 'idle' && (
            <button
              onClick={handleCollect}
              className="w-full h-12 text-[11px] tracking-[0.28em] uppercase
                         bg-[#C9A96E] text-[#1A1A1A] font-semibold
                         hover:bg-[#E8D5B0] active:scale-[0.99]
                         transition-all duration-200"
            >
              Collect {qty > 1 ? `${qty} Tokens` : 'Now'} — {total} ETH
            </button>
          )}

          {txState === 'pending' && (
            <div className="w-full h-12 border border-[#C9A96E]/30 flex items-center justify-center gap-3">
              <svg className="w-4 h-4 text-[#C9A96E] animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#C9A96E]/80">
                Confirm in Wallet
              </span>
            </div>
          )}

          {txState === 'confirming' && (
            <div className="w-full h-12 border border-[#C9A96E]/30 flex items-center justify-center gap-3">
              <svg className="w-4 h-4 text-[#C9A96E] animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#C9A96E]/80">
                On-chain Confirmation…
              </span>
            </div>
          )}

          {txState === 'success' && (
            <div className="space-y-3">
              <div className="w-full h-12 border border-emerald-500/30 bg-emerald-500/6
                             flex items-center justify-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[11px] tracking-[0.2em] uppercase text-emerald-400">
                  Collected Successfully
                </span>
              </div>
              <button onClick={handleClose}
                className="w-full h-9 text-[10px] tracking-[0.2em] uppercase
                           text-white/30 hover:text-white/60 transition-colors duration-200">
                Close
              </button>
            </div>
          )}

          {txState === 'error' && (
            <div className="space-y-3">
              <div className="w-full h-12 border border-red-500/30 bg-red-500/6
                             flex items-center justify-center gap-2.5">
                <span className="text-[11px] tracking-[0.2em] uppercase text-red-400">
                  Transaction Failed
                </span>
              </div>
              <button onClick={() => setTxState('idle')}
                className="w-full h-9 text-[10px] tracking-[0.2em] uppercase
                           text-white/30 hover:text-white/60 transition-colors duration-200">
                Try Again
              </button>
            </div>
          )}

          <p className="text-center text-[9px] text-white/18 mt-3 tracking-[0.12em] uppercase">
            Transaction on Base network · Gas estimated
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Artwork Card ───────────────────────────────────────────────────
function ArtCard({
  art,
  index,
  cardRef,
  onCollect,
}: {
  art: Artwork
  index: number
  cardRef: (el: HTMLDivElement | null) => void
  onCollect: (art: Artwork) => void
}) {
  const supply_pct = Math.round((art.supply / art.maxSupply) * 100)

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col bg-white border border-[#E4DDD3]
                 hover:border-[#C9A96E] transition-[border-color] duration-300
                 cursor-pointer overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.image}
          alt={art.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          draggable={false}
        />

        {/* Phase badge */}
        <PhasePill phase={art.phase} color={art.phaseColor} />

        {/* Edition badge */}
        <div
          className="absolute top-3 right-3 px-2 py-0.5
                     text-[8.5px] tracking-[0.2em] uppercase text-white/60"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {art.edition}
        </div>

        {/* Sparkline overlay */}
        <div
          className="absolute inset-x-0 bottom-0 px-1 pb-1
                     translate-y-1 opacity-0
                     group-hover:translate-y-0 group-hover:opacity-100
                     transition-all duration-400 ease-out pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          <Sparkline data={art.sparkline} color={art.phaseColor} id={art.id} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[9.5px] tracking-[0.22em] uppercase text-[#7A7570] mb-1">
          {art.artist}
        </p>
        <h3
          className="text-[1.05rem] font-light text-[#1A1A1A] leading-tight mb-2 flex-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {art.title}
        </h3>

        {/* Supply progress mini */}
        <div className="mb-3">
          <div className="h-px bg-[#E4DDD3] w-full rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${supply_pct}%`,
                background: `linear-gradient(90deg, ${art.phaseColor}60, ${art.phaseColor})`,
              }}
            />
          </div>
          <p className="text-[8.5px] text-[#7A7570] mt-1 font-mono">
            {art.supply}/{art.maxSupply} collected
          </p>
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8.5px] tracking-[0.2em] uppercase text-[#7A7570] mb-0.5">Price</p>
            <p
              className="text-[1.25rem] font-light text-[#1A1A1A] leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {art.price}
              <span className="text-[#C9A96E] text-xs ml-1">ETH</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8.5px] text-[#7A7570] mb-0.5 font-mono">24h</p>
            <p className="text-[11px] font-mono" style={{ color: art.phaseColor }}>
              {art.change}
            </p>
          </div>
        </div>

        {/* Collect button — reveals on hover */}
        <div className="mt-3 overflow-hidden" style={{ height: 0 }}
          ref={el => {
            if (!el) return
            const card = el.closest('.group') as HTMLElement
            if (!card) return
            card.addEventListener('mouseenter', () => {
              el.style.height = '36px'
            })
            card.addEventListener('mouseleave', () => {
              el.style.height = '0px'
            })
          }}
        >
          <button
            type="button"
            onClick={() => onCollect(art)}
            className="w-full h-9 text-[10px] tracking-[0.22em] uppercase
                       bg-[#1A1A1A] text-white
                       hover:bg-[#C9A96E] hover:text-[#1A1A1A]
                       transition-colors duration-250"
          >
            Collect
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────
export function MarketplacePage() {
  const [activePhase, setActivePhase] = useState<Phase | 'All'>('All')
  const [sortKey,     setSortKey]     = useState<SortKey>('newest')
  const [search,      setSearch]      = useState('')
  const [sortOpen,    setSortOpen]    = useState(false)
  const [buyArt,      setBuyArt]      = useState<Artwork | null>(null)

  // Refs for GSAP
  const heroRef    = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)
  const filterRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<(HTMLDivElement | null)[]>([])
  const sortRef    = useRef<HTMLDivElement>(null)

  // ── Filter + sort ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...ARTWORKS]

    if (activePhase !== 'All') {
      items = items.filter(a => a.phase === activePhase)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(a =>
        a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
      )
    }

    items.sort((a, b) => {
      if (sortKey === 'price_asc')  return parseFloat(a.price)  - parseFloat(b.price)
      if (sortKey === 'price_desc') return parseFloat(b.price)  - parseFloat(a.price)
      if (sortKey === 'change')     return parseFloat(b.change)  - parseFloat(a.change)
      if (sortKey === 'volume')     return parseFloat(b.volume)  - parseFloat(a.volume)
      return b.createdAt - a.createdAt // newest
    })

    return items
  }, [activePhase, sortKey, search])

  // Re-animate cards after filter change
  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean)
    if (!cards.length) return
    gsap.fromTo(cards,
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out', stagger: 0.04 }
    )
  }, [filtered])

  // ── Initial scroll animations ────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {

      // Hero eyebrow + heading
      const heroEls = heroRef.current?.querySelectorAll<HTMLElement>('[data-hero-el]')
      if (heroEls?.length) {
        gsap.fromTo(Array.from(heroEls),
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.1 }
        )
      }

      // Stats cards
      const statEls = statsRef.current?.querySelectorAll<HTMLElement>('[data-stat]')
      if (statEls?.length) {
        gsap.fromTo(Array.from(statEls),
          { y: 20, autoAlpha: 0 },
          {
            y: 0, autoAlpha: 1,
            duration: 0.55, ease: 'power3.out', stagger: 0.07,
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 88%',
              once: true,
              invalidateOnRefresh: true,
            }
          }
        )
      }

      // Filter bar
      gsap.fromTo(filterRef.current,
        { y: 12, autoAlpha: 0 },
        {
          y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out',
          scrollTrigger: { trigger: filterRef.current, start: 'top 90%', once: true },
        }
      )

      // Initial card entrance
      const cards = cardsRef.current.filter(Boolean)
      if (cards.length) {
        gsap.fromTo(cards,
          { y: 28, autoAlpha: 0 },
          {
            y: 0, autoAlpha: 1,
            duration: 0.55, ease: 'power3.out', stagger: 0.04,
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 88%',
              once: true,
              invalidateOnRefresh: true,
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  // Sort dropdown outside click
  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [sortOpen])

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey)!

  return (
    <div className="min-h-screen bg-[#FDFBF7]" style={{ paddingTop: 80 }}>

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div
        ref={heroRef}
        className="relative px-6 md:px-16 lg:px-24 pt-14 pb-10 overflow-hidden"
        style={{ borderBottom: '1px solid #E4DDD3' }}
      >
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,169,110,0.04) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(201,169,110,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <p
          data-hero-el
          className="text-[11px] tracking-[0.38em] uppercase text-[#C9A96E] mb-4"
          style={{ opacity: 0 }}
        >
          ArtCurve Marketplace
        </p>

        <h1
          data-hero-el
          className="font-light text-[#1A1A1A] mb-3 leading-none"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   'clamp(2.4rem, 5vw, 4.5rem)',
            opacity:    0,
          }}
        >
          Collect Art on the Curve
        </h1>

        <p
          data-hero-el
          className="text-[#7A7570] max-w-lg leading-relaxed"
          style={{ fontSize: '0.95rem', opacity: 0 }}
        >
          Every artwork is a bonding-curve token on Base. The earlier you collect,
          the lower the price — as demand grows, so does value.
        </p>

        {/* Decorative gold line */}
        <div
          data-hero-el
          className="mt-8 h-px bg-gradient-to-r from-[#C9A96E] via-[#E8D5B0] to-transparent max-w-xs"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      <div
        ref={statsRef}
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ borderBottom: '1px solid #E4DDD3' }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            data-stat
            className="px-6 md:px-10 py-6"
            style={{
              opacity:      0,
              borderRight:  i < STATS.length - 1 ? '1px solid #E4DDD3' : undefined,
              borderBottom: i < 2 ? '1px solid #E4DDD3' : undefined,
            }}
          >
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#7A7570] mb-1">
              {s.label}
            </p>
            <p
              className="text-[1.6rem] font-light text-[#1A1A1A] leading-none mb-0.5"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-[#C9A96E] font-mono">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div
        ref={filterRef}
        className="sticky z-30 px-6 md:px-16 lg:px-24 py-4
                   flex flex-col sm:flex-row sm:items-center gap-4
                   bg-[#FDFBF7]/95 backdrop-blur-sm"
        style={{
          top:          80,
          borderBottom: '1px solid #E4DDD3',
          opacity:      0,
        }}
      >
        {/* Phase tabs */}
        <div className="flex items-center gap-1 flex-1 flex-wrap">
          {PHASES.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePhase(p.key)}
              className={[
                'relative h-8 px-4 text-[10px] tracking-[0.18em] uppercase',
                'transition-all duration-200',
                activePhase === p.key
                  ? 'text-[#1A1A1A]'
                  : 'text-[#7A7570] hover:text-[#1A1A1A]',
              ].join(' ')}
            >
              {activePhase === p.key && (
                <span
                  className="absolute inset-0 border"
                  style={{ borderColor: p.color, background: `${p.color}0D` }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {p.key !== 'All' && (
                  <span className="size-[5px] rounded-full" style={{ background: p.color }} />
                )}
                {p.label}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A7570]"
            fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search works or artists…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-9 pr-4 w-56 text-[11px] text-[#1A1A1A] placeholder-[#7A7570]/60
                       border border-[#E4DDD3] focus:border-[#C9A96E]
                       bg-white outline-none transition-colors duration-200"
          />
        </div>

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-2 h-8 px-4 border border-[#E4DDD3]
                       text-[10px] tracking-[0.14em] uppercase text-[#7A7570]
                       hover:border-[#C9A96E] hover:text-[#1A1A1A]
                       transition-all duration-200 bg-white min-w-[156px]"
          >
            <span className="flex-1 text-left">{currentSort.label}</span>
            <svg viewBox="0 0 24 24" className={`w-3 h-3 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {sortOpen && (
            <div
              className="absolute right-0 top-[calc(100%+4px)] w-[186px] bg-white
                         border border-[#E4DDD3] shadow-xl z-50 overflow-hidden"
            >
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setSortKey(s.key); setSortOpen(false) }}
                  className={[
                    'w-full text-left px-4 py-2.5 text-[10.5px] tracking-[0.12em] uppercase',
                    'transition-colors duration-150',
                    s.key === sortKey
                      ? 'text-[#C9A96E] bg-[#C9A96E]/5'
                      : 'text-[#7A7570] hover:text-[#1A1A1A] hover:bg-[#F5F0E8]',
                  ].join(' ')}
                >
                  {s.label}
                  {s.key === sortKey && (
                    <svg viewBox="0 0 24 24" className="inline w-3 h-3 ml-2 -mt-0.5" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Artwork Grid ────────────────────────────────────────── */}
      <div className="px-6 md:px-16 lg:px-24 py-10">

        {/* Result count */}
        <p className="text-[10px] tracking-[0.22em] uppercase text-[#7A7570] mb-6">
          {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
          {activePhase !== 'All' ? ` · ${activePhase}` : ''}
          {search ? ` · "${search}"` : ''}
        </p>

        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#E4DDD3]"
              fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9" strokeLinecap="round"/>
            </svg>
            <p className="text-[#7A7570] text-sm">No artworks match your filter</p>
            <button
              type="button"
              onClick={() => { setActivePhase('All'); setSearch('') }}
              className="text-[10px] tracking-[0.2em] uppercase text-[#C9A96E]
                         border-b border-[#C9A96E]/40 pb-0.5 hover:border-[#C9A96E]
                         transition-colors duration-200"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid gap-5"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            }}
          >
            {filtered.map((art, i) => (
              <ArtCard
                key={art.id}
                art={art}
                index={i}
                cardRef={el => { cardsRef.current[i] = el }}
                onCollect={setBuyArt}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Load more (aesthetic placeholder) ───────────────────── */}
      {filtered.length > 0 && (
        <div className="flex justify-center pb-16">
          <button
            type="button"
            className="h-11 px-10 text-[10.5px] tracking-[0.28em] uppercase
                       border border-[#C9A96E]/40 text-[#C9A96E]
                       hover:border-[#C9A96E] hover:bg-[#C9A96E]/5
                       transition-all duration-300"
          >
            Load More
          </button>
        </div>
      )}

      {/* ── Buy Modal ───────────────────────────────────────────── */}
      {buyArt && <BuyModal art={buyArt} onClose={() => setBuyArt(null)} />}
    </div>
  )
}
