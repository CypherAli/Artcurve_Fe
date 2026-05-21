'use client'

// ─────────────────────────────────────────────────────────────────
//  MarketplacePage.tsx  —  Split-Pane Trading Terminal
//
//  Layout (Master-Detail, 100% viewport height):
//
//    ┌──────── COMMAND CENTER ────────────────────────────────────┐
//    │  LIVE MARKETPLACE              VOL │ LISTINGS │ 24H       │
//    ├──────── FLOW NAVIGATOR ────────────────────────────────────┤
//    │  [ALL] [ACCUMULATION] [FOMO] [MIGRATION]   [search] [▼]   │
//    ├──── LIST (40%) ──────┬──── INSPECTION DECK (60%) ─────────┤
//    │ ● Nocturne   2.45ETH │  [Artwork Image]  │ Title          │
//    │ ● Shattered  0.89ETH │  + Sparkline      │ $TICKER        │
//    │ ● Bloom      4.12ETH │  overlay          │ Description    │
//    │ ● Böcklin  18.20ETH  ├───────────────────┴────────────────┤
//    │ ...                  │  [Bonding Curve Chart]             │
//    │                      │  [BUY $TOKEN ─────────────────]   │
//    └──────────────────────┴────────────────────────────────────┘
//
//  Mobile: left list only → click row → bottom sheet slides up
// ─────────────────────────────────────────────────────────────────

import {
  useEffect, useRef, useState, useMemo, useCallback,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap }                    from '@/lib/gsap'
import { PHASE_COLOR, Phase }      from './ArtCard'

// ── Extended artwork type ──────────────────────────────────────────
interface MarketArtwork {
  id:             number
  title:          string
  ticker:         string
  artist:         string
  artistAddr:     string
  phase:          Phase
  phaseColor:     string
  marketCap:      number      // raw ETH (for sort)
  marketCapLabel: string
  change24h:      string
  changePositive: boolean
  change7d:       string
  volume24h:      string
  holders:        number
  progress:       number      // 0–100
  image:          string
  description:    string
  sparkline:      number[]    // 10-point price history
}

// ── Artwork catalogue ──────────────────────────────────────────────
const ARTWORKS: MarketArtwork[] = [
  {
    id: 1, title: 'Nocturne at the Bridge', ticker: '$NOCTURNE',
    artist: 'Elena Vasquez', artistAddr: '0x4f2…a91',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 2.45, marketCapLabel: '2.45 ETH',
    change24h: '+18.4%', changePositive: true, change7d: '+31.2%',
    volume24h: '1.42 ETH', holders: 24, progress: 62,
    image: '/images/artworks/art1.jpg',
    description: 'A cinematic study of artificial light fracturing across still water — painted at the precise moment before the bridge lamps extinguish for dawn.',
    sparkline: [4, 5.2, 6.8, 6.1, 5.4, 7.0, 9.5, 14.2, 19.8, 23.4],
  },
  {
    id: 2, title: 'Shattered Embrace', ticker: '$SHATTER',
    artist: 'Marcus Chen', artistAddr: '0x8d3…f44',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 0.89, marketCapLabel: '0.89 ETH',
    change24h: '+7.2%', changePositive: true, change7d: '+9.8%',
    volume24h: '0.38 ETH', holders: 8, progress: 28,
    image: '/images/artworks/art2.jpg',
    description: 'Porcelain figures frozen mid-collapse — an allegory for the tension between intimacy and inevitability. Early collectors form the foundation of this bonding curve.',
    sparkline: [5, 4.8, 5.3, 5.1, 5.6, 5.4, 6.2, 7.1, 7.8, 8.9],
  },
  {
    id: 3, title: 'Bloom & Blade', ticker: '$BLOOM',
    artist: 'Aiko Tanaka', artistAddr: '0x1a9…c33',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 4.12, marketCapLabel: '4.12 ETH',
    change24h: '+29.3%', changePositive: true, change7d: '+58.4%',
    volume24h: '2.87 ETH', holders: 31, progress: 71,
    image: '/images/artworks/art3.jpg',
    description: 'Cherry blossoms edged in obsidian — the duality of beauty and violence rendered in hyper-saturated ink. Demand has accelerated beyond early projections.',
    sparkline: [3, 7.5, 14.0, 9.2, 6.8, 10.5, 16.0, 12.4, 28.0, 41.2],
  },
  {
    id: 4, title: 'Self-Portrait with Death', ticker: '$BÖCKLIN',
    artist: 'Arnold Böcklin', artistAddr: '0x7e1…b22',
    phase: 'Migration', phaseColor: PHASE_COLOR['Migration'],
    marketCap: 18.20, marketCapLabel: '18.20 ETH',
    change24h: '+44.1%', changePositive: true, change7d: '+112.3%',
    volume24h: '8.62 ETH', holders: 47, progress: 94,
    image: '/images/artworks/art4.jpg',
    description: 'The master stares down his own mortality — a 19th-century meditation on time tokenised on-chain for the first time. 94% toward graduation liquidity.',
    sparkline: [2, 2.3, 2.8, 3.5, 5.0, 9.0, 22.0, 58.0, 120.0, 182.0],
  },
  {
    id: 5, title: 'The Last March', ticker: '$MARCH',
    artist: 'Yui Nakamura', artistAddr: '0x2b5…d81',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 5.51, marketCapLabel: '5.51 ETH',
    change24h: '+33.7%', changePositive: true, change7d: '+71.0%',
    volume24h: '3.21 ETH', holders: 28, progress: 78,
    image: '/images/artworks/art5.jpg',
    description: "Soldiers dissolving into fog — a requiem for certainty. The bonding curve reflects the market's collective dirge: slow at first, then all at once.",
    sparkline: [8, 6.0, 4.2, 5.8, 8.5, 6.5, 9.0, 14.5, 22.0, 55.1],
  },
  {
    id: 6, title: 'Ghost of the Meridian', ticker: '$GHOST',
    artist: 'Ivan Sorokin', artistAddr: '0x9c4…e17',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 0.61, marketCapLabel: '0.61 ETH',
    change24h: '+3.1%', changePositive: true, change7d: '+4.8%',
    volume24h: '0.14 ETH', holders: 5, progress: 12,
    image: '/images/artworks/art1.jpg',
    description: 'A cartographic ghost — the meridian line that never existed, traced in oil. Accumulation phase. The curve is waiting for discovery.',
    sparkline: [4, 4.2, 3.9, 4.5, 4.3, 5.1, 5.4, 5.8, 5.9, 6.1],
  },
  {
    id: 7, title: 'Pale Architecture', ticker: '$PALE',
    artist: 'Soo-Ah Lim', artistAddr: '0x3f7…a04',
    phase: 'Migration', phaseColor: PHASE_COLOR['Migration'],
    marketCap: 23.40, marketCapLabel: '23.40 ETH',
    change24h: '+51.8%', changePositive: true, change7d: '+138.0%',
    volume24h: '12.40 ETH', holders: 53, progress: 97,
    image: '/images/artworks/art2.jpg',
    description: 'Brutalism made spectral — load-bearing columns rendered translucent. 97% to graduation. The final 3% of this curve carries maximum price velocity.',
    sparkline: [1, 1.5, 2.2, 4.0, 8.5, 18.0, 42.0, 88.0, 164.0, 234.0],
  },
  {
    id: 8, title: 'Cathedral of Ash', ticker: '$CATHEDRA',
    artist: 'Elena Vasquez', artistAddr: '0x4f2…a91',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 6.77, marketCapLabel: '6.77 ETH',
    change24h: '+28.1%', changePositive: true, change7d: '+62.4%',
    volume24h: '4.03 ETH', holders: 33, progress: 66,
    image: '/images/artworks/art3.jpg',
    description: "Gothic spires reclaimed by fire — what remains after belief burns away. Vasquez's most ambitious work on-chain, with consistent inflow since mint.",
    sparkline: [5, 6.2, 7.8, 9.5, 8.1, 11.0, 15.5, 20.3, 29.0, 67.7],
  },
]

// ── Sort / phase types ─────────────────────────────────────────────
type SortKey = 'market_cap' | 'price_asc' | 'price_desc' | 'change' | 'newest'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'market_cap', label: 'Market Cap' },
  { key: 'change',     label: 'Top Gainers' },
  { key: 'price_desc', label: 'Price: High → Low' },
  { key: 'price_asc',  label: 'Price: Low → High' },
  { key: 'newest',     label: 'Recently Listed' },
]

const PHASE_TABS: { key: Phase | 'All'; label: string }[] = [
  { key: 'All',          label: 'ALL' },
  { key: 'Accumulation', label: 'ACCUMULATION' },
  { key: 'FOMO',         label: 'FOMO' },
  { key: 'Migration',    label: 'MIGRATION' },
]

// ── Sparkline helpers ──────────────────────────────────────────────
function buildSparkPath(
  data: number[],
  W: number, H: number,
  padT: number, padR: number, padB: number, padL: number,
) {
  const pw = W - padL - padR
  const ph = H - padT - padB
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((v, i) => ({
    x: padL + (i / (data.length - 1)) * pw,
    y: padT + ph - ((v - min) / (max - min || 1)) * ph,
  }))
  const d = `M${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`
  const last = pts[pts.length - 1]
  const areaD =
    `${d} L${last.x.toFixed(1)},${(padT + ph).toFixed(1)} ` +
    `L${padL.toFixed(1)},${(padT + ph).toFixed(1)} Z`
  return { d, areaD, last }
}

// ── Artwork image with sparkline overlay (like homepage) ───────────
function ArtworkWithChart({
  art,
}: {
  art: MarketArtwork
}) {
  const W = 400, H = 200
  const { d, areaD, last } = buildSparkPath(art.sparkline, W, H, 12, 8, 28, 8)
  const gid = `co-${art.id}`
  const filterId = `cglow-${art.id}`

  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-sm bg-[#0D0D0D]">
      {/* Artwork */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.image}
        alt={art.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Phase badge — top left */}
      <div
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1
                   text-[9px] tracking-[0.24em] uppercase font-medium"
        style={{
          background: 'rgba(0,0,0,0.65)',
          border:     `1px solid ${art.phaseColor}40`,
          color:      art.phaseColor,
        }}
      >
        <span className="size-[5px] rounded-full" style={{ background: art.phaseColor }}/>
        {art.phase}
      </div>

      {/* 24h badge — top right */}
      <div
        className="absolute top-3 right-3 z-10 px-2 py-1 font-mono text-[10px] font-semibold"
        style={{
          background: art.changePositive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
          border:     `1px solid ${art.changePositive ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
          color:      art.changePositive ? '#4ade80' : '#f87171',
        }}
      >
        {art.change24h}
      </div>

      {/* Bottom gradient for chart readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        }}
      />

      {/* Sparkline chart overlaid on image — the FOMO weapon */}
      <div className="absolute inset-x-0 bottom-0 h-[46%] pointer-events-none">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={art.phaseColor} stopOpacity="0.45"/>
              <stop offset="100%" stopColor={art.phaseColor} stopOpacity="0"/>
            </linearGradient>
            <filter id={filterId} x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map(t => (
            <line
              key={t}
              x1={8} x2={W - 8}
              y1={12 + (H - 40) * t} y2={12 + (H - 40) * t}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill={`url(#${gid})`}/>

          {/* Main line with glow */}
          <path
            d={d}
            fill="none"
            stroke={art.phaseColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${filterId})`}
          />

          {/* Last point: outer glow + white dot */}
          <circle cx={last.x} cy={last.y} r="5.5" fill={art.phaseColor} opacity="0.5" filter={`url(#${filterId})`}/>
          <circle cx={last.x} cy={last.y} r="3.5" fill={art.phaseColor} filter={`url(#${filterId})`}/>
          <circle cx={last.x} cy={last.y} r="2"   fill="white"/>

          {/* Price label next to last point */}
          <text
            x={last.x + 7} y={last.y + 4}
            fill="white" fontSize="10" fontFamily="ui-monospace,monospace" fontWeight="600"
          >
            {art.marketCapLabel}
          </text>
          <text
            x={last.x + 7} y={last.y + 16}
            fill={art.phaseColor} fontSize="8.5" fontFamily="ui-monospace,monospace"
          >
            {art.change24h}
          </text>
        </svg>
      </div>
    </div>
  )
}

// ── Bonding curve chart (larger version for detail bottom) ─────────
function BondingCurveChart({ art }: { art: MarketArtwork }) {
  const W = 600, H = 160
  const { d, areaD, last } = buildSparkPath(art.sparkline, W, H, 10, 12, 32, 12)
  const gid      = `bc-${art.id}`
  const filterId = `bcglow-${art.id}`

  return (
    <div
      className="relative w-full rounded-sm overflow-hidden"
      style={{
        height:     160,
        background: 'rgba(255,255,255,0.03)',
        border:     '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Y-axis labels */}
      <div className="absolute left-2 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
        {[...art.sparkline].sort((a,b) => b-a).filter((_,i) => i === 0 || i === Math.floor(art.sparkline.length/2)).map((v, i) => (
          <span key={i} className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {v.toFixed(2)}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={art.phaseColor} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={art.phaseColor} stopOpacity="0"/>
          </linearGradient>
          <filter id={filterId} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t}
            x1={12} x2={W - 12}
            y1={10 + (H - 42) * t} y2={10 + (H - 42) * t}
            stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 6"
          />
        ))}

        <path d={areaD} fill={`url(#${gid})`}/>
        <path d={d} fill="none" stroke={art.phaseColor} strokeWidth="2"
          strokeLinecap="round" filter={`url(#${filterId})`}/>
        <circle cx={last.x} cy={last.y} r="4" fill={art.phaseColor} filter={`url(#${filterId})`}/>
        <circle cx={last.x} cy={last.y} r="2" fill="white"/>
      </svg>

      {/* Bottom time axis */}
      <div className="absolute bottom-1.5 inset-x-3 flex justify-between pointer-events-none">
        {['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'].map(t => (
          <span key={t} className="font-mono text-[7px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Left column: compact list item ────────────────────────────────
function ListItem({
  art,
  active,
  autoActive,
  onClick,
}: {
  art:        MarketArtwork
  active:     boolean
  autoActive: boolean   // pulsing when auto-rotate is about to select
  onClick:    () => void
}) {
  const [hovered, setHovered] = useState(false)

  // Mini sparkline helper (inline — no external dep needed)
  const sparkW = hovered ? 72 : 40
  const sparkH = hovered ? 28 : 16
  const { d: sd, areaD: sad } = useMemo(() => {
    const data = art.sparkline
    const pw = sparkW - 2, ph = sparkH - 2
    const min = Math.min(...data), max = Math.max(...data)
    const pts = data.map((v, i) => ({
      x: 1 + (i / (data.length - 1)) * pw,
      y: 1 + ph - ((v - min) / (max - min || 1)) * ph,
    }))
    const d = `M${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`
    const last = pts[pts.length - 1]
    const areaD = `${d} L${last.x.toFixed(1)},${(1 + ph).toFixed(1)} L1,${(1 + ph).toFixed(1)} Z`
    return { d, areaD }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art.sparkline, sparkW, sparkH])

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 py-3 px-4 text-left
                 transition-colors duration-150 relative"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   active ? 'rgba(255,255,255,0.04)' : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        borderLeft:   active ? `2px solid #D4AF37` : '2px solid transparent',
      }}
    >
      {/* Auto-rotate pulse ring on thumb */}
      <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.image} alt={art.title}
          className="w-full h-full object-cover"
          loading="lazy" decoding="async"
        />
        <span className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: art.phaseColor }}/>
        {/* Pulsing border when auto-selecting */}
        {autoActive && !active && (
          <span className="absolute inset-0 animate-ping rounded-sm opacity-40"
            style={{ border: `1px solid ${art.phaseColor}` }}/>
        )}
      </div>

      {/* Title + ticker */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-[12.5px] leading-tight"
          style={{
            color:      active ? '#FDFBF7' : 'rgba(255,255,255,0.72)',
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
          }}>
          {art.title}
        </p>
        <p className="text-[9px] font-mono tracking-wide mt-0.5"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {art.ticker}
        </p>
      </div>

      {/* Market cap + 24h */}
      <div className="text-right shrink-0 w-20">
        <p className="font-mono text-[11.5px]"
          style={{ color: active ? '#FDFBF7' : 'rgba(255,255,255,0.65)' }}>
          {art.marketCapLabel}
        </p>
        <p className="font-mono text-[9px] mt-0.5"
          style={{ color: art.changePositive ? '#4ade80' : '#f87171' }}>
          {art.change24h}
        </p>
      </div>

      {/* ── Mini sparkline — small by default, expands on row hover ── */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width:      sparkW,
          height:     sparkH,
          transition: 'width 0.28s ease, height 0.28s ease',
        }}
      >
        <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full h-full" aria-hidden>
          <defs>
            <linearGradient id={`ls-${art.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={art.phaseColor} stopOpacity="0.35"/>
              <stop offset="100%" stopColor={art.phaseColor} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={sad} fill={`url(#ls-${art.id})`}/>
          <path d={sd}  fill="none" stroke={art.phaseColor}
            strokeWidth={hovered ? 1.5 : 1.2} strokeLinecap="round"/>
        </svg>
      </div>
    </button>
  )
}

// ── Right column: Inspection Deck ─────────────────────────────────
function InspectionDeck({
  art,
  onCollect,
}: {
  art:       MarketArtwork
  onCollect: (art: MarketArtwork) => void
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={art.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="h-full overflow-y-auto p-8 flex flex-col gap-7"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* ── Top Half: Art + Typography ── */}
        <div className="flex gap-6">

          {/* Left: Artwork with sparkline overlay */}
          <div className="w-1/2 shrink-0">
            <ArtworkWithChart art={art}/>
          </div>

          {/* Right: Typography block */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-4">

            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="font-mono text-[10px] tracking-[0.2em] uppercase px-2 py-1"
                style={{
                  background: `${art.phaseColor}15`,
                  border:     `1px solid ${art.phaseColor}35`,
                  color:      art.phaseColor,
                }}
              >
                {art.phase}
              </span>
              <span
                className="font-mono text-[10px] tracking-wider"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {art.ticker}
              </span>
            </div>

            {/* Title */}
            <h2
              className="font-light leading-[1.08]"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize:   'clamp(1.6rem, 2.4vw, 2.4rem)',
                color:      '#FDFBF7',
              }}
            >
              {art.title}
            </h2>

            {/* Artist */}
            <p className="text-[10px] tracking-[0.24em] uppercase"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              {art.artist}
              <span className="ml-2 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {art.artistAddr}
              </span>
            </p>

            {/* Description */}
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.52)', maxWidth: '36ch' }}
            >
              {art.description}
            </p>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { label: 'Market Cap',  value: art.marketCapLabel, color: '#FDFBF7' },
                { label: '24h Change',  value: art.change24h, color: art.changePositive ? '#4ade80' : '#f87171' },
                { label: '7d Change',   value: art.change7d,  color: 'rgba(255,255,255,0.7)' },
              ].map(m => (
                <div
                  key={m.label}
                  className="px-3 py-2.5 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border:     '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <p className="text-[7.5px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: 'rgba(255,255,255,0.28)' }}>{m.label}</p>
                  <p className="font-mono text-[12px] font-medium" style={{ color: m.color }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, ${art.phaseColor}30, rgba(255,255,255,0.07) 40%, transparent)`,
          }}
        />

        {/* ── Bottom Half: Chart + CTA ── */}
        <div className="flex flex-col gap-5">

          {/* Holders + volume micro-stats */}
          <div className="flex items-center gap-6">
            {[
              { label: 'Volume 24h',  value: art.volume24h },
              { label: 'Holders',     value: String(art.holders) },
              { label: 'Edition',     value: 'Open' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[8px] uppercase tracking-[0.2em] mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>{s.label}</p>
                <p className="font-mono text-[12.5px]"
                  style={{ color: 'rgba(255,255,255,0.75)' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Bonding curve chart */}
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              Bonding Curve · 7-Day Price History
            </p>
            <BondingCurveChart art={art}/>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between font-mono text-[9px] mb-1.5">
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>Curve Progress</span>
              <span style={{ color: '#D4AF37' }}>{art.progress}% to Graduation</span>
            </div>
            <div className="h-[5px] w-full rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${art.progress}%`,
                  background: 'linear-gradient(90deg, #D4AF37, #F3E5AB)',
                }}/>
            </div>
            <div className="flex justify-between font-mono text-[7.5px] mt-1.5"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              <span>Accumulation</span>
              <span>FOMO</span>
              <span>Migration</span>
            </div>
          </div>

          {/* BUY CTA */}
          <button
            type="button"
            onClick={() => onCollect(art)}
            className="relative w-full h-[52px] font-mono tracking-[0.32em] uppercase font-semibold
                       overflow-hidden group/btn transition-all duration-250 active:scale-[0.99]"
            style={{
              background:  'linear-gradient(90deg, #D4AF37, #F3E5AB 50%, #D4AF37)',
              backgroundSize: '200% 100%',
              color:       '#0A0A0A',
              fontSize:    '11px',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundPosition = '100% 0')}
            onMouseLeave={e => (e.currentTarget.style.backgroundPosition = '0% 0')}
          >
            BUY {art.ticker} — {art.marketCapLabel}
          </button>

          <p className="text-center font-mono text-[8px] tracking-[0.14em] uppercase"
            style={{ color: 'rgba(255,255,255,0.16)' }}>
            Base Network · Bonding Curve · {art.holders} current holders
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Buy confirmation modal (lightweight) ──────────────────────────
type TxState = 'idle' | 'pending' | 'confirming' | 'success'

function BuyModal({ art, onClose }: { art: MarketArtwork; onClose: () => void }) {
  const [tx, setTx] = useState<TxState>('idle')
  const overlayRef  = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22 })
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: 28, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.28, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  const close = useCallback(() => {
    gsap.to([panelRef.current, overlayRef.current], {
      autoAlpha: 0, duration: 0.18, ease: 'power3.in', onComplete: onClose,
    })
  }, [onClose])

  const buy = useCallback(async () => {
    setTx('pending')
    await new Promise(r => setTimeout(r, 1700))
    setTx('confirming')
    await new Promise(r => setTimeout(r, 2200))
    setTx('success')
  }, [])

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === overlayRef.current) close() }}>
      <div ref={panelRef}
        className="relative w-full max-w-[400px] overflow-hidden"
        style={{
          background:  '#0D0D0D',
          border:      `1px solid ${art.phaseColor}25`,
          boxShadow:   `0 32px 80px rgba(0,0,0,0.85), 0 0 50px -20px ${art.phaseColor}18`,
        }}>
        <div className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${art.phaseColor}, ${art.phaseColor}40 60%, transparent)` }}/>

        <div className="flex items-start gap-4 px-6 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.image} alt="" className="w-full h-full object-cover"/>
            <span className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: art.phaseColor }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest uppercase mb-0.5"
              style={{ color: art.phaseColor }}>{art.ticker}</p>
            <h3 className="font-light text-white/90 truncate"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem' }}>
              {art.title}
            </h3>
          </div>
          <button onClick={close}
            className="w-7 h-7 flex items-center justify-center rounded-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex justify-between items-end mb-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1.25rem' }}>
            <div>
              <p className="text-[8px] uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}>Market Cap</p>
              <p className="font-light text-white leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem' }}>
                {art.marketCapLabel}
              </p>
            </div>
            <p className="font-mono font-semibold" style={{ color: art.phaseColor }}>
              {art.change24h}
            </p>
          </div>

          {tx === 'idle' && (
            <button onClick={buy}
              className="w-full h-11 font-mono text-[10.5px] tracking-[0.28em] uppercase font-semibold
                         transition-opacity duration-200"
              style={{ background: 'linear-gradient(90deg, #D4AF37, #F3E5AB)', color: '#0A0A0A' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Confirm Purchase — {art.marketCapLabel}
            </button>
          )}
          {(tx === 'pending' || tx === 'confirming') && (
            <div className="w-full h-11 flex items-center justify-center gap-3"
              style={{ border: `1px solid ${art.phaseColor}35` }}>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
                style={{ color: art.phaseColor }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-mono text-[10px] tracking-widest uppercase"
                style={{ color: art.phaseColor }}>
                {tx === 'pending' ? 'Confirm in Wallet' : 'On Base…'}
              </span>
            </div>
          )}
          {tx === 'success' && (
            <div>
              <div className="w-full h-11 flex items-center justify-center gap-2.5 mb-2"
                style={{ border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.06)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"
                  stroke="#4ade80" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-mono text-[10px] tracking-widest uppercase text-emerald-400">
                  Collected
                </span>
              </div>
              <button onClick={close}
                className="w-full h-8 font-mono text-[9px] tracking-widest uppercase transition-colors"
                style={{ color: 'rgba(255,255,255,0.28)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}>
                Close
              </button>
            </div>
          )}
          <p className="text-center font-mono text-[8px] tracking-widest uppercase mt-3"
            style={{ color: 'rgba(255,255,255,0.16)' }}>
            Base Network · Bonding Curve Contract
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Auto-rotate interval (ms) ─────────────────────────────────────
const ROTATE_MS = 4500

// ── Main MarketplacePage ───────────────────────────────────────────
export function MarketplacePage() {
  const [selected,     setSelected]     = useState<MarketArtwork>(ARTWORKS[0])
  const [activePhase,  setActivePhase]  = useState<Phase | 'All'>('All')
  const [sortKey,      setSortKey]      = useState<SortKey>('market_cap')
  const [search,       setSearch]       = useState('')
  const [sortOpen,     setSortOpen]     = useState(false)
  const [buyArt,       setBuyArt]       = useState<MarketArtwork | null>(null)
  const [sheetOpen,    setSheetOpen]    = useState(false)
  // Auto-rotate
  const [listHovered,  setListHovered]  = useState(false)
  const [rotateProgress, setRotateProg] = useState(0)
  const [nextId,       setNextId]       = useState<number | null>(null)

  const sortRef      = useRef<HTMLDivElement>(null)
  const headerRef    = useRef<HTMLDivElement>(null)
  const resumeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Filter + sort ──────────────────────────────────────────────
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
      if (sortKey === 'market_cap') return b.marketCap - a.marketCap
      if (sortKey === 'price_asc')  return a.marketCap - b.marketCap
      if (sortKey === 'price_desc') return b.marketCap - a.marketCap
      if (sortKey === 'change')
        return parseFloat(b.change24h) - parseFloat(a.change24h)
      return b.id - a.id
    })
    return items
  }, [activePhase, sortKey, search])

  // If selected gets filtered out, auto-select first
  useEffect(() => {
    if (filtered.length && !filtered.find(a => a.id === selected.id)) {
      setSelected(filtered[0])
    }
  }, [filtered, selected.id])

  // ── Auto-rotation — cycles every ROTATE_MS, pauses on hover ──
  useEffect(() => {
    if (listHovered || filtered.length <= 1) {
      setNextId(null)
      setRotateProg(0)
      return
    }

    // Tick progress bar every 80ms
    const TICK = 80
    let elapsed = 0
    const progressId = setInterval(() => {
      elapsed += TICK
      const pct = Math.min(100, (elapsed / ROTATE_MS) * 100)
      setRotateProg(pct)

      // Preview which row is "next" at 70% progress
      if (pct >= 70) {
        const idx  = filtered.findIndex(a => a.id === selected.id)
        const next = filtered[(idx + 1) % filtered.length]
        setNextId(next.id)
      }
    }, TICK)

    // Rotate when full
    const rotateId = setTimeout(() => {
      setSelected(prev => {
        const idx  = filtered.findIndex(a => a.id === prev.id)
        return filtered[(idx + 1) % filtered.length]
      })
      setRotateProg(0)
      setNextId(null)
    }, ROTATE_MS)

    return () => {
      clearInterval(progressId)
      clearTimeout(rotateId)
    }
  }, [listHovered, filtered, selected.id])

  // Pause auto-rotate on hover, resume 2 s after leave
  const onListEnter = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    setListHovered(true)
    setNextId(null)
    setRotateProg(0)
  }, [])

  const onListLeave = useCallback(() => {
    resumeTimer.current = setTimeout(() => setListHovered(false), 2000)
  }, [])

  // Phase counts
  const counts = useMemo(() => ({
    All:          ARTWORKS.length,
    Accumulation: ARTWORKS.filter(a => a.phase === 'Accumulation').length,
    FOMO:         ARTWORKS.filter(a => a.phase === 'FOMO').length,
    Migration:    ARTWORKS.filter(a => a.phase === 'Migration').length,
  }), [])

  // Header entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = headerRef.current?.querySelectorAll<HTMLElement>('[data-fade]')
      if (els?.length) {
        gsap.fromTo(Array.from(els),
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', stagger: 0.07, delay: 0.05 }
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

  // Manual select — also stops auto-rotate briefly
  const handleSelect = (art: MarketArtwork) => {
    setSelected(art)
    setListHovered(true)
    setRotateProg(0)
    setNextId(null)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setListHovered(false), 3000)
    setSheetOpen(true)
  }

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey)!

  // ── RIGHT PANEL sticky top = 80px header + 48px navigator = 128px
  const STICKY_TOP = 128

  return (
    <>
      <div style={{ paddingTop: 80, background: '#0A0A0A', minHeight: '100dvh' }}>

        {/* ══ COMMAND CENTER ══════════════════════════════════ */}
        <div
          ref={headerRef}
          className="shrink-0 px-8 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                data-fade
                className="font-light tracking-[0.06em] leading-none"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize:   'clamp(1.6rem, 3vw, 2.6rem)',
                  color:      '#FDFBF7',
                  opacity:    0,
                }}
              >
                LIVE MARKETPLACE
              </h1>
              <p
                data-fade
                className="text-[11px] tracking-[0.18em] mt-1"
                style={{ color: 'rgba(255,255,255,0.35)', opacity: 0 }}
              >
                Trade unique artworks on the bonding curve.
              </p>
            </div>
            {/* Market stats */}
            <div data-fade className="flex gap-2 flex-wrap" style={{ opacity: 0 }}>
              {[
                { label: 'TOTAL VOLUME', value: '4,218 ETH', gold: true },
                { label: 'LIVE LISTINGS', value: '2,847' },
                { label: '24H TRADES', value: '+12.4%', green: true },
              ].map(s => (
                <div key={s.label}
                  className="px-4 py-2.5 text-center"
                  style={{
                    border:     '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)',
                    minWidth:   96,
                  }}>
                  <p className="font-mono text-[7.5px] tracking-[0.22em] uppercase mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
                  <p className="font-mono text-[0.95rem] leading-none"
                    style={{
                      color: s.gold ? '#D4AF37' : s.green ? '#4ade80' : 'rgba(255,255,255,0.82)',
                    }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ FLOW NAVIGATOR ══════════════════════════════════ */}
        <div
          className="sticky z-30 flex items-center justify-between gap-4 px-6"
          style={{
            top:          80,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background:   'rgba(10,10,10,0.98)',
            height:       48,
          }}
        >
          {/* Phase tabs */}
          <div className="flex items-center h-full overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {PHASE_TABS.map(tab => {
              const active = activePhase === tab.key
              const color  = tab.key === 'All'
                ? '#D4AF37'
                : PHASE_COLOR[tab.key as Phase]
              const count  = counts[tab.key as keyof typeof counts]
              return (
                <button key={tab.key} type="button"
                  onClick={() => setActivePhase(tab.key)}
                  className="relative flex items-center gap-1.5 h-full px-3.5 shrink-0
                             text-[9.5px] tracking-[0.2em] uppercase transition-colors duration-200"
                  style={{ color: active ? color : 'rgba(255,255,255,0.32)' }}>
                  {tab.key !== 'All' && active && (
                    <span className="size-[4px] rounded-full" style={{ background: color }}/>
                  )}
                  {tab.label}
                  <span className="font-mono text-[7.5px] px-1 py-0.5"
                    style={{
                      background: active ? `${color}18` : 'rgba(255,255,255,0.05)',
                      color:      active ? color : 'rgba(255,255,255,0.22)',
                    }}>
                    {count}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-px"
                      style={{ background: color }}/>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search + sort */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <svg viewBox="0 0 24 24"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input type="search" placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="h-7 pl-5 pr-2 w-36 text-[10.5px] bg-transparent outline-none
                           placeholder:text-white/20"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                  color:        'rgba(255,255,255,0.7)',
                }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = 'rgba(212,175,55,0.65)')}
                onBlur={e  => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.15)')}
              />
            </div>
            <div ref={sortRef} className="relative">
              <button type="button" onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-1.5 h-7 px-2.5 text-[9.5px] tracking-wide
                           uppercase transition-colors duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)')}
                onMouseLeave={e => !sortOpen && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
                {currentSort.label}
                <svg viewBox="0 0 24 24"
                  className={`w-2.5 h-2.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}
                    className="absolute right-0 top-[calc(100%+4px)] z-50 overflow-hidden"
                    style={{
                      background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                      minWidth: 170, boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                    }}>
                    {SORT_OPTIONS.map(s => (
                      <button key={s.key} type="button"
                        onClick={() => { setSortKey(s.key); setSortOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-[10px] tracking-wide
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
                        }}>
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

        {/* ══ SPLIT PANE ══════════════════════════════════════ */}
        <div className="flex items-start">

          {/* ── Left: Compact List (40%) ── */}
          <div
            onMouseEnter={onListEnter}
            onMouseLeave={onListLeave}
            style={{
              width:          '40%',
              borderRight:    '1px solid rgba(255,255,255,0.07)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(212,175,55,0.15) transparent',
            }}
          >
            {/* Auto-rotate progress bar */}
            <div
              className="h-[2px] w-full"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full"
                style={{
                  width:      `${rotateProgress}%`,
                  background: listHovered
                    ? 'transparent'
                    : 'linear-gradient(90deg, #D4AF37, #F3E5AB)',
                  transition: listHovered ? 'none' : 'width 0.08s linear',
                }}
              />
            </div>

            {/* List header */}
            <div
              className="grid gap-3 sticky z-10 px-4 py-2"
              style={{
                top:                 128, /* 80px header + 48px nav */
                gridTemplateColumns: '40px 1fr 80px 48px',
                background:          '#0A0A0A',
                borderBottom:        '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {['', 'Artwork', 'Cap', '%'].map(h => (
                <p key={h} className="font-mono text-[7.5px] uppercase tracking-[0.2em]"
                  style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {h}
                </p>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  No results
                </p>
                <button type="button"
                  onClick={() => { setActivePhase('All'); setSearch('') }}
                  className="font-mono text-[9px] uppercase tracking-widest pb-0.5"
                  style={{ color: '#D4AF37', borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
                  Clear filters
                </button>
              </div>
            ) : filtered.map(art => (
              <ListItem
                key={art.id}
                art={art}
                active={selected.id === art.id}
                autoActive={nextId === art.id}
                onClick={() => handleSelect(art)}
              />
            ))}
          </div>

          {/* ── Right: Inspection Deck (60%) — hidden on mobile, sticky ── */}
          <div
            className="hidden md:block flex-1 min-w-0"
            style={{
              position:   'sticky',
              top:        STICKY_TOP,
              height:     `calc(100vh - ${STICKY_TOP}px)`,
              overflowY:  'auto',
              background: '#0A0A0A',
              scrollbarWidth: 'none',
            }}
          >
            <InspectionDeck art={selected} onCollect={setBuyArt}/>
          </div>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM SHEET ══════════════════════════════ */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[60] md:hidden"
              style={{ background: 'rgba(0,0,0,0.85)' }}
              onClick={() => setSheetOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[70] md:hidden overflow-hidden"
              style={{
                background:   '#0D0D0D',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderBottom: 'none',
                maxHeight:    '90dvh',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}/>
              </div>
              <div style={{ maxHeight: 'calc(90dvh - 24px)', overflowY: 'auto' }}>
                <InspectionDeck art={selected} onCollect={art => { setSheetOpen(false); setBuyArt(art) }}/>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ BUY MODAL ════════════════════════════════════════ */}
      {buyArt && <BuyModal art={buyArt} onClose={() => setBuyArt(null)}/>}
    </>
  )
}
