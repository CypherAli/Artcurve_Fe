'use client'

// ─────────────────────────────────────────────────────────────────
//  MarketplacePage.tsx  —  Web3 Art Trading Platform
//
//  This is NOT an e-commerce page. It is a financial trading
//  interface layered over a curated art gallery. Every design
//  decision should reflect that dual identity:
//    · Art-forward: full-bleed images, editorial typography
//    · Data-rich:   bonding curve phase, sparklines, volume,
//                   holders, 24h change — visible at a glance
//
//  Layout:
//    ┌─ Market Ticker (live-scrolling price tape) ───────────────┐
//    │  Phase Nav  │  Search + View Toggle                       │
//    ├─ Sidebar ───┼─ Main Grid / List ──────────────────────────┤
//    │  Filters    │  Featured Strip (hot movers)                │
//    │  Phase      │  Artwork cards — art-first, data overlay    │
//    │  Price      │                                             │
//    │  Sort       │                                             │
//    └─────────────┴─────────────────────────────────────────────┘
//
//  Cards:
//    • Full-bleed artwork image (no white box below)
//    • Phase-colored left border glow
//    • Glass overlay at bottom: artist / title / price / change
//    • Hover: full data panel slides up (volume, holders, curve)
//    • Collect button only appears on hover
//
//  BuyModal: 4-state dApp tx machine (idle→pending→confirming→done)
// ─────────────────────────────────────────────────────────────────

import {
  useEffect, useRef, useState,
  useCallback, useMemo,
} from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

// ── Types ──────────────────────────────────────────────────────────
type Phase    = 'Accumulation' | 'FOMO' | 'Migration'
type SortKey  = 'newest' | 'price_asc' | 'price_desc' | 'change' | 'volume'
type ViewMode = 'grid' | 'list'
type TxState  = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

interface Artwork {
  id:          number
  title:       string
  artist:      string
  artistAddr:  string
  price:       string   // ETH
  priceUsd:    string
  change:      string   // e.g. "+18.4%"
  change7d:    string
  volume24h:   string   // ETH
  holders:     number
  phase:       Phase
  phaseColor:  string
  phaseBg:     string   // subtle bg tint
  supply:      number
  maxSupply:   number
  edition:     string
  sparkline:   number[]
  image:       string
  createdAt:   number
}

// ── Phase meta ─────────────────────────────────────────────────────
const PHASE_META: Record<Phase, { color: string; bg: string; desc: string }> = {
  Accumulation: {
    color: '#4ade80',
    bg:    'rgba(74,222,128,0.08)',
    desc:  'Early adopters — lowest price, highest upside',
  },
  FOMO: {
    color: '#C9A96E',
    bg:    'rgba(201,169,110,0.08)',
    desc:  'Active demand — price rising with each trade',
  },
  Migration: {
    color: '#f87171',
    bg:    'rgba(248,113,113,0.08)',
    desc:  'Near liquidity migration — approaching max supply',
  },
}

// ── Artwork data ───────────────────────────────────────────────────
const ARTWORKS: Artwork[] = [
  {
    id: 1, title: 'Nocturne at the Bridge', artist: 'Elena Vasquez',
    artistAddr: '0x4f2…a91', price: '0.0234', priceUsd: '82.19',
    change: '+18.4%', change7d: '+31.2%', volume24h: '1.42', holders: 24,
    phase: 'FOMO', phaseColor: '#C9A96E', phaseBg: 'rgba(201,169,110,0.08)',
    supply: 62, maxSupply: 100, edition: 'Open Edition',
    sparkline: [4, 5.2, 6.8, 6.1, 5.4, 7.0, 9.5, 14.2, 19.8, 23.4],
    image: '/images/artworks/art1.jpg', createdAt: Date.now() - 3_600_000,
  },
  {
    id: 2, title: 'Shattered Embrace', artist: 'Marcus Chen',
    artistAddr: '0x8d3…f44', price: '0.0089', priceUsd: '31.27',
    change: '+7.2%', change7d: '+9.8%', volume24h: '0.38', holders: 8,
    phase: 'Accumulation', phaseColor: '#4ade80', phaseBg: 'rgba(74,222,128,0.08)',
    supply: 28, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [5, 4.8, 5.3, 5.1, 5.6, 5.4, 6.2, 7.1, 7.8, 8.9],
    image: '/images/artworks/art2.jpg', createdAt: Date.now() - 7_200_000,
  },
  {
    id: 3, title: 'Bloom & Blade', artist: 'Aiko Tanaka',
    artistAddr: '0x1a9…c33', price: '0.0412', priceUsd: '144.81',
    change: '+29.3%', change7d: '+58.4%', volume24h: '2.87', holders: 31,
    phase: 'FOMO', phaseColor: '#C9A96E', phaseBg: 'rgba(201,169,110,0.08)',
    supply: 71, maxSupply: 100, edition: 'Open Edition',
    sparkline: [3, 7.5, 14.0, 9.2, 6.8, 10.5, 16.0, 12.4, 28.0, 41.2],
    image: '/images/artworks/art3.jpg', createdAt: Date.now() - 10_800_000,
  },
  {
    id: 4, title: 'Self-Portrait with Death', artist: 'Arnold Böcklin',
    artistAddr: '0x7e1…b22', price: '0.1820', priceUsd: '639.74',
    change: '+44.1%', change7d: '+112.3%', volume24h: '8.62', holders: 47,
    phase: 'Migration', phaseColor: '#f87171', phaseBg: 'rgba(248,113,113,0.08)',
    supply: 94, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [2, 2.3, 2.8, 3.5, 5.0, 9.0, 22.0, 58.0, 120.0, 182.0],
    image: '/images/artworks/art4.jpg', createdAt: Date.now() - 86_400_000,
  },
  {
    id: 5, title: 'The Last March', artist: 'Yui Nakamura',
    artistAddr: '0x2b5…d81', price: '0.0551', priceUsd: '193.65',
    change: '+33.7%', change7d: '+71.0%', volume24h: '3.21', holders: 28,
    phase: 'FOMO', phaseColor: '#C9A96E', phaseBg: 'rgba(201,169,110,0.08)',
    supply: 78, maxSupply: 100, edition: 'Open Edition',
    sparkline: [8, 6.0, 4.2, 5.8, 8.5, 6.5, 9.0, 14.5, 22.0, 55.1],
    image: '/images/artworks/art5.jpg', createdAt: Date.now() - 14_400_000,
  },
  {
    id: 6, title: 'Ghost of the Meridian', artist: 'Ivan Sorokin',
    artistAddr: '0x9c4…e17', price: '0.0061', priceUsd: '21.44',
    change: '+3.1%', change7d: '+4.8%', volume24h: '0.14', holders: 5,
    phase: 'Accumulation', phaseColor: '#4ade80', phaseBg: 'rgba(74,222,128,0.08)',
    supply: 12, maxSupply: 100, edition: 'Open Edition',
    sparkline: [4, 4.2, 3.9, 4.5, 4.3, 5.1, 5.4, 5.8, 5.9, 6.1],
    image: '/images/artworks/art1.jpg', createdAt: Date.now() - 1_800_000,
  },
  {
    id: 7, title: 'Pale Architecture', artist: 'Soo-Ah Lim',
    artistAddr: '0x3f7…a04', price: '0.2340', priceUsd: '822.54',
    change: '+51.8%', change7d: '+138.0%', volume24h: '12.40', holders: 53,
    phase: 'Migration', phaseColor: '#f87171', phaseBg: 'rgba(248,113,113,0.08)',
    supply: 97, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [1, 1.5, 2.2, 4.0, 8.5, 18.0, 42.0, 88.0, 164.0, 234.0],
    image: '/images/artworks/art2.jpg', createdAt: Date.now() - 172_800_000,
  },
  {
    id: 8, title: 'Veiled Geometry', artist: 'Mei Zhou',
    artistAddr: '0x6a8…f93', price: '0.0078', priceUsd: '27.42',
    change: '+5.6%', change7d: '+7.3%', volume24h: '0.22', holders: 7,
    phase: 'Accumulation', phaseColor: '#4ade80', phaseBg: 'rgba(74,222,128,0.08)',
    supply: 19, maxSupply: 100, edition: 'Open Edition',
    sparkline: [5, 5.3, 5.1, 5.8, 6.0, 6.4, 6.9, 7.1, 7.5, 7.8],
    image: '/images/artworks/art3.jpg', createdAt: Date.now() - 5_400_000,
  },
  {
    id: 9, title: 'Ember Requiem', artist: 'Lucas Ferreira',
    artistAddr: '0x5e2…c60', price: '0.0318', priceUsd: '111.77',
    change: '+22.0%', change7d: '+45.1%', volume24h: '1.94', holders: 19,
    phase: 'FOMO', phaseColor: '#C9A96E', phaseBg: 'rgba(201,169,110,0.08)',
    supply: 55, maxSupply: 100, edition: 'Open Edition',
    sparkline: [6, 7, 8.5, 8, 9.2, 11.5, 16.2, 21.0, 28.4, 31.8],
    image: '/images/artworks/art4.jpg', createdAt: Date.now() - 21_600_000,
  },
  {
    id: 10, title: 'The Brass Oracle', artist: 'Nadia Osei',
    artistAddr: '0xb3d…7f2', price: '0.1450', priceUsd: '509.67',
    change: '+39.4%', change7d: '+94.2%', volume24h: '6.18', holders: 44,
    phase: 'Migration', phaseColor: '#f87171', phaseBg: 'rgba(248,113,113,0.08)',
    supply: 91, maxSupply: 100, edition: 'Limited 1/100',
    sparkline: [3, 3.8, 5.0, 8.0, 15.0, 32.0, 68.0, 110.0, 138.0, 145.0],
    image: '/images/artworks/art5.jpg', createdAt: Date.now() - 259_200_000,
  },
  {
    id: 11, title: 'Drift of Centuries', artist: 'Amir Khalil',
    artistAddr: '0xd91…3b5', price: '0.0042', priceUsd: '14.76',
    change: '+1.8%', change7d: '+2.4%', volume24h: '0.07', holders: 3,
    phase: 'Accumulation', phaseColor: '#4ade80', phaseBg: 'rgba(74,222,128,0.08)',
    supply: 6, maxSupply: 100, edition: 'Open Edition',
    sparkline: [4, 3.8, 4.1, 4.3, 4.0, 4.4, 4.2, 4.5, 4.3, 4.2],
    image: '/images/artworks/art1.jpg', createdAt: Date.now() - 900_000,
  },
  {
    id: 12, title: 'Cathedral of Ash', artist: 'Elena Vasquez',
    artistAddr: '0x4f2…a91', price: '0.0677', priceUsd: '237.96',
    change: '+28.1%', change7d: '+62.4%', volume24h: '4.03', holders: 33,
    phase: 'FOMO', phaseColor: '#C9A96E', phaseBg: 'rgba(201,169,110,0.08)',
    supply: 66, maxSupply: 100, edition: 'Open Edition',
    sparkline: [5, 6.2, 7.8, 9.5, 8.1, 11.0, 15.5, 20.3, 29.0, 67.7],
    image: '/images/artworks/art3.jpg', createdAt: Date.now() - 43_200_000,
  },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',     label: 'Recently Listed' },
  { key: 'price_asc',  label: 'Price: Low → High' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'change',     label: 'Top Gainers (24h)' },
  { key: 'volume',     label: 'Highest Volume' },
]

// ── Sparkline SVG ──────────────────────────────────────────────────
function Sparkline({
  data, color, id, w = 80, h = 28,
}: { data: number[]; color: string; id: number; w?: number; h?: number }) {
  const pad = 2
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const d     = `M${pts.join(' L')}`
  const areaD = `${d} L${(w - pad).toFixed(1)},${h - pad} L${pad},${h - pad} Z`
  const gid   = `sp${id}-${w}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ── Supply / curve bar ─────────────────────────────────────────────
function CurveBar({ art }: { art: Artwork }) {
  const pct = Math.round((art.supply / art.maxSupply) * 100)
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-1.5"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        <span>{art.supply}/{art.maxSupply} collected</span>
        <span style={{ color: art.phaseColor }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${art.phaseColor}55, ${art.phaseColor})`,
          }}/>
      </div>
      {/* 3-phase ticks */}
      <div className="flex justify-between text-[7.5px] uppercase tracking-wider mt-1"
        style={{ color: 'rgba(255,255,255,0.18)' }}>
        <span>Accum.</span><span>FOMO</span><span>Migration</span>
      </div>
    </div>
  )
}

// ── Phase badge ────────────────────────────────────────────────────
function PhaseBadge({ phase, color }: { phase: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-[3px]
                     text-[8.5px] tracking-[0.22em] uppercase font-medium"
      style={{
        color,
        background:  `${color}18`,
        border:      `1px solid ${color}38`,
        borderRadius: 2,
      }}>
      <span className="size-[5px] rounded-full" style={{ background: color }}/>
      {phase}
    </span>
  )
}

// ── Market Ticker ──────────────────────────────────────────────────
function MarketTicker() {
  const items = ARTWORKS.slice().sort((a, b) =>
    Math.abs(parseFloat(b.change)) - Math.abs(parseFloat(a.change))
  )
  // duplicate for seamless loop
  const all = [...items, ...items]
  return (
    <div className="relative overflow-hidden border-b"
      style={{
        background:   '#0A0A0A',
        borderColor:  'rgba(201,169,110,0.14)',
        height:       38,
      }}>
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, #0A0A0A, transparent)' }}/>
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(-90deg, #0A0A0A, transparent)' }}/>

      <div className="flex items-center h-full ticker-track" style={{
        display: 'flex',
        animation: 'ticker-scroll 38s linear infinite',
        width: 'max-content',
      }}>
        {all.map((art, i) => {
          const positive = art.change.startsWith('+')
          return (
            <div key={`${art.id}-${i}`}
              className="flex items-center gap-3 px-5 shrink-0"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10.5px] text-white/55 tracking-wide truncate max-w-[110px]">
                {art.title}
              </span>
              <span className="text-[11px] font-mono text-white/80">{art.price} ETH</span>
              <span className="text-[10px] font-mono" style={{ color: positive ? '#4ade80' : '#f87171' }}>
                {art.change}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Grid Card (art-forward, data overlay) ─────────────────────────
function GridCard({
  art, cardRef, onCollect,
}: {
  art: Artwork
  cardRef: (el: HTMLDivElement | null) => void
  onCollect: (art: Artwork) => void
}) {
  const positive = art.change.startsWith('+')

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden cursor-pointer"
      style={{
        opacity:      0,
        background:   '#111',
        border:       `1px solid rgba(255,255,255,0.07)`,
        boxShadow:    `0 0 0 0px ${art.phaseColor}00`,
        transition:   'border-color 0.3s, box-shadow 0.3s',
        aspectRatio:  '3/4',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.borderColor = `${art.phaseColor}50`
        ;(e.currentTarget as HTMLElement).style.boxShadow  =
          `0 0 24px -4px ${art.phaseColor}28, inset 0 0 0 1px ${art.phaseColor}18`
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLElement).style.boxShadow  = '0 0 0 0px transparent'
      }}
    >
      {/* Full-bleed image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.image} alt={art.title}
        loading="lazy" decoding="async" draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Phase left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: art.phaseColor, opacity: 0.7 }}/>

      {/* Top badges */}
      <div className="absolute top-3 left-4 right-3 flex items-start justify-between z-10">
        <PhaseBadge phase={art.phase} color={art.phaseColor}/>
        <span className="px-2 py-[3px] text-[8px] tracking-widest uppercase font-mono"
          style={{
            background: 'rgba(0,0,0,0.65)',
            color:      'rgba(255,255,255,0.45)',
            border:     '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
          }}>
          {art.edition}
        </span>
      </div>

      {/* 24h change pill — top right, bold */}
      <div className="absolute top-10 right-3 z-10">
        <span className="px-2.5 py-1 text-[11px] font-mono font-semibold"
          style={{
            background:   positive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
            color:        positive ? '#4ade80' : '#f87171',
            border:       `1px solid ${positive ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            borderRadius: 2,
          }}>
          {art.change}
        </span>
      </div>

      {/* ── Resting info overlay — always visible at bottom ── */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 py-4 pointer-events-none
                      group-hover:opacity-0 transition-opacity duration-250"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)' }}>
        <p className="text-[9px] tracking-[0.22em] uppercase mb-1"
          style={{ color: 'rgba(255,255,255,0.4)' }}>{art.artist}</p>
        <h3 className="text-white/90 leading-tight mb-2.5"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 300 }}>
          {art.title}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[1.3rem] font-light text-white leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {art.price}
            </span>
            <span className="text-[#C9A96E] text-xs ml-1.5">ETH</span>
          </div>
          <Sparkline data={art.sparkline} color={art.phaseColor} id={art.id} w={60} h={24}/>
        </div>
      </div>

      {/* ── Hover panel — slides up with full trading data ── */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none
                      translate-y-2 opacity-0
                      group-hover:translate-y-0 group-hover:opacity-100
                      transition-all duration-300 ease-out"
        style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.97) 60%, rgba(8,8,8,0.85) 85%, transparent 100%)' }}>
        <div className="px-4 pt-8 pb-4 space-y-3">

          {/* Artist + title */}
          <div>
            <p className="text-[9px] tracking-[0.22em] uppercase mb-0.5"
              style={{ color: 'rgba(255,255,255,0.38)' }}>{art.artist}</p>
            <h3 className="text-white/90 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 300 }}>
              {art.title}
            </h3>
          </div>

          {/* Price + sparkline */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[8px] tracking-widest uppercase mb-0.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Current Price</p>
              <span className="text-[1.45rem] font-light text-white leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {art.price}
              </span>
              <span className="text-[#C9A96E] text-xs ml-1.5">ETH</span>
              <p className="text-[9px] font-mono mt-0.5"
                style={{ color: 'rgba(255,255,255,0.28)' }}>${art.priceUsd}</p>
            </div>
            <Sparkline data={art.sparkline} color={art.phaseColor} id={art.id + 100} w={80} h={32}/>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '24h Vol',  value: `${art.volume24h} ETH` },
              { label: '7d',       value: art.change7d },
              { label: 'Holders',  value: String(art.holders) },
            ].map(s => (
              <div key={s.label} className="px-2 py-1.5 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[7.5px] uppercase tracking-widest mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>{s.label}</p>
                <p className="text-[11px] font-mono text-white/80">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Curve bar */}
          <CurveBar art={art}/>

          {/* Collect button */}
          <button type="button" onClick={() => onCollect(art)}
            className="pointer-events-auto w-full h-10 text-[10.5px] tracking-[0.25em] uppercase font-medium
                       transition-colors duration-200"
            style={{ background: art.phaseColor, color: '#0A0A0A' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Collect Now — {art.price} ETH
          </button>
        </div>
      </div>
    </div>
  )
}

// ── List Row ───────────────────────────────────────────────────────
function ListRow({
  art, rowRef, onCollect,
}: {
  art: Artwork
  rowRef: (el: HTMLDivElement | null) => void
  onCollect: (art: Artwork) => void
}) {
  const positive = art.change.startsWith('+')
  return (
    <div ref={rowRef}
      className="group grid items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors duration-200"
      style={{
        opacity:     0,
        gridTemplateColumns: '48px 1fr 120px 90px 80px 80px 110px 120px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumb */}
      <div className="relative w-12 h-12 overflow-hidden shrink-0 rounded-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.image} alt={art.title} loading="lazy" decoding="async"
          className="w-full h-full object-cover"/>
        <div className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ background: art.phaseColor }}/>
      </div>

      {/* Title + artist */}
      <div className="min-w-0">
        <p className="text-[13px] text-white/85 truncate leading-snug"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
          {art.title}
        </p>
        <p className="text-[9.5px] tracking-[0.16em] uppercase truncate"
          style={{ color: 'rgba(255,255,255,0.35)' }}>{art.artist}</p>
      </div>

      {/* Phase */}
      <div><PhaseBadge phase={art.phase} color={art.phaseColor}/></div>

      {/* Price */}
      <div>
        <p className="text-[13px] font-mono text-white/85">{art.price} ETH</p>
        <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>${art.priceUsd}</p>
      </div>

      {/* 24h */}
      <p className="text-[12px] font-mono font-medium"
        style={{ color: positive ? '#4ade80' : '#f87171' }}>{art.change}</p>

      {/* Volume */}
      <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {art.volume24h} ETH
      </p>

      {/* Supply bar */}
      <div>
        <div className="h-1 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full"
            style={{
              width: `${Math.round((art.supply / art.maxSupply) * 100)}%`,
              background: art.phaseColor,
            }}/>
        </div>
        <p className="text-[8.5px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {art.supply}/{art.maxSupply}
        </p>
      </div>

      {/* Sparkline + action */}
      <div className="flex items-center gap-3 justify-end">
        <Sparkline data={art.sparkline} color={art.phaseColor} id={art.id + 200} w={64} h={24}/>
        <button type="button" onClick={() => onCollect(art)}
          className="shrink-0 h-8 px-3.5 text-[9px] tracking-[0.2em] uppercase
                     opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: art.phaseColor, color: '#0A0A0A', fontWeight: 600 }}>
          Collect
        </button>
      </div>
    </div>
  )
}

// ── Buy Modal — 4-state dApp tx machine ───────────────────────────
function BuyModal({ art, onClose }: { art: Artwork; onClose: () => void }) {
  const [txState, setTxState] = useState<TxState>('idle')
  const [qty,     setQty]     = useState(1)
  const overlayRef            = useRef<HTMLDivElement>(null)
  const panelRef              = useRef<HTMLDivElement>(null)

  const total    = (parseFloat(art.price) * qty).toFixed(4)
  const totalUsd = (parseFloat(art.priceUsd) * qty).toFixed(2)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current,
        { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'power3.out' })
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: 28, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.3, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [])

  const handleClose = useCallback(() => {
    gsap.to([panelRef.current, overlayRef.current], {
      autoAlpha: 0, y: 10, duration: 0.18, ease: 'power3.in', onComplete: onClose,
    })
  }, [onClose])

  const handleCollect = useCallback(async () => {
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
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === overlayRef.current) handleClose() }}>
      <div ref={panelRef}
        className="relative w-full max-w-[460px] overflow-hidden"
        style={{
          background:      '#0D0D0D',
          border:          `1px solid ${art.phaseColor}28`,
          boxShadow:       `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 60px -20px ${art.phaseColor}20`,
          transformOrigin: 'center bottom',
        }}>

        {/* Phase color top stripe */}
        <div className="h-[2px] w-full"
          style={{ background: `linear-gradient(90deg, ${art.phaseColor}, ${art.phaseColor}40 60%, transparent)` }}/>

        {/* Header */}
        <div className="flex gap-4 px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative w-16 h-16 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.image} alt={art.title}
              className="w-full h-full object-cover"/>
            <div className="absolute left-0 top-0 bottom-0 w-0.5"
              style={{ background: art.phaseColor }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9.5px] tracking-[0.24em] uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.35)' }}>{art.artist}</p>
            <h3 className="text-white/90 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 300 }}>
              {art.title}
            </h3>
            <div className="mt-1.5"><PhaseBadge phase={art.phase} color={art.phaseColor}/></div>
          </div>
          <button onClick={handleClose} aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
                       transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Price + 24h */}
          <div className="flex items-end justify-between pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-[8.5px] tracking-[0.24em] uppercase mb-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Current Price</p>
              <p className="text-[2.1rem] font-light text-white leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {art.price} <span style={{ color: '#C9A96E', fontSize: '0.85rem' }}>ETH</span>
              </p>
              <p className="text-[11px] font-mono mt-0.5"
                style={{ color: 'rgba(255,255,255,0.28)' }}>${art.priceUsd} USD</p>
            </div>
            <div className="text-right">
              <Sparkline data={art.sparkline} color={art.phaseColor} id={art.id + 400} w={96} h={36}/>
              <p className="text-[11px] font-mono font-semibold mt-1"
                style={{ color: art.phaseColor }}>{art.change} 24h</p>
            </div>
          </div>

          {/* Bonding curve */}
          <CurveBar art={art}/>

          {/* Quantity */}
          <div className="pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[8.5px] tracking-[0.24em] uppercase mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Quantity</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1 || txState !== 'idle'}
                  className="w-9 h-9 flex items-center justify-center transition-colors duration-150
                             disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="w-9 text-center text-[1.1rem] font-light text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(10, q + 1))}
                  disabled={qty >= 10 || txState !== 'idle'}
                  className="w-9 h-9 flex items-center justify-center transition-colors duration-150
                             disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[8.5px] uppercase tracking-widest mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>Total Cost</p>
                <p className="text-white font-mono text-lg leading-none">{total} ETH</p>
                <p className="text-[10px] font-mono mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>${totalUsd}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          {txState === 'idle' && (
            <button onClick={handleCollect}
              className="w-full h-12 text-[10.5px] tracking-[0.3em] uppercase font-semibold
                         transition-opacity duration-200 active:scale-[0.99]"
              style={{ background: art.phaseColor, color: '#0A0A0A' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Collect {qty > 1 ? `${qty} Tokens` : 'Now'} · {total} ETH
            </button>
          )}

          {(txState === 'pending' || txState === 'confirming') && (
            <div className="w-full h-12 flex items-center justify-center gap-3"
              style={{ border: `1px solid ${art.phaseColor}30` }}>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
                style={{ color: art.phaseColor }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[10.5px] tracking-[0.22em] uppercase"
                style={{ color: art.phaseColor }}>
                {txState === 'pending' ? 'Confirm in Wallet' : 'On-chain Confirmation…'}
              </span>
            </div>
          )}

          {txState === 'success' && (
            <div className="space-y-2">
              <div className="w-full h-12 flex items-center justify-center gap-2.5"
                style={{ border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.06)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10.5px] tracking-[0.2em] uppercase text-emerald-400">
                  Collected Successfully
                </span>
              </div>
              <button onClick={handleClose}
                className="w-full h-8 text-[10px] tracking-widest uppercase transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.28)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}>
                Close
              </button>
            </div>
          )}

          {txState === 'error' && (
            <div className="space-y-2">
              <div className="w-full h-12 flex items-center justify-center"
                style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)' }}>
                <span className="text-[10.5px] tracking-[0.2em] uppercase text-red-400">
                  Transaction Failed
                </span>
              </div>
              <button onClick={() => setTxState('idle')}
                className="w-full h-8 text-[10px] tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.28)' }}>
                Try Again
              </button>
            </div>
          )}

          <p className="text-center text-[8.5px] tracking-[0.14em] uppercase mt-3"
            style={{ color: 'rgba(255,255,255,0.16)' }}>
            Base Network · Bonding Curve Contract · Gas Estimated
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export function MarketplacePage() {
  const [activePhase, setActivePhase] = useState<Phase | 'All'>('All')
  const [sortKey,     setSortKey]     = useState<SortKey>('newest')
  const [search,      setSearch]      = useState('')
  const [viewMode,    setViewMode]    = useState<ViewMode>('grid')
  const [sortOpen,    setSortOpen]    = useState(false)
  const [buyArt,      setBuyArt]      = useState<Artwork | null>(null)
  const [priceMin,    setPriceMin]    = useState('')
  const [priceMax,    setPriceMax]    = useState('')

  const sortRef    = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<(HTMLDivElement | null)[]>([])

  // ── Filter + sort ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...ARTWORKS]
    if (activePhase !== 'All')  items = items.filter(a => a.phase === activePhase)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(a =>
        a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
      )
    }
    if (priceMin) items = items.filter(a => parseFloat(a.price) >= parseFloat(priceMin))
    if (priceMax) items = items.filter(a => parseFloat(a.price) <= parseFloat(priceMax))
    items.sort((a, b) => {
      if (sortKey === 'price_asc')  return parseFloat(a.price)  - parseFloat(b.price)
      if (sortKey === 'price_desc') return parseFloat(b.price)  - parseFloat(a.price)
      if (sortKey === 'change')     return parseFloat(b.change) - parseFloat(a.change)
      if (sortKey === 'volume')     return parseFloat(b.volume24h) - parseFloat(a.volume24h)
      return b.createdAt - a.createdAt
    })
    return items
  }, [activePhase, sortKey, search, priceMin, priceMax])

  // Count per phase
  const phaseCounts = useMemo(() => ({
    All:          ARTWORKS.length,
    Accumulation: ARTWORKS.filter(a => a.phase === 'Accumulation').length,
    FOMO:         ARTWORKS.filter(a => a.phase === 'FOMO').length,
    Migration:    ARTWORKS.filter(a => a.phase === 'Migration').length,
  }), [])

  // Animate cards whenever filter changes
  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean)
    if (!cards.length) return
    gsap.fromTo(cards,
      { y: 16, autoAlpha: 0 },
      { y: 0,  autoAlpha: 1, duration: 0.4, ease: 'power3.out', stagger: 0.03 }
    )
  }, [filtered, viewMode])

  // Header entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = headerRef.current?.querySelectorAll<HTMLElement>('[data-h]')
      if (els?.length) {
        gsap.fromTo(Array.from(els),
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.07, delay: 0.05 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  // Sort dropdown outside-click
  useEffect(() => {
    if (!sortOpen) return
    const h = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [sortOpen])

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey)!

  return (
    <>
      {/* Ticker CSS */}
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track { will-change: transform; }
      `}</style>

      <div className="min-h-screen" style={{ paddingTop: 80, background: '#0A0A0A', color: '#fff' }}>

        {/* ── Live Market Ticker ───────────────────────────────── */}
        <MarketTicker/>

        {/* ── Page Header ─────────────────────────────────────── */}
        <div ref={headerRef}
          className="px-6 md:px-12 pt-10 pb-8"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p data-h className="text-[10.5px] tracking-[0.38em] uppercase mb-3"
            style={{ color: '#C9A96E', opacity: 0 }}>
            ArtCurve · Live Marketplace
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 data-h className="font-light leading-none mb-2"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize:   'clamp(2rem, 4.5vw, 3.8rem)',
                  color:      'rgba(255,255,255,0.92)',
                  opacity:    0,
                }}>
                Collect Art on the Curve
              </h1>
              <p data-h className="text-sm leading-relaxed max-w-md"
                style={{ color: 'rgba(255,255,255,0.38)', opacity: 0 }}>
                Each artwork is a bonding-curve token on Base. Price rises with every
                collection — buy early in Accumulation, ride FOMO, exit at Migration.
              </p>
            </div>
            {/* Market stat pills */}
            <div data-h className="flex flex-wrap gap-3" style={{ opacity: 0 }}>
              {[
                { l: 'Total Volume', v: '4,218 ETH' },
                { l: 'Live Listings', v: '2,847' },
                { l: '24h Trades', v: '483' },
              ].map(s => (
                <div key={s.l} className="px-4 py-2.5 text-center"
                  style={{
                    border:     '1px solid rgba(201,169,110,0.18)',
                    background: 'rgba(201,169,110,0.04)',
                    minWidth:   100,
                  }}>
                  <p className="text-[8px] tracking-widest uppercase mb-1"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>{s.l}</p>
                  <p className="text-[1.1rem] font-light"
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: '#C9A96E' }}>
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Phase nav tabs ───────────────────────────────────── */}
        <div className="flex overflow-x-auto"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', scrollbarWidth: 'none' }}>
          {(['All', 'Accumulation', 'FOMO', 'Migration'] as const).map(p => {
            const meta  = p === 'All' ? null : PHASE_META[p]
            const color = meta?.color ?? '#C9A96E'
            const count = phaseCounts[p]
            const active = activePhase === p
            return (
              <button key={p} type="button"
                onClick={() => setActivePhase(p)}
                className="relative flex items-center gap-2.5 px-6 py-4 shrink-0 transition-colors duration-200"
                style={{ color: active ? color : 'rgba(255,255,255,0.38)' }}>
                {meta && (
                  <span className="size-[6px] rounded-full" style={{ background: color }}/>
                )}
                <span className="text-[11px] tracking-[0.18em] uppercase">{p}</span>
                <span className="px-1.5 py-0.5 text-[8.5px] font-mono rounded"
                  style={{
                    background: active ? `${color}20` : 'rgba(255,255,255,0.06)',
                    color:      active ? color : 'rgba(255,255,255,0.28)',
                  }}>
                  {count}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-px" style={{ background: color }}/>
                )}
              </button>
            )
          })}
          {/* Phase description — right side */}
          {activePhase !== 'All' && (
            <div className="hidden md:flex items-center ml-auto px-6 shrink-0">
              <p className="text-[10px] italic" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {PHASE_META[activePhase].desc}
              </p>
            </div>
          )}
        </div>

        {/* ── Main layout: Sidebar + Content ──────────────────── */}
        <div className="flex min-h-[60vh]">

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-[240px] shrink-0"
            style={{
              borderRight:  '1px solid rgba(255,255,255,0.06)',
              position:     'sticky',
              top:          80,
              height:       'calc(100vh - 80px)',
              overflowY:    'auto',
              scrollbarWidth: 'none',
            }}>

            {/* Sort */}
            <div className="px-5 pt-6 pb-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[8.5px] tracking-[0.28em] uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Sort By</p>
              <div className="space-y-0.5">
                {SORT_OPTIONS.map(s => (
                  <button key={s.key} type="button"
                    onClick={() => setSortKey(s.key)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left
                               text-[11px] tracking-wide transition-colors duration-150"
                    style={{
                      color:      sortKey === s.key ? '#C9A96E' : 'rgba(255,255,255,0.45)',
                      background: sortKey === s.key ? 'rgba(201,169,110,0.08)' : 'transparent',
                      borderRadius: 2,
                    }}>
                    <span>{s.label}</span>
                    {sortKey === s.key && (
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none"
                        stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[8.5px] tracking-[0.28em] uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Price Range (ETH)</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min"
                  value={priceMin} onChange={e => setPriceMin(e.target.value)}
                  className="w-full h-8 px-2.5 text-[11px] font-mono bg-transparent outline-none"
                  style={{
                    border:      '1px solid rgba(255,255,255,0.1)',
                    color:       'rgba(255,255,255,0.7)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>—</span>
                <input type="number" placeholder="Max"
                  value={priceMax} onChange={e => setPriceMax(e.target.value)}
                  className="w-full h-8 px-2.5 text-[11px] font-mono bg-transparent outline-none"
                  style={{
                    border:      '1px solid rgba(255,255,255,0.1)',
                    color:       'rgba(255,255,255,0.7)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            </div>

            {/* Phase legend */}
            <div className="px-5 py-4">
              <p className="text-[8.5px] tracking-[0.28em] uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Bonding Curve Phases</p>
              <div className="space-y-3">
                {(Object.entries(PHASE_META) as [Phase, typeof PHASE_META[Phase]][]).map(([p, m]) => (
                  <button key={p} type="button"
                    onClick={() => setActivePhase(activePhase === p ? 'All' : p)}
                    className="w-full text-left"
                    style={{ opacity: activePhase !== 'All' && activePhase !== p ? 0.4 : 1,
                             transition: 'opacity 0.2s' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="size-[6px] rounded-full shrink-0"
                        style={{ background: m.color }}/>
                      <span className="text-[10.5px] tracking-[0.12em]"
                        style={{ color: m.color }}>{p}</span>
                      <span className="ml-auto text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.28)' }}>
                        {phaseCounts[p]}
                      </span>
                    </div>
                    <p className="text-[8.5px] leading-relaxed pl-4"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {(activePhase !== 'All' || search || priceMin || priceMax) && (
              <div className="px-5 pt-2 pb-5">
                <button type="button"
                  onClick={() => {
                    setActivePhase('All')
                    setSearch('')
                    setPriceMin('')
                    setPriceMax('')
                  }}
                  className="w-full h-8 text-[9px] tracking-[0.2em] uppercase transition-colors duration-150"
                  style={{
                    border:  '1px solid rgba(255,255,255,0.1)',
                    color:   'rgba(255,255,255,0.35)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)'
                    e.currentTarget.style.color       = '#C9A96E'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.color       = 'rgba(255,255,255,0.35)'
                  }}>
                  Clear All Filters
                </button>
              </div>
            )}
          </aside>

          {/* ── Content area ────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar: search + count + view toggle */}
            <div className="sticky z-20 flex items-center gap-3 px-6 py-3"
              style={{
                top:          80,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background:   'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(12px)',
              }}>

              {/* Search */}
              <div className="relative">
                <svg viewBox="0 0 24 24"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                </svg>
                <input type="search" placeholder="Search artworks or artists…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="h-8 pl-9 pr-4 w-52 text-[11px] bg-transparent outline-none"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    color:  'rgba(255,255,255,0.75)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              {/* Count */}
              <p className="text-[10px] font-mono flex-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
              </p>

              {/* Sort — mobile/tablet only (sidebar handles desktop) */}
              <div ref={sortRef} className="relative lg:hidden">
                <button type="button" onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-2 h-8 px-3 text-[10px] tracking-wide
                             transition-colors duration-200"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    color:  'rgba(255,255,255,0.55)',
                  }}>
                  <span>{currentSort.label}</span>
                  <svg viewBox="0 0 24 24" className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-[calc(100%+4px)] w-48 z-50 overflow-hidden"
                    style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {SORT_OPTIONS.map(s => (
                      <button key={s.key} type="button"
                        onClick={() => { setSortKey(s.key); setSortOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-[10.5px] tracking-wide
                                   transition-colors duration-150"
                        style={{
                          color:      s.key === sortKey ? '#C9A96E' : 'rgba(255,255,255,0.5)',
                          background: s.key === sortKey ? 'rgba(201,169,110,0.06)' : 'transparent',
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div className="flex border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {(['grid', 'list'] as ViewMode[]).map(m => (
                  <button key={m} type="button" onClick={() => setViewMode(m)}
                    title={m === 'grid' ? 'Grid view' : 'List view'}
                    className="w-8 h-8 flex items-center justify-center transition-colors duration-150"
                    style={{
                      background: viewMode === m ? 'rgba(201,169,110,0.12)' : 'transparent',
                      color:      viewMode === m ? '#C9A96E' : 'rgba(255,255,255,0.35)',
                      borderRight: m === 'grid' ? '1px solid rgba(255,255,255,0.1)' : undefined,
                    }}>
                    {m === 'grid' ? (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" rx="0.5"/>
                        <rect x="14" y="3" width="7" height="7" rx="0.5"/>
                        <rect x="3" y="14" width="7" height="7" rx="0.5"/>
                        <rect x="14" y="14" width="7" height="7" rx="0.5"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List view header row */}
            {viewMode === 'list' && filtered.length > 0 && (
              <div className="grid px-5 py-2.5 text-[8.5px] uppercase tracking-[0.18em]"
                style={{
                  gridTemplateColumns: '48px 1fr 120px 90px 80px 80px 110px 120px',
                  color:               'rgba(255,255,255,0.25)',
                  borderBottom:        '1px solid rgba(255,255,255,0.05)',
                  gap:                 '1rem',
                }}>
                <span/>
                <span>Artwork</span>
                <span>Phase</span>
                <span>Price</span>
                <span>24h</span>
                <span>Volume</span>
                <span>Supply</span>
                <span className="text-right">Action</span>
              </div>
            )}

            {/* ── Grid ──────────────────────────────────────────── */}
            {viewMode === 'grid' && (
              <div ref={gridRef} className="p-5 md:p-6"
                style={{
                  display:               'grid',
                  gap:                   '1.25rem',
                  gridTemplateColumns:   'repeat(auto-fill, minmax(220px, 1fr))',
                }}>
                {filtered.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
                    <svg viewBox="0 0 24 24" className="w-10 h-10"
                      style={{ color: 'rgba(255,255,255,0.1)' }}
                      fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 21V9" strokeLinecap="round"/>
                    </svg>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No artworks match your filters
                    </p>
                    <button type="button"
                      onClick={() => { setActivePhase('All'); setSearch(''); setPriceMin(''); setPriceMax('') }}
                      className="text-[10px] tracking-[0.2em] uppercase pb-0.5"
                      style={{
                        color:        '#C9A96E',
                        borderBottom: '1px solid rgba(201,169,110,0.35)',
                      }}>
                      Clear filters
                    </button>
                  </div>
                ) : filtered.map((art, i) => (
                  <GridCard key={art.id} art={art}
                    cardRef={el => { cardsRef.current[i] = el }}
                    onCollect={setBuyArt}/>
                ))}
              </div>
            )}

            {/* ── List ──────────────────────────────────────────── */}
            {viewMode === 'list' && (
              <div ref={gridRef}>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No artworks match your filters
                    </p>
                    <button type="button"
                      onClick={() => { setActivePhase('All'); setSearch(''); setPriceMin(''); setPriceMax('') }}
                      className="text-[10px] tracking-[0.2em] uppercase pb-0.5"
                      style={{ color: '#C9A96E', borderBottom: '1px solid rgba(201,169,110,0.35)' }}>
                      Clear filters
                    </button>
                  </div>
                ) : filtered.map((art, i) => (
                  <ListRow key={art.id} art={art}
                    rowRef={el => { cardsRef.current[i] = el }}
                    onCollect={setBuyArt}/>
                ))}
              </div>
            )}

            {/* Load more */}
            {filtered.length > 0 && (
              <div className="flex justify-center py-12">
                <button type="button"
                  className="h-11 px-10 text-[10.5px] tracking-[0.28em] uppercase
                             transition-all duration-300"
                  style={{
                    border: '1px solid rgba(201,169,110,0.3)',
                    color:  '#C9A96E',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,169,110,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  Load More Works
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {buyArt && <BuyModal art={buyArt} onClose={() => setBuyArt(null)}/>}
    </>
  )
}
