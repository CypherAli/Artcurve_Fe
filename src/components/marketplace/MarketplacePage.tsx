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
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
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

// ── Chart time range ──────────────────────────────────────────────
type TimeRange = '1H' | '6H' | '1D' | '7D'

function getChartData(sparkline: number[], range: TimeRange): number[] {
  switch (range) {
    case '1H': return sparkline.slice(-4)
    case '6H': return sparkline.slice(-6)
    case '7D': {
      const f = sparkline[0]
      return [f * 0.22, f * 0.44, f * 0.70, f * 0.90, ...sparkline]
    }
    default: return sparkline // '1D'
  }
}

const TIME_AXIS: Record<TimeRange, string[]> = {
  '1H': ['45m', '30m', '15m', 'Now'],
  '6H': ['5h', '4h', '3h', '2h', '1h', 'Now'],
  '1D': ['7d', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'],
  '7D': ['11d', '10d', '8d', '7d', '5d', '4d', '3d', '2d', '1d', 'Now'],
}

// ── Live activity feed data ────────────────────────────────────────
interface LiveTrade {
  id:        number
  art:       MarketArtwork
  addr:      string
  action:    'bought' | 'collected'
  ethAmount: string
}
const FAKE_WALLETS = [
  '0x4f2…a91', '0x8d3…f44', '0x1a9…c33',
  '0x7e1…b22', '0x2b5…d81', '0x9c4…e17', '0x3f7…a04',
]

// ── Animated background chart for the Command Center header ──────
//
//  Jagged price-chart aesthetic (gập khúc) — sparse angular points,
//  straight L commands only, no bezier smoothing.
//  Seamless loop: mainPts[0].y === mainPts[last].y (both = 45)
//                 accentPts[0].y === accentPts[last].y (both = 52)
//  Two SVG copies side-by-side, translate -50% ⟹ infinite smooth scroll.
//
function HeaderChartBg() {
  const W = 1200, H = 80

  const { mainD, areaD, accentD } = useMemo(() => {
    // ── Main line: gold ───────────────────────────────────────────
    // Macro anatomy (like the screenshot):
    //   Phase 1 (0–480):    slow downtrend with bounces — "distribution"
    //   Phase 2 (480–560):  bottom / accumulation zone — tight range
    //   Phase 3 (560–920):  uptrend, steeper than the decline — "mark-up"
    //   Phase 4 (920–1200): profit-taking, drift back to open — seamless tile
    //
    // SVG y: 0 = top of chart (HIGH price), 80 = bottom (LOW price)
    // First Y = Last Y = 48 ⟹ seamless tile
    const mainPts: [number, number][] = [
      // ── Phase 1: gradual sell-off with dead-cat bounces ─────────
      [0,    48],
      [45,   50], [85,   47],             // early noise
      [120,  52], [152,  49],             // lower high
      [182,  54], [210,  51],             // bounce fails
      [242,  56], [268,  53],             // lower low
      [298,  58], [322,  55],             // bounce
      [352,  60], [375,  57],             // continuation
      [405,  62], [428,  59],             // near bottom
      // ── Phase 2: bottom / accumulation ──────────────────────────
      [458,  65],                         // ← THE BOTTOM
      [478,  63], [498,  66], [518,  62], // tight chop at lows
      [538,  64], [555,  61],             // base forming
      // ── Phase 3: uptrend — steeper than decline ─────────────────
      [575,  57], [600,  52],             // breakout begins
      [622,  55], [645,  49],             // pullback → resume
      [668,  44], [688,  47],             // higher low
      [710,  41], [730,  37],             // momentum
      [748,  40], [768,  35],             // pullback → new high
      [788,  31], [805,  34],             // strong push
      [822,  29],                         // ← THE TOP
      [840,  33], [858,  37],             // take profit
      [878,  34], [898,  31],             // re-test high
      [918,  35],                         // last push
      // ── Phase 4: distribution / drift back to open ──────────────
      [945,  38], [975,  41],
      [1005, 43], [1040, 45],
      [1075, 46], [1115, 47],
      [1155, 48],
      [1200, 48],                         // = open ⟹ seamless ✓
    ]

    // ── Accent line: white ghost — offset version of same macro ───
    // Bottom comes earlier (x≈400), top later (x≈980), different noise
    // First Y = Last Y = 52 ⟹ seamless tile
    const accentPts: [number, number][] = [
      // Phase 1: decline
      [0,    52],
      [60,   54], [115,  51],
      [155,  56], [195,  53],
      [232,  58], [265,  55],
      [300,  61], [328,  58],
      [362,  63], [388,  60],
      // Bottom
      [418,  67],                         // ← bottom
      [440,  65], [462,  68], [480,  64],
      [500,  66], [518,  63],
      // Phase 3: rally
      [540,  59], [568,  54],
      [590,  57], [615,  51],
      [640,  46], [662,  49],
      [688,  43], [710,  40],
      [730,  44], [752,  38],
      [772,  34], [790,  37],
      [810,  32],                         // ← top
      [830,  36], [852,  33],
      [875,  37], [900,  40],
      // Phase 4: drift back
      [935,  43], [968,  46],
      [1005, 48], [1045, 50],
      [1090, 51], [1140, 52],
      [1200, 52],                         // = open ⟹ seamless ✓
    ]

    const toD = (pts: [number, number][]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1].toFixed(1)}`).join(' ')

    const mainStr = toD(mainPts)
    return {
      mainD:   mainStr,
      areaD:   `${mainStr} L${W},${H} L0,${H} Z`,
      accentD: toD(accentPts),
    }
  }, [])  // deps [] — deterministic, runs once

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* ── Main chart: gold area + line, 30s scroll ── */}
      <motion.div
        className="absolute inset-0 flex"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity, repeatType: 'loop' as const }}
        style={{ width: '200%' }}
      >
        {([0, 1] as const).map(idx => (
          <svg
            key={idx}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full"
            style={{ width: '50%', flexShrink: 0 }}
          >
            <defs>
              <linearGradient id={`hcg-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.16"/>
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#hcg-${idx})`}/>
            <path d={mainD} fill="none" stroke="#D4AF37"
              strokeWidth="1.3" strokeOpacity="0.28" strokeLinejoin="round"/>
          </svg>
        ))}
      </motion.div>

      {/* ── Accent chart: white ghost, 46s scroll (different speed = parallax depth) ── */}
      <motion.div
        className="absolute inset-0 flex"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 46, ease: 'linear', repeat: Infinity, repeatType: 'loop' as const }}
        style={{ width: '200%' }}
      >
        {([0, 1] as const).map(idx => (
          <svg
            key={idx}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full"
            style={{ width: '50%', flexShrink: 0 }}
          >
            <path d={accentD} fill="none" stroke="rgba(255,255,255,0.055)"
              strokeWidth="1" strokeLinejoin="round"/>
          </svg>
        ))}
      </motion.div>
    </div>
  )
}

// ── Scrolling trade ticker tape ───────────────────────────────────
function TickerTape() {
  const items = ARTWORKS.map(a => ({
    ticker:   a.ticker,
    change:   a.change24h,
    positive: a.changePositive,
    color:    a.phaseColor,
    vol:      a.volume24h,
  }))
  return (
    <div
      className="overflow-hidden"
      style={{
        height:       26,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   'rgba(0,0,0,0.5)',
      }}
    >
      <motion.div
        className="flex items-center h-full"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 34, ease: 'linear', repeat: Infinity, repeatType: 'loop' as const }}
        style={{ width: 'max-content', willChange: 'transform' }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 px-5 h-full shrink-0"
            style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span
              className="font-mono text-[8.5px] tracking-wide"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {item.ticker}
            </span>
            <span
              className="font-mono text-[8.5px] font-semibold"
              style={{ color: item.positive ? '#4ade80' : '#f87171' }}
            >
              {item.change}
            </span>
            <span className="font-mono text-[7.5px]"
              style={{ color: 'rgba(255,255,255,0.18)' }}>
              VOL {item.vol}
            </span>
            <span
              className="size-[5px] rounded-full shrink-0"
              style={{ background: item.color }}
            />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ── Live activity feed (placed below list items) ──────────────────
function ActivityFeed() {
  const [trades, setTrades] = useState<LiveTrade[]>(() =>
    [0, 1, 2, 3, 4].map(i => ({
      id:        i,
      art:       ARTWORKS[i % ARTWORKS.length],
      addr:      FAKE_WALLETS[i % FAKE_WALLETS.length],
      action:    (i % 3 === 0 ? 'collected' : 'bought') as LiveTrade['action'],
      ethAmount: (0.12 + (i % 5) * 0.28).toFixed(2),
    }))
  )
  const counterRef = useRef(10)

  useEffect(() => {
    const timer = setInterval(() => {
      const c = counterRef.current++
      setTrades(prev => [{
        id:        Date.now() + c,
        art:       ARTWORKS[c % ARTWORKS.length],
        addr:      FAKE_WALLETS[c % FAKE_WALLETS.length],
        action:    (c % 3 === 0 ? 'collected' : 'bought') as LiveTrade['action'],
        ethAmount: (0.12 + (c % 5) * 0.28).toFixed(2),
      }, ...prev.slice(0, 6)])
    }, 3600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span
          className="font-mono text-[8px] uppercase tracking-[0.22em]"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Live Activity
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full animate-pulse"
            style={{ background: '#4ade80' }}
          />
          <span
            className="font-mono text-[7.5px] tracking-widest"
            style={{ color: '#4ade80' }}
          >
            LIVE
          </span>
        </span>
      </div>

      {/* Trade rows */}
      <AnimatePresence initial={false}>
        {trades.map(trade => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            {/* Thumbnail */}
            <div className="relative w-[22px] h-[22px] shrink-0 overflow-hidden rounded-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={trade.art.image} alt="" className="w-full h-full object-cover" />
              <span
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: trade.art.phaseColor }}
              />
            </div>

            {/* Description */}
            <p
              className="flex-1 min-w-0 text-[8.5px] truncate"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <span
                className="font-mono"
                style={{ color: 'rgba(255,255,255,0.18)' }}
              >
                {trade.addr}
              </span>
              {' '}{trade.action}{' '}
              <span className="font-mono" style={{ color: trade.art.phaseColor }}>
                {trade.art.ticker}
              </span>
            </p>

            {/* Amount */}
            <span
              className="font-mono text-[8.5px] shrink-0"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {trade.ethAmount} ETH
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Fullscreen artwork lightbox ───────────────────────────────────
function ArtLightbox({ art, onClose }: { art: MarketArtwork; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[95] flex items-center justify-center p-8 cursor-zoom-out"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(24px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="relative"
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.image}
          alt={art.title}
          className="block max-h-[84vh] max-w-[84vw] object-contain"
          style={{ boxShadow: '0 48px 120px rgba(0,0,0,0.85)' }}
          draggable={false}
        />

        {/* Phase left accent */}
        <span
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: art.phaseColor }}
        />

        {/* Info overlay at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 px-6 py-5 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }}
        >
          <h2
            className="font-light leading-tight mb-1"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(1.4rem, 3vw, 2.2rem)',
              color:      '#FDFBF7',
            }}
          >
            {art.title}
          </h2>
          <p
            className="font-mono text-[9px] tracking-[0.2em] uppercase"
            style={{ color: art.phaseColor }}
          >
            {art.ticker} · {art.artist}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                     rounded-full pointer-events-auto cursor-pointer transition-colors duration-150"
          style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.18)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  )
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

  const [chartVisible, setChartVisible] = useState(false)
  const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

  return (
    <div
      className="relative w-full aspect-square overflow-hidden rounded-sm bg-[#0D0D0D]"
      onMouseEnter={() => setChartVisible(true)}
      onMouseLeave={() => setChartVisible(false)}
    >
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

      {/* Bottom gradient — deepens when chart is expanded */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height:     chartVisible ? '62%' : '22%',
          transition: `height 0.4s ${EASE}`,
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)',
        }}
      />

      {/* Sparkline chart — slides up from bottom on hover */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden"
        style={{
          height:     chartVisible ? '46%' : '14%',
          transition: `height 0.38s ${EASE}`,
        }}
      >
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
function BondingCurveChart({
  art, range, height = 160,
}: {
  art: MarketArtwork; range: TimeRange; height?: number
}) {
  const W = 600, H = 160                       // viewBox always fixed
  const chartData = getChartData(art.sparkline, range)
  const { d, areaD, last } = buildSparkPath(chartData, W, H, 10, 12, 32, 12)
  const gid      = `bc-${art.id}`
  const filterId = `bcglow-${art.id}`

  return (
    <div
      className="relative w-full rounded-sm overflow-hidden"
      style={{
        height,
        transition: 'height 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
        {TIME_AXIS[range].map(t => (
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
  livePrice,
  isFlashing,
  onClick,
}: {
  art:        MarketArtwork
  active:     boolean
  autoActive: boolean   // pulsing when auto-rotate is about to select
  livePrice:  number    // live-updated price for flash + display
  isFlashing: boolean   // brief colour flash on price tick
  onClick:    () => void
}) {
  const [hovered, setHovered] = useState(false)

  // Live % change vs original seed price
  const liveDelta = ((livePrice - art.marketCap) / art.marketCap) * 100
  const liveUp    = liveDelta >= 0
  const liveDeltaStr = `${liveUp ? '+' : ''}${liveDelta.toFixed(1)}%`

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
    <motion.button
      layout
      transition={{ layout: { type: 'spring', stiffness: 420, damping: 32 } }}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 py-3 px-4 text-left relative"
      style={{
        borderBottom:    '1px solid rgba(255,255,255,0.05)',
        background:      isFlashing
          ? (liveUp ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)')
          : active  ? 'rgba(255,255,255,0.04)'
          : hovered ? 'rgba(255,255,255,0.025)'
          : 'transparent',
        borderLeft:      active ? '2px solid #D4AF37' : '2px solid transparent',
        transition:      `background-color ${isFlashing ? '0.55s' : '0.15s'} ease, border-color 0.15s ease`,
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

      {/* Live market cap + live delta */}
      <div className="text-right shrink-0 w-20">
        <p
          className="font-mono text-[11.5px]"
          style={{ color: active ? '#FDFBF7' : 'rgba(255,255,255,0.65)' }}
        >
          {livePrice.toFixed(2)} ETH
        </p>
        <p
          className="font-mono text-[9px] mt-0.5"
          style={{ color: liveUp ? '#4ade80' : '#f87171' }}
        >
          {liveDeltaStr}
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
    </motion.button>
  )
}

// ── Right column: Inspection Deck ─────────────────────────────────
function InspectionDeck({
  art,
  onCollect,
  onLightbox,
}: {
  art:        MarketArtwork
  onCollect:  (art: MarketArtwork) => void
  onLightbox: (art: MarketArtwork) => void
}) {
  const [chartRange,   setChartRange]   = useState<TimeRange>('1D')
  const [chartHovered, setChartHovered] = useState(false)
  const [tilt,         setTilt]         = useState({ rx: 0, ry: 0 })

  // Reset state when artwork changes
  useEffect(() => {
    setChartRange('1D')
    setChartHovered(false)
    setTilt({ rx: 0, ry: 0 })
  }, [art.id])

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ry =  ((e.clientX - rect.left) / rect.width  - 0.5) *  7
    const rx = -((e.clientY - rect.top)  / rect.height - 0.5) *  7
    setTilt({ rx, ry })
  }, [])
  const handleTiltLeave = useCallback(() => setTilt({ rx: 0, ry: 0 }), [])

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

          {/* Left: Artwork — click to lightbox, hover to 3-D tilt */}
          <div
            className="w-1/2 shrink-0 cursor-zoom-in"
            onMouseMove={handleTiltMove}
            onMouseLeave={handleTiltLeave}
            onClick={() => onLightbox(art)}
            style={{
              transform:        `perspective(700px) rotateY(${tilt.ry}deg) rotateX(${tilt.rx}deg)`,
              transition:       'transform 0.22s ease',
              transformOrigin:  'center center',
            }}
            title="Click to expand"
          >
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

          {/* Bonding curve chart + timeframe switcher — collapses to 52px, expand on hover */}
          <div
            onMouseEnter={() => setChartHovered(true)}
            onMouseLeave={() => setChartHovered(false)}
            className="cursor-ns-resize"
          >
            {/* Header row — always visible */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <p
                  className="font-mono text-[9px] tracking-[0.22em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  Bonding Curve · Price History
                </p>
                {/* Expand hint — only shown when collapsed */}
                {!chartHovered && (
                  <span
                    className="font-mono text-[7.5px] tracking-wide transition-opacity duration-300"
                    style={{ color: 'rgba(255,255,255,0.18)' }}
                  >
                    hover to expand
                  </span>
                )}
              </div>
              {/* Timeframe tabs — fade in when expanded */}
              <div
                className="flex items-center gap-1 transition-opacity duration-300"
                style={{ opacity: chartHovered ? 1 : 0, pointerEvents: chartHovered ? 'auto' : 'none' }}
              >
                {(['1H', '6H', '1D', '7D'] as TimeRange[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChartRange(r)}
                    className="font-mono text-[8px] px-2 py-1 transition-colors duration-150"
                    style={{
                      color:      chartRange === r ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                      background: chartRange === r ? 'rgba(212,175,55,0.1)' : 'transparent',
                      border:     `1px solid ${chartRange === r ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart — 52px collapsed, 160px expanded */}
            <BondingCurveChart
              art={art}
              range={chartRange}
              height={chartHovered ? 160 : 52}
            />
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

const QUICK_AMOUNTS = ['0.1 ETH', '0.5 ETH', '1 ETH'] as const

function BuyModal({ art, onClose }: { art: MarketArtwork; onClose: () => void }) {
  const [tx,         setTx]         = useState<TxState>('idle')
  const [buyAmount,  setBuyAmount]   = useState<string>('0.1 ETH')
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
            <>
              {/* Quick amount presets */}
              <div className="flex gap-2 mb-3">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBuyAmount(amt)}
                    className="flex-1 h-8 font-mono text-[9px] tracking-widest transition-colors duration-150"
                    style={{
                      border:     `1px solid ${buyAmount === amt ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                      color:      buyAmount === amt ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                      background: buyAmount === amt ? 'rgba(212,175,55,0.08)' : 'transparent',
                    }}
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Gas fee estimate */}
              <div
                className="flex items-center justify-between px-3 py-2 mb-3 font-mono text-[8px]"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border:     '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.28)' }}>Network fee</span>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>~$0.04 · Base · EIP-1559</span>
              </div>

              {/* Confirm button */}
              <button
                onClick={buy}
                className="w-full h-11 font-mono text-[10.5px] tracking-[0.28em] uppercase font-semibold
                           transition-opacity duration-200"
                style={{ background: 'linear-gradient(90deg, #D4AF37, #F3E5AB)', color: '#0A0A0A' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                BUY {buyAmount} — {art.ticker}
              </button>
            </>
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
  const [lightboxArt,  setLightboxArt]  = useState<MarketArtwork | null>(null)
  // Auto-rotate
  const [listHovered,  setListHovered]  = useState(false)
  const [rotateProgress, setRotateProg] = useState(0)
  const [nextId,       setNextId]       = useState<number | null>(null)

  // Live price simulation
  const [livePrices, setLivePrices] = useState<Record<number, number>>(
    () => Object.fromEntries(ARTWORKS.map(a => [a.id, a.marketCap]))
  )
  const [flashId,    setFlashId]    = useState<number | null>(null)

  const sortRef      = useRef<HTMLDivElement>(null)
  const headerRef    = useRef<HTMLDivElement>(null)
  const resumeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Two-tier price simulation ──────────────────────────────────
  //  Tier 1 — micro tick every 2.4s: ±5% flash (UI noise, no rank change)
  //  Tier 2 — spike event every 4.5s: +20% to +130% (causes rank jumps)
  useEffect(() => {
    const doFlash = (id: number, duration = 700) => {
      setFlashId(id)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashId(null), duration)
    }

    // Tier 1: small ticks — just for visual activity
    const microTimer = setInterval(() => {
      const art  = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)]
      const delta = 1 + (Math.random() * 0.08 - 0.03) // -3% to +5%
      setLivePrices(prev => ({
        ...prev,
        [art.id]: parseFloat((prev[art.id] * delta).toFixed(3)),
      }))
      doFlash(art.id, 600)
    }, 2400)

    // Tier 2: spike events — enough to cause visible rank changes
    const spikeTimer = setInterval(() => {
      const art   = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)]
      // +20% to +130% spike — can shoot a low-ranked item past multiple rows
      const spike = 1 + (Math.random() * 1.1 + 0.20)
      setLivePrices(prev => ({
        ...prev,
        [art.id]: parseFloat((prev[art.id] * spike).toFixed(3)),
      }))
      doFlash(art.id, 1200)
    }, 4500)

    return () => {
      clearInterval(microTimer)
      clearInterval(spikeTimer)
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [])

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
      const pa = livePrices[a.id] ?? a.marketCap
      const pb = livePrices[b.id] ?? b.marketCap
      if (sortKey === 'market_cap') return pb - pa
      if (sortKey === 'price_asc')  return pa - pb
      if (sortKey === 'price_desc') return pb - pa
      if (sortKey === 'change')
        return parseFloat(b.change24h) - parseFloat(a.change24h)
      return b.id - a.id
    })
    return items
  }, [activePhase, sortKey, search, livePrices])

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

        {/* ══ TICKER TAPE ═════════════════════════════════════ */}
        <TickerTape />

        {/* ══ COMMAND CENTER ══════════════════════════════════ */}
        <div
          ref={headerRef}
          className="relative shrink-0 px-8 py-5 overflow-hidden"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Animated background chart */}
          <HeaderChartBg />

          {/* Content — above the background */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            ) : (
              <LayoutGroup>
                {filtered.map(art => (
                  <ListItem
                    key={art.id}
                    art={art}
                    active={selected.id === art.id}
                    autoActive={nextId === art.id}
                    livePrice={livePrices[art.id] ?? art.marketCap}
                    isFlashing={flashId === art.id}
                    onClick={() => handleSelect(art)}
                  />
                ))}
              </LayoutGroup>
            )}

            {/* ── Live Activity Feed ── */}
            <ActivityFeed />
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
            <InspectionDeck art={selected} onCollect={setBuyArt} onLightbox={setLightboxArt}/>
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
                <InspectionDeck art={selected} onCollect={art => { setSheetOpen(false); setBuyArt(art) }} onLightbox={setLightboxArt}/>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ BUY MODAL ════════════════════════════════════════ */}
      {buyArt && <BuyModal art={buyArt} onClose={() => setBuyArt(null)}/>}

      {/* ══ ARTWORK LIGHTBOX ═════════════════════════════════ */}
      <AnimatePresence>
        {lightboxArt && (
          <ArtLightbox
            key="lightbox"
            art={lightboxArt}
            onClose={() => setLightboxArt(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
