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
import Link                        from 'next/link'
import { gsap }                    from '@/lib/gsap'
import { PHASE_COLOR, Phase }      from './ArtCard'
import { CandlestickChart }        from '../common/CandlestickChart'
import { useMarketplace }          from '@/hooks/useMarketplace'
import { artworkService }          from '@/services/artwork.service'
import { tradeService }            from '@/services/trade.service'
import { useBinanceTicker, fmtUSD, fmtChange, TICKER_COINS } from '@/hooks/useBinanceTicker'
import type { Artwork, RecentTrade } from '@/types/api'
import type { StoredArtwork }      from '@/components/artwork/ArtworkDetailPage'

// ── Extended artwork type ──────────────────────────────────────────
interface MarketArtwork {
  id:             number       // numeric UI key (stable across renders)
  artworkId:      string       // real UUID for API calls ('' for mock items)
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
  rating:         number | null   // avg rating 1–5, null = no reviews
  ratingCount:    number
}

// ── Artwork catalogue (mock — used when backend is unreachable) ───
const ARTWORKS_MOCK: MarketArtwork[] = ([
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
  // ── Extended catalogue using convergence imagery ──────────────
  {
    id: 9, title: 'Convergence I', ticker: '$CONV1',
    artist: 'Mira Okafor', artistAddr: '0x5b8…c12',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 1.32, marketCapLabel: '1.32 ETH',
    change24h: '+5.8%', changePositive: true, change7d: '+12.1%',
    volume24h: '0.62 ETH', holders: 11, progress: 34,
    image: '/convergence/img1.jpg',
    description: 'The first in a series exploring the liminal space where digital forms bleed into organic matter. Slow accumulation phase — patient collectors are rewarded.',
    sparkline: [3, 3.4, 3.1, 3.8, 4.2, 4.0, 4.8, 5.5, 6.1, 7.0],
  },
  {
    id: 10, title: 'Dissolution Study', ticker: '$DISS',
    artist: 'Paulo Reyes', artistAddr: '0x6c9…d23',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 3.88, marketCapLabel: '3.88 ETH',
    change24h: '+22.4%', changePositive: true, change7d: '+44.0%',
    volume24h: '2.11 ETH', holders: 22, progress: 58,
    image: '/convergence/img2.jpg',
    description: 'Painted erosion — identity dissolving into its constituent pigments. A meditation on impermanence with a bonding curve that mirrors the subject matter.',
    sparkline: [2, 3.1, 2.8, 4.5, 3.9, 5.6, 7.2, 9.8, 14.0, 19.4],
  },
  {
    id: 11, title: 'Threshold Fragment', ticker: '$THRESH',
    artist: 'Yuki Tanabe', artistAddr: '0x7d0…e34',
    phase: 'Migration', phaseColor: PHASE_COLOR['Migration'],
    marketCap: 31.50, marketCapLabel: '31.50 ETH',
    change24h: '+67.2%', changePositive: true, change7d: '+189.4%',
    volume24h: '18.40 ETH', holders: 61, progress: 99,
    image: '/convergence/img3.jpg',
    description: 'The artwork that defines the boundary — standing at the threshold of graduated liquidity. 99% complete. Final fragment of the curve.',
    sparkline: [1, 1.8, 3.2, 7.0, 15.0, 38.0, 95.0, 198.0, 280.0, 315.0],
  },
  {
    id: 12, title: 'Signal Noise', ticker: '$SIGNAL',
    artist: 'Kezia Adeyemi', artistAddr: '0x8e1…f45',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 0.44, marketCapLabel: '0.44 ETH',
    change24h: '+2.3%', changePositive: true, change7d: '+3.1%',
    volume24h: '0.09 ETH', holders: 4, progress: 8,
    image: '/convergence/img4.jpg',
    description: 'Radio-wave aesthetics — the beautiful noise between stations. Ultra-early accumulation. The curve has barely moved, which is the point.',
    sparkline: [4, 4.1, 3.9, 4.3, 4.2, 4.4, 4.3, 4.5, 4.4, 4.6],
  },
  {
    id: 13, title: 'Residue of Light', ticker: '$RESID',
    artist: 'Ivan Sorokin', artistAddr: '0x9c4…e17',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 8.90, marketCapLabel: '8.90 ETH',
    change24h: '+35.6%', changePositive: true, change7d: '+82.0%',
    volume24h: '5.44 ETH', holders: 38, progress: 74,
    image: '/convergence/img5.jpg',
    description: 'The photographic residue of a 30-second exposure — city lights bleeding into dark matter. FOMO phase: each holder intensifies the luminosity.',
    sparkline: [6, 5.8, 7.2, 8.9, 7.5, 10.2, 16.8, 22.4, 38.0, 89.0],
  },
  {
    id: 14, title: 'Topology of Loss', ticker: '$TOPO',
    artist: 'Soo-Ah Lim', artistAddr: '0x3f7…a04',
    phase: 'Migration', phaseColor: PHASE_COLOR['Migration'],
    marketCap: 14.70, marketCapLabel: '14.70 ETH',
    change24h: '+48.9%', changePositive: true, change7d: '+124.0%',
    volume24h: '9.20 ETH', holders: 44, progress: 91,
    image: '/convergence/img6.jpg',
    description: 'Topographic maps of grief — contour lines that chart emotional elevation. Migration phase, 91% to graduation.',
    sparkline: [2, 2.5, 3.4, 5.8, 9.0, 16.0, 36.0, 76.0, 128.0, 147.0],
  },
  {
    id: 15, title: 'Recursive Dream', ticker: '$RECURSE',
    artist: 'Marcus Chen', artistAddr: '0x8d3…f44',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 5.22, marketCapLabel: '5.22 ETH',
    change24h: '+26.7%', changePositive: true, change7d: '+53.0%',
    volume24h: '3.08 ETH', holders: 27, progress: 63,
    image: '/convergence/img7.jpg',
    description: "A painting of a painting of a painting — recursive self-reference rendered in oil. Chen's most ambitious work since Shattered Embrace.",
    sparkline: [4, 4.8, 6.0, 5.2, 7.1, 9.4, 12.8, 17.5, 28.0, 52.2],
  },
  {
    id: 16, title: 'Entropy Protocol', ticker: '$ENTROP',
    artist: 'Aiko Tanaka', artistAddr: '0x1a9…c33',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 1.85, marketCapLabel: '1.85 ETH',
    change24h: '+9.4%', changePositive: true, change7d: '+16.8%',
    volume24h: '0.88 ETH', holders: 14, progress: 42,
    image: '/convergence/img8.jpg',
    description: 'The protocol of decay — algorithmic systems running toward maximum disorder. Accumulation phase: entropy is being priced in.',
    sparkline: [5, 5.3, 4.9, 5.8, 6.4, 6.1, 7.5, 8.8, 10.2, 12.4],
  },
  {
    id: 17, title: 'Meridian Crossing', ticker: '$MERID',
    artist: 'Yui Nakamura', artistAddr: '0x2b5…d81',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 7.43, marketCapLabel: '7.43 ETH',
    change24h: '+31.2%', changePositive: true, change7d: '+69.5%',
    volume24h: '4.65 ETH', holders: 35, progress: 71,
    image: '/convergence/img9.jpg',
    description: 'The exact cartographic moment a ship crosses longitude zero — frozen in paint. Nakamura explores navigation as existential metaphor.',
    sparkline: [3, 4.2, 5.8, 4.9, 6.5, 8.2, 11.5, 16.8, 24.0, 43.2],
  },
  {
    id: 18, title: 'Void Cartography', ticker: '$VOID',
    artist: 'Arnold Böcklin', artistAddr: '0x7e1…b22',
    phase: 'Migration', phaseColor: PHASE_COLOR['Migration'],
    marketCap: 27.80, marketCapLabel: '27.80 ETH',
    change24h: '+59.3%', changePositive: true, change7d: '+155.0%',
    volume24h: '16.10 ETH', holders: 58, progress: 96,
    image: '/convergence/img10.jpg',
    description: "Mapping the territory that doesn't exist — Böcklin's late-period exploration of negative space and the cartography of absence. 96% to graduation.",
    sparkline: [1, 1.6, 2.8, 5.5, 12.0, 28.0, 68.0, 142.0, 232.0, 278.0],
  },
  {
    id: 19, title: 'Amber Protocol', ticker: '$AMBER',
    artist: 'Kezia Adeyemi', artistAddr: '0x8e1…f45',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 2.10, marketCapLabel: '2.10 ETH',
    change24h: '+8.1%', changePositive: true, change7d: '+18.4%',
    volume24h: '0.94 ETH', holders: 16, progress: 38,
    image: '/images/artworks/art1.jpg',
    description: 'Preserved in digital amber — moments of kinetic motion frozen at their most vivid. The bonding curve is finding its first collectors.',
    sparkline: [6, 6.4, 5.9, 7.1, 7.8, 7.3, 8.6, 9.5, 11.0, 12.8],
  },
  {
    id: 20, title: 'Fracture Line', ticker: '$FRACT',
    artist: 'Paulo Reyes', artistAddr: '0x6c9…d23',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 9.40, marketCapLabel: '9.40 ETH',
    change24h: '+38.4%', changePositive: true, change7d: '+91.0%',
    volume24h: '6.12 ETH', holders: 41, progress: 76,
    image: '/images/artworks/art2.jpg',
    description: 'The exact point where a material fails — rendered in hyper-detail. The fracture line between stability and collapse is exactly where the FOMO curve accelerates.',
    sparkline: [4, 5.1, 6.8, 5.4, 8.2, 11.0, 15.8, 22.5, 42.0, 79.4],
  },
  {
    id: 21, title: 'Temporal Drift', ticker: '$DRIFT',
    artist: 'Mira Okafor', artistAddr: '0x5b8…c12',
    phase: 'Accumulation', phaseColor: PHASE_COLOR['Accumulation'],
    marketCap: 0.88, marketCapLabel: '0.88 ETH',
    change24h: '+4.2%', changePositive: true, change7d: '+7.0%',
    volume24h: '0.22 ETH', holders: 7, progress: 19,
    image: '/images/artworks/art4.jpg',
    description: 'Long-exposure photography of a clockface — time rendered as smear. One of the most patient bonding curves on the platform. Early.',
    sparkline: [5, 5.2, 4.8, 5.5, 5.3, 5.7, 5.9, 6.2, 6.5, 6.9],
  },
  {
    id: 22, title: 'Sovereign Geometry', ticker: '$SOVGEO',
    artist: 'Yuki Tanabe', artistAddr: '0x7d0…e34',
    phase: 'Migration', phaseColor: PHASE_COLOR['Migration'],
    marketCap: 19.90, marketCapLabel: '19.90 ETH',
    change24h: '+55.1%', changePositive: true, change7d: '+141.0%',
    volume24h: '13.20 ETH', holders: 50, progress: 93,
    image: '/images/artworks/art5.jpg',
    description: 'Sacred geometries that govern — forms that predate language. Migration phase, 93% complete. The curve approaches its final inflection.',
    sparkline: [2, 2.6, 4.0, 8.0, 17.0, 42.0, 98.0, 154.0, 188.0, 199.0],
  },
  {
    id: 23, title: 'Chromatic Grief', ticker: '$CHROMA',
    artist: 'Elena Vasquez', artistAddr: '0x4f2…a91',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 4.55, marketCapLabel: '4.55 ETH',
    change24h: '+24.7%', changePositive: true, change7d: '+48.0%',
    volume24h: '2.66 ETH', holders: 25, progress: 60,
    image: '/convergence/img3.jpg',
    description: "Vasquez explores the spectrum of mourning — each colour a stage, each gradient a transition. The bonding curve mirrors the non-linearity of grief itself.",
    sparkline: [3, 3.8, 5.0, 4.2, 6.1, 8.0, 11.5, 15.8, 26.0, 45.5],
  },
  {
    id: 24, title: 'Silent Architecture', ticker: '$SILENT',
    artist: 'Ivan Sorokin', artistAddr: '0x9c4…e17',
    phase: 'FOMO', phaseColor: PHASE_COLOR['FOMO'],
    marketCap: 7.10, marketCapLabel: '7.10 ETH',
    change24h: '+30.5%', changePositive: true, change7d: '+67.2%',
    volume24h: '4.28 ETH', holders: 32, progress: 69,
    image: '/convergence/img7.jpg',
    description: 'Buildings that absorb sound — spaces designed for contemplation. Sorokin documents structures that resist the noise of the modern city. High FOMO phase.',
    sparkline: [5, 5.8, 7.5, 6.3, 9.1, 12.5, 17.0, 23.8, 38.5, 71.0],
  },
] as Omit<MarketArtwork, 'artworkId' | 'rating' | 'ratingCount'>[]).map((a, i) => ({
  ...a,
  artworkId:   '',
  // Deterministic plausible ratings per artwork (3.50 – 5.00)
  rating:      parseFloat((3.5 + ((i * 37 + 11) % 16) / 10).toFixed(2)),
  ratingCount: 3 + ((i * 13 + 7) % 28),
}))


// ── Adapter: backend Artwork → MarketArtwork ──────────────────────
function adaptArtwork(artwork: Artwork, index: number): MarketArtwork {
  const price  = parseFloat(artwork.current_price)   || 0
  const supply = parseFloat(artwork.current_supply)  || 0
  const target = parseFloat(artwork.target_cap)      || 0
  const mc     = price * supply || price

  const progress = target > 0 ? Math.min((mc / target) * 100, 100) : 0
  const phase: Phase =
    progress >= 90 ? 'Migration' :
    progress >= 50 ? 'FOMO' :
                     'Accumulation'

  // Resolve IPFS image to HTTPS gateway — prefer image_uri (direct), fallback ipfs_metadata_uri
  const rawImg = artwork.image_uri ?? artwork.ipfs_metadata_uri ?? ''
  const image  = rawImg.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${rawImg.replace('ipfs://', '')}`
    : rawImg || '/images/artworks/art1.jpg'

  // Creator display
  const addr = artwork.creator?.wallet_address ?? '0x000000000000'
  const artist =
    artwork.creator?.username ??
    `${addr.slice(0, 5)}…${addr.slice(-3)}`

  return {
    id:             index + 1,   // stable numeric key for Records
    artworkId:      artwork.id,  // real UUID for API calls
    title:          artwork.title,
    ticker:         artwork.ticker ?? `$TKN${index + 1}`,
    artist,
    artistAddr:     `${addr.slice(0, 5)}…${addr.slice(-3)}`,
    phase,
    phaseColor:     PHASE_COLOR[phase],
    marketCap:      mc,
    marketCapLabel: `${mc.toFixed(4)} ETH`,
    change24h:      '—',
    changePositive: true,
    change7d:       '—',
    volume24h:      '—',
    holders:        0,
    progress,
    image,
    description:    artwork.description ?? '',
    sparkline:      Array.from({ length: 10 }, (_, i) => price * (1 + i * 0.1) || 1),
    rating:         null,   // fetched separately in InspectionDeck
    ratingCount:    0,
  }
}

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

// ── Price / percentage formatters ────────────────────────────────
/** Smart ETH formatter: 0.003 → "0.003", 1234.5 → "1.23k", 1.2M → "1.20M" */
function fmtETH(v: number): string {
  if (!isFinite(v) || isNaN(v)) return '—'
  if (v >= 1e9)  return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6)  return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3)  return `${(v / 1e3).toFixed(2)}k`
  if (v >= 100)  return v.toFixed(1)
  if (v >= 10)   return v.toFixed(2)
  return v.toFixed(3)
}
/** Smart % formatter — handles astronomical values gracefully */
function fmtPct(pct: number): string {
  if (!isFinite(pct) || isNaN(pct)) return '—'
  const sign = pct >= 0 ? '+' : ''
  const abs  = Math.abs(pct)
  if (abs >= 1e9) return `${sign}${(pct / 1e9).toFixed(1)}B%`
  if (abs >= 1e6) return `${sign}${(pct / 1e6).toFixed(1)}M%`
  if (abs >= 1e3) return `${sign}${(pct / 1e3).toFixed(1)}k%`
  return `${sign}${pct.toFixed(1)}%`
}

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

// ── Chart time range (re-export CandleRange alias) ────────────────
type TimeRange = '1H' | '6H' | '1D' | '7D'

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
    // Rule: every consecutive Y-jump ≥ 14 units → no segment looks curved.
    // 31 sparse points over 1200px = ~39px/segment → each line visibly straight.
    // First Y = Last Y = 42 ⟹ seamless tile
    const mainPts: [number, number][] = [
      [0,    42],
      [55,   65],  // −23
      [100,  30],  // +35
      [145,  62],  // −32
      [188,  18],  // +44  ← big spike
      [230,  52],  // −34
      [270,  28],  // +24
      [312,  68],  // −40
      [350,  44],  // +24
      [390,  72],  // −28  ← bottom
      [428,  50],  // +22
      [465,  70],  // −20
      [500,  48],  // +22
      [538,  67],  // −19
      [570,  46],  // +21
      [605,  65],  // −19
      [638,  35],  // +30  ← breakout
      [672,  56],  // −21
      [705,  20],  // +36  ← rally spike
      [738,  42],  // −22
      [768,  12],  // +30  ← new high
      [800,  32],  // −20
      [830,  10],  // +22  ← peak
      [862,  30],  // −20
      [898,  52],  // −22  pullback
      [938,  35],  // +17
      [980,  56],  // −21
      [1025, 40],  // +16
      [1075, 58],  // −18
      [1130, 44],  // +14
      [1175, 56],  // −12
      [1200, 42],  // +14  ← = open ⟹ seamless ✓
    ]

    // ── Accent line: white ghost — same rule, different rhythm ────
    // First Y = Last Y = 52 ⟹ seamless tile
    const accentPts: [number, number][] = [
      [0,    52],
      [65,   32],  // +20
      [112,  60],  // −28
      [155,  25],  // +35
      [200,  62],  // −37
      [242,  35],  // +27
      [285,  68],  // −33  ← bottom
      [325,  42],  // +26
      [368,  72],  // −30
      [405,  50],  // +22
      [445,  70],  // −20
      [480,  48],  // +22
      [518,  66],  // −18
      [552,  42],  // +24
      [588,  63],  // −21
      [625,  32],  // +31  ← breakout
      [660,  55],  // −23
      [695,  18],  // +37  ← spike
      [728,  40],  // −22
      [760,  15],  // +25  ← top
      [792,  36],  // −21
      [822,  12],  // +24  ← peak
      [854,  32],  // −20
      [892,  55],  // −23  pullback
      [930,  38],  // +17
      [970,  58],  // −20
      [1015, 42],  // +16
      [1062, 60],  // −18
      [1118, 45],  // +15
      [1165, 58],  // −13
      [1200, 52],  // +6   ← close ≈ open ⟹ seamless ✓
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

// ── Scrolling trade ticker tape — Binance realtime ────────────────
function TickerTape() {
  const { ticks, connected } = useBinanceTicker()

  // Build ordered list: coins that have arrived first, rest padded with skeleton
  const items = TICKER_COINS.map(coin => {
    const t = ticks[coin.symbol]
    return {
      symbol:   coin.symbol,
      name:     coin.name,
      price:    t ? fmtUSD(t.price)     : '…',
      change:   t ? fmtChange(t.change) : '—',
      positive: t ? t.change >= 0       : true,
    }
  })

  return (
    <div
      className="overflow-hidden relative"
      style={{
        height:       28,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   'rgba(0,0,0,0.55)',
      }}
    >
      {/* live indicator */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 pointer-events-none">
        <span
          className="size-[5px] rounded-full"
          style={{
            background: connected ? '#4ade80' : '#f87171',
            boxShadow:  connected ? '0 0 6px #4ade80' : 'none',
            animation:  connected ? 'pulse 1.4s ease-in-out infinite' : 'none',
          }}
        />
        <span className="font-mono text-[7px] tracking-widest"
          style={{ color: connected ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)' }}>
          {connected ? 'LIVE' : 'CONNECTING'}
        </span>
      </div>

      {/* scrolling strip */}
      <motion.div
        className="flex items-center h-full pl-20"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 80, ease: 'linear', repeat: Infinity, repeatType: 'loop' as const }}
        style={{ width: 'max-content', willChange: 'transform' }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-5 h-full shrink-0"
            style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}
          >
            {/* Symbol */}
            <span className="font-mono text-[8px] font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              {item.symbol}
            </span>
            {/* Price */}
            <span className="font-mono text-[8.5px]"
              style={{ color: 'rgba(255,255,255,0.85)' }}>
              {item.price}
            </span>
            {/* % change */}
            <span className="font-mono text-[8px] font-semibold"
              style={{ color: item.positive ? '#4ade80' : '#f87171' }}>
              {item.change}
            </span>
            {/* dot separator */}
            <span className="size-[4px] rounded-full shrink-0 opacity-30"
              style={{ background: item.positive ? '#4ade80' : '#f87171' }}/>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ── Convert RecentTrade → LiveTrade ────────────────────────────────
function adaptRecentTrade(t: RecentTrade, idx: number): LiveTrade {
  const rawImg = t.artwork.image_uri ?? t.artwork.ipfs_metadata_uri ?? ''
  const image  = rawImg.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${rawImg.replace('ipfs://', '')}`
    : rawImg || '/images/artworks/art1.jpg'
  const ticker = t.artwork.ticker ? `$${t.artwork.ticker}` : `$TKN${idx + 1}`
  // Use a neutral phase color since we don't have phase info in RecentTrade
  const art: MarketArtwork = {
    id: idx + 1, artworkId: t.artwork.id, title: t.artwork.title, ticker,
    artist: '', artistAddr: '', phase: 'Accumulation',
    phaseColor: PHASE_COLOR['Accumulation'], marketCap: 0, marketCapLabel: '',
    change24h: '', changePositive: true, change7d: '', volume24h: '',
    holders: 0, progress: 0, image, description: '', sparkline: [],
    rating: null, ratingCount: 0,
  }
  const addr = t.user.wallet_address
  return {
    id:        Date.now() + idx,
    art,
    addr:      `${addr.slice(0, 5)}…${addr.slice(-3)}`,
    action:    t.tx_type === 'BUY' ? 'bought' : 'collected',
    ethAmount: parseFloat(t.eth_amount).toFixed(3),
  }
}

// ── Live activity feed (placed below list items) ──────────────────
function ActivityFeed() {
  const [trades, setTrades] = useState<LiveTrade[]>(() =>
    [0, 1, 2, 3, 4].map(i => ({
      id:        i,
      art:       ARTWORKS_MOCK[i % ARTWORKS_MOCK.length],
      addr:      FAKE_WALLETS[i % FAKE_WALLETS.length],
      action:    (i % 3 === 0 ? 'collected' : 'bought') as LiveTrade['action'],
      ethAmount: (0.12 + (i % 5) * 0.28).toFixed(2),
    }))
  )
  const counterRef = useRef(10)

  // Fetch real recent trades on mount, poll every 15s
  useEffect(() => {
    let alive = true
    const load = () => {
      tradeService.recent(10).then(data => {
        if (alive && data.length > 0) {
          setTrades(data.map(adaptRecentTrade))
        }
      }).catch(() => { /* keep mock */ })
    }
    load()
    const poll = setInterval(load, 15_000)
    return () => { alive = false; clearInterval(poll) }
  }, [])

  // Keep simulated activity when API returns no data
  useEffect(() => {
    const timer = setInterval(() => {
      const c = counterRef.current++
      setTrades(prev => {
        // Only inject fake rows if we're still on mock data (no artworkId)
        if (prev.length > 0 && prev[0].art.artworkId !== '') return prev
        return [{
          id:        Date.now() + c,
          art:       ARTWORKS_MOCK[c % ARTWORKS_MOCK.length],
          addr:      FAKE_WALLETS[c % FAKE_WALLETS.length],
          action:    (c % 3 === 0 ? 'collected' : 'bought') as LiveTrade['action'],
          ethAmount: (0.12 + (c % 5) * 0.28).toFixed(2),
        }, ...prev.slice(0, 6)]
      })
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
  livePrice,
}: {
  art:       MarketArtwork
  livePrice: number
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
            {fmtETH(livePrice)} ETH
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

// ── Tiny pure-SVG sparkline — used when chart is collapsed (h ≤ 60) ──
//  No ApexCharts overhead; instant render with a glow line + end dot.
function MiniSparkline({ art, height }: { art: MarketArtwork; height: number }) {
  const W = 800
  const { d, areaD, last } = buildSparkPath(art.sparkline, W, height, 4, 4, 8, 4)
  const gid = `ms-${art.id}`
  const fid = `msf-${art.id}`
  return (
    <div
      className="relative w-full overflow-hidden rounded-sm"
      style={{
        height,
        background: 'rgba(0,0,0,0.55)',
        border:     '1px solid rgba(255,255,255,0.07)',
        transition: 'height 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={art.phaseColor} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={art.phaseColor} stopOpacity="0"/>
          </linearGradient>
          <filter id={fid} x="-10%" y="-80%" width="120%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d={areaD} fill={`url(#${gid})`}/>
        <path d={d} fill="none" stroke={art.phaseColor}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#${fid})`}/>
        <circle cx={last.x} cy={last.y} r="4"
          fill={art.phaseColor} opacity="0.3" filter={`url(#${fid})`}/>
        <circle cx={last.x} cy={last.y} r="2.5" fill={art.phaseColor}/>
        <circle cx={last.x} cy={last.y} r="1.4" fill="white"/>
      </svg>
      {/* Current price label */}
      <span
        className="absolute left-2 top-1 font-mono text-[7px] tracking-widest"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        PRICE HISTORY
      </span>
    </div>
  )
}

// ── Bonding curve chart — candlestick via ApexCharts (full) ──────
//  Falls back to pure-SVG MiniSparkline when height ≤ 60 to avoid
//  a half-rendered ApexCharts instance in the collapsed state.
function BondingCurveChart({
  art, range, height = 160,
}: {
  art: MarketArtwork; range: TimeRange; height?: number
}) {
  if (height <= 60) return <MiniSparkline art={art} height={height} />
  return (
    <CandlestickChart
      artId={art.id}
      sparkline={art.sparkline}
      phaseColor={art.phaseColor}
      range={range}
      height={height}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
//  RACE VIEW  ── "Leo tháp hạ tháp" live ranking visualization
//
//  Layout:
//    ┌─ RankTimeline (172px) ──────────────────────────────────────┐
//    │  Y-axis = rank position (1 at top, N at bottom)             │
//    │  Lines show each artwork climbing/falling over last 40 pts  │
//    │  Lines spread across full height → always readable          │
//    └─────────────────────────────────────────────────────────────┘
//    ┌─ Race Bars (scrollable) ────────────────────────────────────┐
//    │  #1 [img] Title   ████████████████  813 ETH  +154%          │
//    │     motion.div layout + spring → smooth rank reorder        │
//    └─────────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────

// ── Rank-position timeline ────────────────────────────────────────
//  Derives rank at each historical snapshot from priceHistory.
//  Y-axis: rank 1 (top) → rank N (bottom). Lines always spread
//  across the full chart height regardless of price magnitude.
//  onExpand: optional callback to open fullscreen overlay.
// ── Shared rank-history data builder (used by both inline + fullscreen) ──
function useRankTraces(
  artworks:     MarketArtwork[],
  priceHistory: Record<number, number[]>,
) {
  return useMemo(() => {
    const lengths = artworks.map(a => (priceHistory[a.id] ?? []).length)
    const ticks   = Math.max(...lengths, 1)
    const rankAt: Record<number, number[]> = {}
    for (const art of artworks) rankAt[art.id] = []
    for (let t = 0; t < ticks; t++) {
      const prices = artworks.map(art => {
        const hist = priceHistory[art.id] ?? []
        return { id: art.id, p: hist[t] ?? hist[hist.length - 1] ?? art.marketCap }
      })
      prices.sort((a, b) => b.p - a.p)
      prices.forEach((item, idx) => { rankAt[item.id].push(idx + 1) })
    }
    const traces = artworks.map(art => ({ art, ranks: rankAt[art.id] ?? [1] }))
    return { traces, ticks }
  }, [artworks, priceHistory])
}

// ── SVG chart body — pure, no header chrome ──────────────────────
// ── SVG-only lines (no circles — avoids preserveAspectRatio distortion) ──
//  svgH must equal the container's actual pixel height so viewBox matches.
function RankTimelineSVG({
  traces, ticks, N, highlightIds, svgH,
}: {
  traces:        { art: MarketArtwork; ranks: number[] }[]
  ticks:         number
  N:             number
  highlightIds?: number[]
  svgH:          number
}) {
  const W   = 1000
  const H   = svgH
  const PAD = { t: 14, r: 8, b: 14, l: 38 }
  const pw  = W - PAD.l - PAD.r
  const ph  = H - PAD.t - PAD.b
  const hasHighlight = !!highlightIds?.length
  const isHighlighted = (id: number) => !!(highlightIds?.includes(id))

  const toXY = (t: number, rank: number) => ({
    x: PAD.l + (ticks < 2 ? pw : (t / (ticks - 1)) * pw),
    y: PAD.t + ((rank - 1) / Math.max(N - 1, 1)) * ph,
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      className="w-full h-full" style={{ overflow: 'visible' }} aria-hidden>

      {Array.from({ length: N }, (_, i) => {
        const { y } = toXY(0, i + 1)
        const isGold = i === 0
        return (
          <line key={i} x1={PAD.l} x2={PAD.l + pw} y1={y} y2={y}
            stroke={isGold ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.035)'}
            strokeWidth={isGold ? 1.5 : 1}
            strokeDasharray={isGold ? undefined : '2 6'}
          />
        )
      })}

      {[...traces].reverse().map(({ art, ranks }) => {
        if (ranks.length < 2) return null
        const isHigh = isHighlighted(art.id)
        const isTop  = ranks[ranks.length - 1] === 1
        const faded  = hasHighlight && !isHigh

        const d = ranks.map((r, t) => {
          const { x, y } = toXY(t, r)
          return `${t === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ')
        const { x: ex, y: ey } = toXY(ranks.length - 1, ranks[ranks.length - 1])

        return (
          <g key={art.id} opacity={faded ? 0.1 : 1}
            style={{ transition: 'opacity 0.25s ease' }}>
            {(isTop || isHigh) && (
              <path d={d} fill="none" stroke={art.phaseColor}
                strokeWidth={isHigh ? 10 : 7} strokeOpacity="0.12" strokeLinejoin="round"/>
            )}
            <path d={d} fill="none" stroke={art.phaseColor}
              strokeWidth={isHigh ? 3.5 : isTop ? 2.4 : 1.5}
              strokeOpacity={(isHigh || isTop) ? 1 : 0.6}
              strokeLinejoin="round" strokeLinecap="round"
            />
            <circle cx={ex} cy={ey} r="5" fill={art.phaseColor} opacity="0.18"/>
            <circle cx={ex} cy={ey} r={(isHigh || isTop) ? 3.5 : 2.5}
              fill={art.phaseColor} opacity={(isHigh || isTop) ? 1 : 0.8}/>
          </g>
        )
      })}
    </svg>
  )
}

// ── HTML avatar column — plain DOM elements, zero distortion ─────
//  Positioned absolutely on the right side of the chart container.
//  Each artwork's thumbnail sits exactly at its current rank lane.
function RankAvatarColumn({
  traces, N, svgH, highlightIds, avatarSize = 20,
}: {
  traces:        { art: MarketArtwork; ranks: number[] }[]
  N:             number
  svgH:          number
  highlightIds?: number[]
  avatarSize?:   number
}) {
  const PAD_T = 14, PAD_B = 14
  const ph    = svgH - PAD_T - PAD_B
  const hasHighlight = !!highlightIds?.length

  return (
    <div className="absolute top-0 right-0 bottom-0 pointer-events-none"
      style={{ width: avatarSize + 8 }}>
      {traces.map(({ art, ranks }) => {
        const curRank = ranks[ranks.length - 1]
        const yPx     = PAD_T + ((curRank - 1) / Math.max(N - 1, 1)) * ph
        const isHigh  = !!(highlightIds?.includes(art.id))
        const isTop   = curRank === 1
        const faded   = hasHighlight && !isHigh
        const size    = (isHigh || isTop) ? avatarSize + 4 : avatarSize

        return (
          <div
            key={art.id}
            className="absolute overflow-hidden"
            style={{
              width:     size,
              height:    size,
              borderRadius: '50%',
              top:       yPx,
              right:     4,
              transform: 'translateY(-50%)',
              border:    `${(isHigh || isTop) ? 2 : 1}px solid ${faded ? 'rgba(255,255,255,0.1)' : art.phaseColor}`,
              opacity:   faded ? 0.1 : 1,
              transition: 'opacity 0.25s ease, width 0.2s ease, height 0.2s ease',
              background: '#111',
              boxShadow:  (isHigh || isTop) ? `0 0 8px ${art.phaseColor}60` : 'none',
              zIndex:     isHigh ? 10 : isTop ? 5 : 1,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.image} alt={art.title}
              className="w-full h-full object-cover" draggable={false}/>
          </div>
        )
      })}
    </div>
  )
}

// ── Inline rank timeline (compact, in race view) ──────────────────
function RankTimeline({
  artworks, priceHistory, height = 240, onExpand,
}: {
  artworks:     MarketArtwork[]
  priceHistory: Record<number, number[]>
  height?:      number
  onExpand?:    () => void
}) {
  const { traces, ticks } = useRankTraces(artworks, priceHistory)
  const N      = artworks.length
  const TOPBAR = 22
  const svgH   = height - TOPBAR  // must match SVG container height

  return (
    <div className="w-full shrink-0"
      style={{ height, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Topbar: fully isolated from SVG, can never be overlapped ── */}
      <div className="flex items-center justify-between px-3"
        style={{ height: TOPBAR, background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="font-mono text-[7px] tracking-[0.18em] uppercase"
          style={{ color: 'rgba(255,255,255,0.22)' }}>
          RANK HISTORY · {ticks} pts
        </span>
        {onExpand && (
          <button type="button" onClick={onExpand}
            className="flex items-center gap-1 font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5"
            style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#D4AF37'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)'
              e.currentTarget.style.background = 'rgba(212,175,55,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.background = 'transparent'
            }}>
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            EXPAND
          </button>
        )}
      </div>

      {/* ── Chart body: SVG lines + HTML avatar column ── */}
      <div className="relative" style={{ height: svgH, background: 'rgba(0,0,0,0.18)' }}>
        {/* Y-axis rank labels */}
        <div className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
          style={{ left: 5, paddingTop: 14, paddingBottom: 14, zIndex: 2 }}>
          {Array.from({ length: N }, (_, i) => (
            <span key={i} className="font-mono leading-none"
              style={{ fontSize: Math.max(6, Math.min(8, svgH / N - 1)), color: i === 0 ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.14)' }}>
              {i + 1}
            </span>
          ))}
        </div>
        {/* SVG: lines only */}
        <RankTimelineSVG traces={traces} ticks={ticks} N={N} svgH={svgH} />
        {/* HTML avatars: zero distortion */}
        <RankAvatarColumn traces={traces} N={N} svgH={svgH} avatarSize={18} />
      </div>
    </div>
  )
}

// ── Fullscreen rank timeline overlay ─────────────────────────────
//  Click any artwork card → highlights its line + shows its chart
function RankTimelineFullscreen({
  artworks,
  priceHistory,
  livePrices,
  onClose,
}: {
  artworks:     MarketArtwork[]
  priceHistory: Record<number, number[]>
  livePrices:   Record<number, number>
  onClose:      () => void
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [chartRange,  setChartRange]  = useState<TimeRange>('1D')
  const [svgH,        setSvgH]        = useState(400)
  const chartRef = useRef<HTMLDivElement>(null)

  // Artwork hiển thị ở right panel = cái được chọn gần nhất
  const selectedArt = artworks.find(a => a.id === selectedIds[selectedIds.length - 1]) ?? null

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  // Measure chart container height for correct SVG viewBox
  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setSvgH(entry.contentRect.height || 400)
    })
    ro.observe(el)
    setSvgH(el.clientHeight || 400)
    return () => ro.disconnect()
  }, [])

  const { traces, ticks } = useRankTraces(artworks, priceHistory)
  const N = artworks.length

  // Ranked by current live price
  const ranked = useMemo(
    () => [...artworks].sort((a, b) =>
      (livePrices[b.id] ?? b.marketCap) - (livePrices[a.id] ?? a.marketCap)
    ),
    [artworks, livePrices],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[90] flex flex-col"
      style={{ background: 'rgba(4,4,4,0.97)', backdropFilter: 'blur(18px)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ height: 48, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none"
            stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span className="font-mono text-[10px] tracking-[0.26em] uppercase"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            RANK HISTORY
          </span>
          <span className="flex items-center gap-1.5 ml-1">
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }}/>
            <span className="font-mono text-[8px] tracking-widest" style={{ color: '#4ade80' }}>LIVE</span>
          </span>
          {selectedIds.length === 1 && selectedArt && (
            <span className="flex items-center gap-1.5 ml-3">
              <span className="size-2 rounded-full" style={{ background: selectedArt.phaseColor }}/>
              <span className="font-mono text-[9px] tracking-wide" style={{ color: selectedArt.phaseColor }}>
                {selectedArt.ticker}
              </span>
              <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {selectedArt.title}
              </span>
            </span>
          )}
          {selectedIds.length > 1 && (
            <span className="flex items-center gap-1.5 ml-3">
              <span className="font-mono text-[9px] px-2 py-0.5"
                style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                {selectedIds.length} SELECTED
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button type="button" onClick={() => setSelectedIds([])}
              className="font-mono text-[8px] tracking-widest uppercase px-2 py-1 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              Clear {selectedIds.length > 1 ? `(${selectedIds.length})` : ''}
            </button>
          )}
          <button type="button" onClick={onClose}
            className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase
                       px-3 py-1.5 transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}>
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            ESC
          </button>
        </div>
      </div>

      {/* ── Main area: chart left, detail panel right ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left: rank timeline + legend */}
        <div
          className="flex flex-col min-h-0"
          style={{ width: selectedArt ? '55%' : '100%', transition: 'width 0.3s ease', borderRight: selectedArt ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        >
          {/* SVG chart — fills available height */}
          <div ref={chartRef} className="flex-1 min-h-0 relative" style={{ background: 'rgba(0,0,0,0.15)' }}>
            {/* Y-axis labels */}
            <div className="absolute top-0 bottom-0 flex flex-col justify-between py-4 pointer-events-none"
              style={{ left: 6, zIndex: 1 }}>
              {Array.from({ length: N }, (_, i) => (
                <span key={i} className="font-mono text-[8px] leading-none"
                  style={{ color: i === 0 ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.14)' }}>
                  #{i + 1}
                </span>
              ))}
            </div>
            <RankTimelineSVG traces={traces} ticks={ticks} N={N} highlightIds={selectedIds} svgH={svgH} />
            <RankAvatarColumn traces={traces} N={N} svgH={svgH} highlightIds={selectedIds} avatarSize={22} />
          </div>

          {/* Legend grid — scrollable */}
          <div
            className="shrink-0 overflow-y-auto p-3"
            style={{
              maxHeight: 220,
              background: 'rgba(0,0,0,0.3)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.08) transparent',
            }}
          >
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {ranked.map((art, idx) => {
                const lp     = livePrices[art.id] ?? art.marketCap
                const delta  = ((lp - art.marketCap) / art.marketCap) * 100
                const up     = delta >= 0
                const active = selectedIds.includes(art.id)
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      setSelectedIds(prev =>
                        prev.includes(art.id)
                          ? prev.filter(id => id !== art.id)
                          : [...prev, art.id]
                      )
                      setChartRange('1D')
                    }}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-left w-full transition-colors duration-150"
                    style={{
                      background: active
                        ? `${art.phaseColor}12`
                        : idx === 0 ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? art.phaseColor + '50' : idx === 0 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <span className="font-mono text-[9px] w-5 shrink-0 text-right"
                      style={{ color: idx < 3 ? '#D4AF37' : 'rgba(255,255,255,0.22)' }}>
                      #{idx + 1}
                    </span>
                    <span className="size-2 rounded-full shrink-0" style={{ background: art.phaseColor }}/>
                    <div className="w-7 h-7 shrink-0 overflow-hidden rounded-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={art.image} alt="" className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] font-light truncate leading-snug"
                        style={{ fontFamily: "'Cormorant Garamond', serif", color: active ? '#fff' : 'rgba(255,255,255,0.8)' }}>
                        {art.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {fmtETH(lp)} ETH
                        </span>
                        <span className="font-mono text-[7.5px]" style={{ color: up ? '#4ade80' : '#f87171' }}>
                          {fmtPct(delta)}
                        </span>
                      </div>
                    </div>
                    {/* Chart icon hint */}
                    <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0 opacity-30" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </button>
                )
              })}
            </div>
            <p className="font-mono text-[7px] mt-2 tracking-[0.14em] uppercase text-center"
              style={{ color: 'rgba(255,255,255,0.1)' }}>
              Click an artwork to view its price chart · ESC to close
            </p>
          </div>
        </div>

        {/* Right panel — single view OR comparison view */}
        <AnimatePresence mode="wait">
          {selectedIds.length === 1 && selectedArt && (
            /* ── SINGLE VIEW ─────────────────────────────────────── */
            <motion.div
              key="single"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col"
              style={{ width: '45%', background: '#0A0A0A', minHeight: 0 }}
            >
              <div className="px-6 pt-5 pb-4 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-0.5"
                    style={{ background: `${selectedArt.phaseColor}15`, border: `1px solid ${selectedArt.phaseColor}35`, color: selectedArt.phaseColor }}>
                    {selectedArt.phase}
                  </span>
                  <span className="font-mono text-[9px] tracking-wide" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {selectedArt.ticker}
                  </span>
                </div>
                <h3 className="font-light leading-tight mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.45rem', color: '#FDFBF7' }}>
                  {selectedArt.title}
                </h3>
                <p className="text-[9.5px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {selectedArt.artist}
                </p>
              </div>
              <div className="flex items-center gap-6 px-6 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {(() => {
                  const lp = livePrices[selectedArt.id] ?? selectedArt.marketCap
                  const delta = ((lp - selectedArt.marketCap) / selectedArt.marketCap) * 100
                  const up = delta >= 0
                  return (<>
                    <div>
                      <p className="font-mono text-[7.5px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Live Price</p>
                      <p className="font-mono text-[1.4rem] leading-none" style={{ color: '#FDFBF7' }}>
                        {fmtETH(lp)} <span className="text-[0.85rem] opacity-50">ETH</span>
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[7.5px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>vs Seed</p>
                      <p className="font-mono text-[1.1rem] leading-none" style={{ color: up ? '#4ade80' : '#f87171' }}>{fmtPct(delta)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[7.5px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Holders</p>
                      <p className="font-mono text-[1.1rem] leading-none" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedArt.holders}</p>
                    </div>
                  </>)
                })()}
              </div>
              <div className="flex items-center gap-1.5 px-6 pt-4 pb-2 shrink-0">
                {(['1H', '6H', '1D', '7D'] as TimeRange[]).map(r => (
                  <button key={r} type="button" onClick={() => setChartRange(r)}
                    className="font-mono text-[8px] px-2.5 py-1 transition-colors duration-150"
                    style={{ color: chartRange === r ? '#D4AF37' : 'rgba(255,255,255,0.3)', background: chartRange === r ? 'rgba(212,175,55,0.1)' : 'transparent', border: `1px solid ${chartRange === r ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                    {r}
                  </button>
                ))}
                <span className="font-mono text-[7.5px] ml-auto tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Bonding Curve</span>
              </div>
              <div className="flex-1 min-h-0 px-4 pb-4">
                <BondingCurveChart art={selectedArt} range={chartRange} height={220}/>
              </div>
              <div className="px-6 pb-5 shrink-0">
                <p className="text-[11.5px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.38)', maxWidth: '44ch' }}>
                  {selectedArt.description}
                </p>
                <Link
                  href={`/artwork/${selectedArt.artworkId || `mock-${selectedArt.id}`}`}
                  onClick={() => {
                    const payload: StoredArtwork = {
                      id:             selectedArt.id,
                      artworkId:      selectedArt.artworkId,
                      title:          selectedArt.title,
                      ticker:         selectedArt.ticker,
                      artist:         selectedArt.artist,
                      phase:          selectedArt.phase,
                      phaseColor:     selectedArt.phaseColor,
                      marketCap:      selectedArt.marketCap,
                      marketCapLabel: selectedArt.marketCapLabel,
                      change24h:      selectedArt.change24h,
                      changePositive: selectedArt.changePositive,
                      progress:       selectedArt.progress,
                      image:          selectedArt.image,
                      description:    selectedArt.description,
                      volume24h:      selectedArt.volume24h,
                      holders:        selectedArt.holders,
                    }
                    sessionStorage.setItem('artcurve_detail', JSON.stringify(payload))
                  }}
                  className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] uppercase
                             px-4 py-2.5 transition-all duration-150"
                  style={{
                    border:     '1px solid rgba(212,175,55,0.35)',
                    color:      '#D4AF37',
                    background: 'rgba(212,175,55,0.05)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(212,175,55,0.12)'
                    el.style.borderColor = 'rgba(212,175,55,0.6)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(212,175,55,0.05)'
                    el.style.borderColor = 'rgba(212,175,55,0.35)'
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  View Full Detail &amp; Reviews
                </Link>
              </div>
            </motion.div>
          )}

          {selectedIds.length > 1 && (
            /* ── COMPARISON VIEW ─────────────────────────────────── */
            <motion.div
              key="compare"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col overflow-hidden"
              style={{ width: '45%', background: '#0A0A0A', minHeight: 0 }}
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-4 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-mono text-[8px] tracking-[0.22em] uppercase mb-1.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>Comparing</p>
                <h3 className="font-light"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem', color: '#FDFBF7' }}>
                  {selectedIds.length} Artworks
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {artworks.filter(a => selectedIds.includes(a.id)).map(a => (
                    <button key={a.id} type="button"
                      onClick={() => setSelectedIds(prev => prev.filter(id => id !== a.id))}
                      className="flex items-center gap-1 font-mono text-[8px] px-1.5 py-0.5 transition-opacity hover:opacity-70"
                      style={{ background: `${a.phaseColor}14`, border: `1px solid ${a.phaseColor}50`, color: a.phaseColor }}>
                      {a.ticker} <span className="opacity-50 ml-0.5">×</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison table */}
              <div className="flex-1 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                {/* Table header */}
                <div className="grid px-5 py-2 font-mono text-[7.5px] tracking-[0.16em] uppercase sticky top-0"
                  style={{ gridTemplateColumns: '1fr 70px 70px 44px', background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.22)' }}>
                  <span>Artwork</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">vs Seed</span>
                  <span className="text-right">Rank</span>
                </div>

                {/* Rows — sorted by live price desc */}
                {artworks
                  .filter(a => selectedIds.includes(a.id))
                  .sort((a, b) => (livePrices[b.id] ?? b.marketCap) - (livePrices[a.id] ?? a.marketCap))
                  .map((art, idx) => {
                    const lp    = livePrices[art.id] ?? art.marketCap
                    const delta = ((lp - art.marketCap) / art.marketCap) * 100
                    const up    = delta >= 0
                    const spark = art.sparkline ?? []
                    // mini sparkline path
                    const sparkPath = (() => {
                      if (spark.length < 2) return ''
                      const min = Math.min(...spark), max = Math.max(...spark)
                      const range = max - min || 1
                      const W = 48, H = 20
                      return spark.map((v, i) => {
                        const x = (i / (spark.length - 1)) * W
                        const y = H - ((v - min) / range) * H
                        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
                      }).join(' ')
                    })()

                    return (
                      <div key={art.id}
                        className="grid items-center px-5 py-3.5 transition-colors duration-100 cursor-pointer"
                        style={{
                          gridTemplateColumns: '1fr 70px 70px 44px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: idx === 0 ? 'rgba(212,175,55,0.03)' : 'transparent',
                        }}
                        onClick={() => setSelectedIds([art.id])}
                      >
                        {/* Artwork info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 shrink-0 overflow-hidden rounded-sm"
                            style={{ border: `1px solid ${art.phaseColor}40` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={art.image} alt="" className="w-full h-full object-cover"/>
                          </div>
                          <div className="min-w-0">
                            <p className="font-light text-[11px] truncate leading-tight"
                              style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FDFBF7' }}>
                              {art.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="size-1.5 rounded-full shrink-0" style={{ background: art.phaseColor }}/>
                              <span className="font-mono text-[7.5px]" style={{ color: art.phaseColor }}>{art.ticker}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price + mini spark */}
                        <div className="text-right">
                          <p className="font-mono text-[11px] leading-none" style={{ color: '#FDFBF7' }}>{fmtETH(lp)}</p>
                          {sparkPath && (
                            <svg viewBox="0 0 48 20" className="w-12 h-5 ml-auto mt-1" style={{ overflow: 'visible' }}>
                              <path d={sparkPath} fill="none" stroke={up ? '#4ade80' : '#f87171'}
                                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                            </svg>
                          )}
                        </div>

                        {/* % change */}
                        <div className="text-right">
                          <p className="font-mono text-[11px] leading-none font-medium"
                            style={{ color: up ? '#4ade80' : '#f87171' }}>
                            {fmtPct(delta)}
                          </p>
                          <p className="font-mono text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
                            {art.holders} holders
                          </p>
                        </div>

                        {/* Current rank */}
                        <div className="text-right">
                          <p className="font-mono text-[13px] leading-none"
                            style={{ color: idx === 0 ? '#D4AF37' : 'rgba(255,255,255,0.35)' }}>
                            #{ranked.findIndex(r => r.id === art.id) + 1}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-center"
                  style={{ color: 'rgba(255,255,255,0.14)' }}>
                  Click a row to view single chart · Click ticker tag to remove
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Single race bar ────────────────────────────────────────────────
function RaceBar({
  art, rank, barPct, livePrice, isFlashing, isSelected, onClick,
}: {
  art:        MarketArtwork
  rank:       number
  barPct:     number     // 0-100, % of max price
  livePrice:  number
  isFlashing: boolean
  isSelected: boolean
  onClick:    () => void
}) {
  const liveDelta = ((livePrice - art.marketCap) / art.marketCap) * 100
  const liveUp    = liveDelta >= 0
  const deltaStr  = fmtPct(liveDelta)

  return (
    <motion.div
      layout
      transition={{ layout: { type: 'spring', stiffness: 400, damping: 36 } }}
      onClick={onClick}
      aria-pressed={isSelected}
      className="flex items-center gap-3 px-4 cursor-pointer"
      style={{
        height:     54,
        background: isFlashing
          ? (liveUp ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)')
          : isSelected
            ? 'rgba(255,255,255,0.035)'
            : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.045)',
        transition:   `background ${isFlashing ? '0.6s' : '0.15s'} ease`,
      }}
    >
      {/* Rank number */}
      <span
        className="font-mono text-[11px] w-5 shrink-0 text-right"
        style={{ color: rank <= 3 ? '#D4AF37' : 'rgba(255,255,255,0.22)' }}
      >
        {rank}
      </span>

      {/* Phase accent bar (3px left, like ArtCard) */}
      <span className="h-8 w-[2px] shrink-0 rounded-full"
        style={{ background: art.phaseColor, opacity: 0.7 }}/>

      {/* Thumbnail */}
      <div className="w-8 h-8 shrink-0 overflow-hidden rounded-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.image} alt={art.title}
          className="w-full h-full object-cover" draggable={false}/>
      </div>

      {/* Name + ticker */}
      <div className="w-36 shrink-0">
        <p className="text-[11px] font-light leading-snug truncate"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FDFBF7' }}>
          {art.title}
        </p>
        <p className="font-mono text-[8px] tracking-wide mt-0.5"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          {art.ticker}
        </p>
      </div>

      {/* Progress bar — animated width */}
      <div className="flex-1 flex items-center gap-2.5">
        <div
          className="h-[4px] flex-1 overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${barPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{
              background: `linear-gradient(90deg, ${art.phaseColor}55, ${art.phaseColor})`,
            }}
          />
        </div>

        {/* Live price */}
        <span
          className="font-mono text-[10.5px] whitespace-nowrap shrink-0"
          style={{ color: 'rgba(255,255,255,0.8)', minWidth: 80, textAlign: 'right' }}
        >
          {fmtETH(livePrice)} ETH
        </span>

        {/* % change */}
        <span
          className="font-mono text-[9.5px] shrink-0"
          style={{
            color:    liveUp ? '#4ade80' : '#f87171',
            minWidth: 62,
            textAlign: 'right',
          }}
        >
          {deltaStr}
        </span>
      </div>
    </motion.div>
  )
}

// ── Race view container ────────────────────────────────────────────
function RaceView({
  artworks,
  livePrices,
  flashId,
  priceHistory,
  selectedId,
  onSelect,
}: {
  artworks:     MarketArtwork[]
  livePrices:   Record<number, number>
  flashId:      number | null
  priceHistory: Record<number, number[]>
  selectedId:   number
  onSelect:     (art: MarketArtwork) => void
}) {
  const [chartFullscreen, setChartFullscreen] = useState(false)

  const sorted = useMemo(
    () => [...artworks].sort((a, b) =>
      (livePrices[b.id] ?? b.marketCap) - (livePrices[a.id] ?? a.marketCap)
    ),
    [artworks, livePrices],
  )

  const maxPrice = livePrices[sorted[0]?.id] ?? sorted[0]?.marketCap ?? 1

  return (
    <div className="flex flex-col w-full" style={{ minHeight: 0 }}>
      {/* ── Rank-position timeline ── */}
      <RankTimeline
        artworks={artworks}
        priceHistory={priceHistory}
        onExpand={() => setChartFullscreen(true)}
      />

      {/* ── Fullscreen overlay ── */}
      <AnimatePresence>
        {chartFullscreen && (
          <RankTimelineFullscreen
            key="rt-fullscreen"
            artworks={artworks}
            priceHistory={priceHistory}
            livePrices={livePrices}
            onClose={() => setChartFullscreen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Race bars ── */}
      <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(212,175,55,0.12) transparent' }}>
        <LayoutGroup id="race-bars">
          {sorted.map((art, idx) => (
            <RaceBar
              key={art.id}
              art={art}
              rank={idx + 1}
              barPct={((livePrices[art.id] ?? art.marketCap) / maxPrice) * 100}
              livePrice={livePrices[art.id] ?? art.marketCap}
              isFlashing={flashId === art.id}
              isSelected={selectedId === art.id}
              onClick={() => onSelect(art)}
            />
          ))}
        </LayoutGroup>
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
  const liveDelta    = ((livePrice - art.marketCap) / art.marketCap) * 100
  const liveUp       = liveDelta >= 0
  const liveDeltaStr = fmtPct(liveDelta)

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
          {fmtETH(livePrice)} ETH
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
function StarRating({ value, count }: { value: number | null; count: number }) {
  const uid     = `star-${value != null ? Math.round(value * 100) : 'none'}`
  const full    = value != null ? Math.floor(value) : 0
  const partial = value != null ? value - full : 0

  return (
    <div className="flex items-center gap-2">
      {/* 5 stars — all grey when no rating */}
      <svg width={5 * 14 + 4 * 2} height={13} viewBox={`0 0 ${5 * 14 + 4 * 2} 13`} fill="none">
        <defs>
          {partial > 0 && (
            <linearGradient id={uid} x1="0" x2="1" y1="0" y2="0">
              <stop offset={`${(partial * 100).toFixed(0)}%`} stopColor="#D4AF37"/>
              <stop offset={`${(partial * 100).toFixed(0)}%`} stopColor="rgba(255,255,255,0.12)"/>
            </linearGradient>
          )}
        </defs>
        {Array.from({ length: 5 }, (_, i) => {
          const x    = i * 16
          const fill = value == null
            ? 'rgba(255,255,255,0.12)'
            : i < full
              ? '#D4AF37'
              : i === full && partial > 0
                ? `url(#${uid})`
                : 'rgba(255,255,255,0.12)'
          return (
            <path
              key={i}
              transform={`translate(${x}, 0)`}
              d="M7 0.5l1.545 3.131 3.455.502-2.5 2.437.59 3.43L7 8.25l-3.09 1.25.59-3.43L2 3.633l3.455-.502L7 .5z"
              fill={fill}
            />
          )
        })}
      </svg>

      {/* Numeric — show "—" when no reviews yet */}
      {value != null ? (
        <>
          <span className="font-mono text-[13px] font-medium" style={{ color: '#D4AF37' }}>
            {value.toFixed(2)}
          </span>
          <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            ({count} {count === 1 ? 'review' : 'reviews'})
          </span>
        </>
      ) : (
        <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          No reviews yet
        </span>
      )}
    </div>
  )
}

function InspectionDeck({
  art,
  livePrice,
  onCollect,
  onLightbox,
}: {
  art:        MarketArtwork
  livePrice:  number
  onCollect:  (art: MarketArtwork) => void
  onLightbox: (art: MarketArtwork) => void
}) {
  const [chartRange,   setChartRange]   = useState<TimeRange>('1D')
  const [chartHovered, setChartHovered] = useState(false)
  const [tilt,         setTilt]         = useState({ rx: 0, ry: 0 })
  const [avgRating,    setAvgRating]    = useState<number | null>(art.rating ?? null)
  const [ratingCount,  setRatingCount]  = useState(art.ratingCount ?? 0)

  // Reset state when artwork changes
  useEffect(() => {
    setChartRange('1D')
    setChartHovered(false)
    setTilt({ rx: 0, ry: 0 })
    // Seed immediately from art object (mock rating or null for real artworks)
    setAvgRating(art.rating ?? null)
    setRatingCount(art.ratingCount ?? 0)
  }, [art.id, art.rating, art.ratingCount])

  // Fetch avg_rating from social stats
  useEffect(() => {
    if (!art.artworkId || art.artworkId === '') return
    let alive = true
    fetch(`${(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '')}/social/stats/${art.artworkId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!alive || !data) return
        const raw = data?.data ?? data   // handle TransformInterceptor wrapper
        if (raw?.avg_rating != null) setAvgRating(parseFloat(raw.avg_rating.toFixed(2)))
        if (raw?.comment_count != null) setRatingCount(raw.comment_count)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [art.artworkId])

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
        className="p-8 flex flex-col gap-7"
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
            <ArtworkWithChart art={art} livePrice={livePrice}/>
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

            {/* Title + star rating */}
            <div className="flex items-baseline gap-3 flex-wrap">
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
              <StarRating value={avgRating} count={ratingCount} />
            </div>

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
                { label: 'Market Cap',  value: `${fmtETH(livePrice)} ETH`, color: '#FDFBF7' },
                { label: '24h Change',  value: fmtPct(((livePrice - art.marketCap) / art.marketCap) * 100), color: livePrice >= art.marketCap ? '#4ade80' : '#f87171' },
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

            {/* View Detail & Reviews — right below stats */}
            <Link
              href={`/artwork/${art.artworkId || `mock-${art.id}`}`}
              onClick={() => {
                const payload: StoredArtwork = {
                  id:             art.id,
                  artworkId:      art.artworkId,
                  title:          art.title,
                  ticker:         art.ticker,
                  artist:         art.artist,
                  phase:          art.phase,
                  phaseColor:     art.phaseColor,
                  marketCap:      art.marketCap,
                  marketCapLabel: art.marketCapLabel,
                  change24h:      art.change24h,
                  changePositive: art.changePositive,
                  progress:       art.progress,
                  image:          art.image,
                  description:    art.description,
                  volume24h:      art.volume24h,
                  holders:        art.holders,
                }
                sessionStorage.setItem('artcurve_detail', JSON.stringify(payload))
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5
                         font-mono text-[9px] tracking-[0.22em] uppercase
                         transition-all duration-150"
              style={{
                border:     '1px solid rgba(212,175,55,0.3)',
                color:      'rgba(212,175,55,0.7)',
                background: 'rgba(212,175,55,0.04)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'rgba(212,175,55,0.1)'
                el.style.borderColor  = 'rgba(212,175,55,0.55)'
                el.style.color        = '#D4AF37'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background   = 'rgba(212,175,55,0.04)'
                el.style.borderColor  = 'rgba(212,175,55,0.3)'
                el.style.color        = 'rgba(212,175,55,0.7)'
              }}
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              View Detail &amp; Reviews
            </Link>
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

          {/* Bonding curve chart + timeframe switcher — always expanded */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p
                className="font-mono text-[9px] tracking-[0.22em] uppercase"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                Bonding Curve · Price History
              </p>
              <div className="flex items-center gap-1">
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
            <BondingCurveChart art={art} range={chartRange} height={160} />
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
            BUY {art.ticker} — {fmtETH(livePrice)} ETH
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

function BuyModal({ art, livePrice, onClose }: { art: MarketArtwork; livePrice: number; onClose: () => void }) {
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
                style={{ color: 'rgba(255,255,255,0.3)' }}>Current Price</p>
              <p className="font-light text-white leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem' }}>
                {fmtETH(livePrice)} ETH
              </p>
            </div>
            <p className="font-mono font-semibold" style={{ color: livePrice >= art.marketCap ? '#4ade80' : '#f87171' }}>
              {fmtPct(((livePrice - art.marketCap) / art.marketCap) * 100)}
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
  // ── Backend data (falls back to mock when API unreachable) ────────
  const {
    artworks: _rawArtworks,
    isLoading,
    isFetching,
    page,
    setPage,
    pageCount,
    setSortBy: _setSortBy,
  } = useMarketplace({ initialLimit: 20 })
  const _apiArtworks = useMemo(
    () => _rawArtworks.map(adaptArtwork),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_rawArtworks],
  )
  const ARTWORKS = _apiArtworks.length > 0 ? _apiArtworks : ARTWORKS_MOCK

  const [selected,       setSelected]       = useState<MarketArtwork>(ARTWORKS_MOCK[0])
  const [activePhase,    setActivePhase]    = useState<Phase | 'All'>('All')
  const [sortKey,        setSortKey]        = useState<SortKey>('market_cap')
  const [search,         setSearch]         = useState('')
  const [searchResults,  setSearchResults]  = useState<MarketArtwork[] | null>(null)
  const [searchFetching, setSearchFetching] = useState(false)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sortOpen,     setSortOpen]     = useState(false)
  const [buyArt,       setBuyArt]       = useState<MarketArtwork | null>(null)
  const [sheetOpen,    setSheetOpen]    = useState(false)
  const [lightboxArt,  setLightboxArt]  = useState<MarketArtwork | null>(null)
  // ── Race view ──
  const [viewMode,     setViewMode]     = useState<'list' | 'race'>('list')
  const [priceHistory, setPriceHistory] = useState<Record<number, number[]>>(
    () => Object.fromEntries(ARTWORKS_MOCK.map(a => [a.id, [a.marketCap]])),
  )
  // Auto-rotate
  const [listHovered,  setListHovered]  = useState(false)
  const [rotateProgress, setRotateProg] = useState(0)
  const [nextId,       setNextId]       = useState<number | null>(null)

  // Live price simulation
  const [livePrices, setLivePrices] = useState<Record<number, number>>(
    () => Object.fromEntries(ARTWORKS_MOCK.map(a => [a.id, a.marketCap]))
  )
  const [flashId,    setFlashId]    = useState<number | null>(null)

  const sortRef         = useRef<HTMLDivElement>(null)
  const headerRef       = useRef<HTMLDivElement>(null)
  const resumeTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks whether user manually picked an item (pauses top-1 auto-follow for 12 s)
  const manualPickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userPickedRef   = useRef(false)
  // Tracks whether we've already synced to real API data once
  const apiSyncedRef    = useRef(false)

  // FIX 7: BE search with debounce 400ms
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (search.length < 2) {
      setSearchResults(null)
      setSearchFetching(false)
      return
    }
    setSearchFetching(true)
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const result = await artworkService.search({ q: search, page: 1, limit: 20 })
        const mapped = (result.data ?? []).map(adaptArtwork)
        setSearchResults(mapped)
      } catch {
        setSearchResults([])
      } finally {
        setSearchFetching(false)
      }
    }, 400)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [search])

  // ── Sync selected + price state when real data first arrives ──────
  useEffect(() => {
    if (_apiArtworks.length > 0 && !apiSyncedRef.current) {
      apiSyncedRef.current = true
      setSelected(_apiArtworks[0])
      // Seed price simulation maps with real artwork IDs
      setPriceHistory(Object.fromEntries(_apiArtworks.map(a => [a.id, [a.marketCap]])))
      setLivePrices(Object.fromEntries(_apiArtworks.map(a => [a.id, a.marketCap])))
    }
  }, [_apiArtworks])

  // ── Three-tier price simulation ────────────────────────────────
  //  Tier 1 — micro tick every 2.4s: ±5%  (UI noise, no rank change)
  //  Tier 2 — spike event every 4.5s: +20% to +130% (causes rank jumps)
  //  Tier 3 — mean-reversion every 9s: pulls price back toward seed × 4
  //  Cap: no artwork exceeds 20× its seed marketCap
  const MAX_MULT = 20
  useEffect(() => {
    const doFlash = (id: number, duration = 700) => {
      setFlashId(id)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setFlashId(null), duration)
    }

    // Helper: clamp to cap
    const cap = (id: number, raw: number) =>
      Math.min(raw, (ARTWORKS.find(a => a.id === id)?.marketCap ?? raw) * MAX_MULT)

    // Tier 1: small ticks — visual activity only
    const microTimer = setInterval(() => {
      const art   = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)]
      const delta = 1 + (Math.random() * 0.08 - 0.03) // -3% to +5%
      setLivePrices(prev => ({
        ...prev,
        [art.id]: parseFloat(cap(art.id, prev[art.id] * delta).toFixed(4)),
      }))
      doFlash(art.id, 600)
    }, 2400)

    // Tier 2: spike events — cause visible rank changes
    const spikeTimer = setInterval(() => {
      const art   = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)]
      const spike = 1 + (Math.random() * 1.1 + 0.20) // +20% to +130%
      setLivePrices(prev => ({
        ...prev,
        [art.id]: parseFloat(cap(art.id, prev[art.id] * spike).toFixed(4)),
      }))
      doFlash(art.id, 1200)
    }, 4500)

    // Tier 3: mean-reversion — gently pull capped artwork back toward seed × 4
    const reversionTimer = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev }
        for (const art of ARTWORKS) {
          const seed   = art.marketCap
          const target = seed * 4          // equilibrium = 4× seed
          const cur    = prev[art.id] ?? seed
          if (cur > target) {
            // Pull 18% toward target
            next[art.id] = parseFloat((cur * 0.82 + target * 0.18).toFixed(4))
          }
        }
        return next
      })
    }, 9000)

    return () => {
      clearInterval(microTimer)
      clearInterval(spikeTimer)
      clearInterval(reversionTimer)
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [])

  // ── Filter + sort ──────────────────────────────────────────────
  // FIX 7: Use BE search results when search >= 2 chars, else client filter
  const filtered = useMemo(() => {
    // When search active: use BE results (or empty while fetching)
    let items = search.length >= 2
      ? (searchResults ?? [])
      : [...ARTWORKS]

    // Phase filter (applied on top of search results too)
    if (activePhase !== 'All') items = items.filter(a => a.phase === activePhase)

    // Client-side search fallback when search < 2
    if (search.trim() && search.length < 2) {
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
  }, [activePhase, sortKey, search, searchResults, livePrices, ARTWORKS])

  // If selected gets filtered out, auto-select first
  useEffect(() => {
    if (filtered.length && !filtered.find(a => a.id === selected.id)) {
      setSelected(filtered[0])
    }
  }, [filtered, selected.id])

  // Snapshot live prices into priceHistory every tick (keep last 40 pts)
  useEffect(() => {
    setPriceHistory(prev => {
      const next: Record<number, number[]> = {}
      for (const a of ARTWORKS) {
        const arr    = prev[a.id] ?? []
        const newArr = [...arr, livePrices[a.id] ?? a.marketCap]
        next[a.id]   = newArr.slice(-40)
      }
      return next
    })
  }, [livePrices])

  // Auto-follow rank-1: when the top-ranked item changes, snap the right
  // panel to it — unless the user manually picked something in the last 12 s.
  const top1Id = filtered[0]?.id
  useEffect(() => {
    if (top1Id == null || userPickedRef.current) return
    setSelected(prev => {
      const top1 = filtered.find(a => a.id === top1Id)
      return top1 ?? prev
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top1Id])

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

  // Phase counts — ARTWORKS in deps so counts update when API data arrives
  const counts = useMemo(() => ({
    All:          ARTWORKS.length,
    Accumulation: ARTWORKS.filter(a => a.phase === 'Accumulation').length,
    FOMO:         ARTWORKS.filter(a => a.phase === 'FOMO').length,
    Migration:    ARTWORKS.filter(a => a.phase === 'Migration').length,
  }), [ARTWORKS])

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

  // Manual select — stops auto-rotate briefly + pauses top-1 auto-follow 12 s
  const handleSelect = (art: MarketArtwork) => {
    setSelected(art)
    setListHovered(true)
    setRotateProg(0)
    setNextId(null)
    // Mark user pick; clear the top-1 follow for 12 s then resume
    userPickedRef.current = true
    if (manualPickTimer.current) clearTimeout(manualPickTimer.current)
    manualPickTimer.current = setTimeout(() => { userPickedRef.current = false }, 12_000)
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
          {/* Phase tabs — dimmed when RACE mode is active */}
          <div
            className="flex items-center h-full overflow-x-auto"
            style={{
              scrollbarWidth: 'none',
              opacity:       viewMode === 'race' ? 0.3 : 1,
              pointerEvents: viewMode === 'race' ? 'none' : 'auto',
              transition:    'opacity 0.2s ease',
            }}
          >
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

          {/* Race view toggle — separator + RACE button */}
          <div className="h-4 w-px mx-1 shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)' }}/>
          <button
            type="button"
            onClick={() => setViewMode(v => v === 'race' ? 'list' : 'race')}
            className="relative flex items-center gap-1.5 h-full px-3 shrink-0
                       text-[9.5px] tracking-[0.2em] uppercase transition-colors duration-200"
            style={{ color: viewMode === 'race' ? '#D4AF37' : 'rgba(255,255,255,0.32)' }}
          >
            {/* Pulse-line icon */}
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            RACE
            {viewMode === 'race' && (
              <span className="absolute bottom-0 left-1 right-1 h-px"
                style={{ background: '#D4AF37' }}/>
            )}
          </button>

          {/* Search + sort */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              {/* FIX 7: spinner while searching BE */}
              {searchFetching ? (
                <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin"
                  viewBox="0 0 24 24" fill="none" style={{ color: '#D4AF37' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                </svg>
              )}
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
                        onClick={() => {
                          setSortKey(s.key)
                          setSortOpen(false)
                          // Propagate to API — map UI sort keys to backend sortBy param
                          const apiSort = s.key === 'newest' ? 'created_at'
                            : s.key === 'price_asc' || s.key === 'price_desc' ? 'price'
                            : 'created_at'
                          _setSortBy(apiSort as Parameters<typeof _setSortBy>[0])
                          setPage(1)
                        }}
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

        {/* ══ RACE VIEW (toggled via RACE tab) ════════════════ */}
        <AnimatePresence mode="wait">
          {viewMode === 'race' && (
            <motion.div
              key="race"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full"
              style={{
                height:        `calc(100vh - ${STICKY_TOP}px)`,
                display:       'flex',
                flexDirection: 'column',
              }}
            >
              <RaceView
                artworks={filtered.length ? filtered : ARTWORKS}
                livePrices={livePrices}
                flashId={flashId}
                priceHistory={priceHistory}
                selectedId={selected.id}
                onSelect={handleSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ SPLIT PANE ══════════════════════════════════════ */}
        <div
          className={`flex ${viewMode === 'race' ? 'hidden' : ''}`}
          style={{
            position:   'sticky',
            top:        STICKY_TOP,
            height:     `calc(100vh - ${STICKY_TOP}px)`,
            overflow:   'hidden',
          }}
        >

          {/* ── Left: Compact List (40%) ── */}
          <div
            data-lenis-prevent
            onMouseEnter={onListEnter}
            onMouseLeave={onListLeave}
            style={{
              width:          '40%',
              height:         '100%',
              overflowY:      'auto',
              borderRight:    '1px solid rgba(255,255,255,0.07)',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(212,175,55,0.15) transparent',
            }}
          >
            {/* List header — sticky at top of this scroll container */}
            <div
              className="grid gap-3 sticky z-10 px-4 py-2"
              style={{
                top:                 0,
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

            {/* FIX 9: skeleton loading state */}
            {isLoading ? (
              <div className="flex flex-col">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-10 h-10 shrink-0 rounded-sm"
                      style={{ background: 'rgba(255,255,255,0.07)' }}/>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.07)', width: '65%' }}/>
                      <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '40%' }}/>
                    </div>
                    <div className="w-20 flex flex-col items-end gap-1.5">
                      <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.07)', width: '80%' }}/>
                      <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '50%' }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
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

            {/* FIX 8: Pagination controls */}
            {!isLoading && !search && pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 py-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-7 h-7 font-mono text-[11px] transition-colors duration-150"
                  style={{
                    border:     '1px solid rgba(255,255,255,0.1)',
                    color:      page === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
                    cursor:     page === 1 ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (page !== 1) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                >
                  ←
                </button>
                <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {page} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="flex items-center justify-center w-7 h-7 font-mono text-[11px] transition-colors duration-150"
                  style={{
                    border:     '1px solid rgba(255,255,255,0.1)',
                    color:      page === pageCount ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
                    cursor:     page === pageCount ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (page !== pageCount) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                >
                  →
                </button>
              </div>
            )}

            {/* FIX 9: isFetching overlay spinner (not initial load) */}
            {isFetching && !isLoading && (
              <div className="sticky bottom-3 flex justify-end px-4 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5"
                  style={{ background: 'rgba(0,0,0,0.82)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-2.5 h-2.5 animate-spin" viewBox="0 0 24 24" fill="none"
                    style={{ color: '#D4AF37' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="font-mono text-[7px] tracking-widest" style={{ color: '#D4AF37' }}>UPDATING</span>
                </div>
              </div>
            )}

            {/* ── Live Activity Feed ── */}
            <ActivityFeed />
          </div>

          {/* ── Right: Inspection Deck (60%) ── */}
          <div
            data-lenis-prevent
            className="hidden md:block flex-1 min-w-0"
            style={{
              height:         '100%',
              overflowY:      'auto',
              background:     '#0A0A0A',
              scrollbarWidth: 'none',
            }}
          >
            <InspectionDeck art={selected} livePrice={livePrices[selected.id] ?? selected.marketCap} onCollect={setBuyArt} onLightbox={setLightboxArt}/>
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
                <InspectionDeck art={selected} livePrice={livePrices[selected.id] ?? selected.marketCap} onCollect={art => { setSheetOpen(false); setBuyArt(art) }} onLightbox={setLightboxArt}/>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ BUY MODAL ════════════════════════════════════════ */}
      {buyArt && <BuyModal art={buyArt} livePrice={livePrices[buyArt.id] ?? buyArt.marketCap} onClose={() => setBuyArt(null)}/>}

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
