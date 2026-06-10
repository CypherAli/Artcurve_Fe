'use client'

// ─────────────────────────────────────────────────────────────────
//  TradePage.tsx  —  ArtCurve DEX Terminal  (polished with Framer Motion)
//
//  Framer Motion patterns applied:
//  · Staggered column entrance  (variants + staggerChildren)
//  · Token list reorder          (AnimatePresence popLayout + layout="position")
//  · Price header flip           (AnimatePresence mode="wait" on price digits)
//  · Stats stagger on token swap (staggerChildren on key change)
//  · Animated depth bars         (motion.div animate={{ width }})
//  · Live trades stream          (AnimatePresence popLayout + custom variants)
//  · Trade panel glow            (useMotionValue + useMotionTemplate)
//  · whileFocus on input         (from gestures reference)
//  · All buttons: spring hover/tap
//  · Chart cross-fade            (AnimatePresence mode="wait" on key)
// ─────────────────────────────────────────────────────────────────

import {
  useEffect, useRef, useState, useMemo, useCallback,
} from 'react'
import {
  motion, AnimatePresence,
  useMotionValue, useMotionTemplate,
} from 'framer-motion'
import { useQueryClient }               from '@tanstack/react-query'
import { CandlestickChart, CandleRange } from '../common/CandlestickChart'
import { PHASE_COLOR, Phase }            from '../marketplace/ArtCard'
import { useMarketplace }               from '@/hooks/useMarketplace'
import { useBuyTokens, useSellTokens, useTokenBalance, useEthBalance, toWei } from '@/web3/hooks/useContract'
import { tradeService }                 from '@/services/trade.service'
import { authStore }                    from '@/lib/auth-store'
import { parseEther }                   from 'viem'
import type { Artwork, OhlcvCandle, OhlcvTimeframe } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
interface TradeArtwork {
  id:              number   // stable numeric UI key
  artworkId:       string   // real UUID for API calls
  contractAddress: string | null  // on-chain contract address (null = not deployed)
  title:           string
  ticker:          string
  artist:          string
  artistAddr:      string
  phase:           Phase
  phaseColor:      string
  basePrice:       number
  image:           string
  sparkline:       number[]
  progress:        number
  holders:         number
  volume24h:       number
}

interface OrderLevel {
  price: number
  size:  number
  bar:   number
  type:  'ask' | 'bid'
}

interface RecentTrade {
  id:     string
  side:   'buy' | 'sell'
  price:  number
  eth:    number
  tokens: number
  wallet: string
  ago:    number
}

// ─────────────────────────────────────────────────────────────────
//  Artwork catalogue (24 artworks) — mock fallback
// ─────────────────────────────────────────────────────────────────
const ARTWORKS_MOCK: TradeArtwork[] = ([
  { id:1,  title:'Nocturne at the Bridge',   ticker:'$NOCTURNE', artist:'Elena Vasquez',   artistAddr:'0x4f2…a91', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:2.45,  progress:62, holders:24, volume24h:1.42,  image:'/images/artworks/art1.jpg',    sparkline:[4,5.2,6.8,6.1,5.4,7,9.5,14.2,19.8,23.4] },
  { id:2,  title:'Shattered Embrace',        ticker:'$SHATTER',  artist:'Marcus Chen',     artistAddr:'0x8d3…f44', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:0.89,  progress:28, holders:8,  volume24h:0.38,  image:'/images/artworks/art2.jpg',    sparkline:[5,4.8,5.3,5.1,5.6,5.4,6.2,7.1,7.8,8.9] },
  { id:3,  title:'Bloom & Blade',            ticker:'$BLOOM',    artist:'Aiko Tanaka',     artistAddr:'0x1a9…c33', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:4.12,  progress:71, holders:31, volume24h:2.87,  image:'/images/artworks/art3.jpg',    sparkline:[3,7.5,14,9.2,6.8,10.5,16,12.4,28,41.2] },
  { id:4,  title:'Self-Portrait with Death', ticker:'$BÖCKLIN',  artist:'Arnold Böcklin',  artistAddr:'0x7e1…b22', phase:'Migration',     phaseColor:PHASE_COLOR['Migration'],     basePrice:18.20, progress:94, holders:47, volume24h:8.62,  image:'/images/artworks/art4.jpg',    sparkline:[2,2.3,2.8,3.5,5,9,22,58,120,182] },
  { id:5,  title:'The Last March',           ticker:'$MARCH',    artist:'Yui Nakamura',    artistAddr:'0x2b5…d81', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:5.51,  progress:78, holders:28, volume24h:3.21,  image:'/images/artworks/art5.jpg',    sparkline:[8,6,4.2,5.8,8.5,6.5,9,14.5,22,55.1] },
  { id:6,  title:'Ghost of the Meridian',    ticker:'$GHOST',    artist:'Ivan Sorokin',    artistAddr:'0x9c4…e17', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:0.61,  progress:12, holders:5,  volume24h:0.14,  image:'/images/artworks/art1.jpg',    sparkline:[4,4.2,3.9,4.5,4.3,5.1,5.4,5.8,5.9,6.1] },
  { id:7,  title:'Pale Architecture',        ticker:'$PALE',     artist:'Soo-Ah Lim',      artistAddr:'0x3f7…a04', phase:'Migration',     phaseColor:PHASE_COLOR['Migration'],     basePrice:23.40, progress:97, holders:53, volume24h:12.40, image:'/images/artworks/art2.jpg',    sparkline:[1,1.5,2.2,4,8.5,18,42,88,164,234] },
  { id:8,  title:'Cathedral of Ash',         ticker:'$CATHEDRA', artist:'Elena Vasquez',   artistAddr:'0x4f2…a91', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:6.77,  progress:66, holders:33, volume24h:4.03,  image:'/images/artworks/art3.jpg',    sparkline:[5,6.2,7.8,9.5,8.1,11,15.5,20.3,29,67.7] },
  { id:9,  title:'Convergence I',            ticker:'$CONV1',    artist:'Mira Okafor',     artistAddr:'0x5b8…c12', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:1.32,  progress:34, holders:11, volume24h:0.62,  image:'/convergence/img1.jpg',         sparkline:[3,3.4,3.1,3.8,4.2,4,4.8,5.5,6.1,7] },
  { id:10, title:'Dissolution Study',        ticker:'$DISS',     artist:'Paulo Reyes',     artistAddr:'0x6c9…d23', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:3.88,  progress:58, holders:22, volume24h:2.11,  image:'/convergence/img2.jpg',         sparkline:[2,3.1,2.8,4.5,3.9,5.6,7.2,9.8,14,19.4] },
  { id:11, title:'Threshold Fragment',       ticker:'$THRESH',   artist:'Yuki Tanabe',     artistAddr:'0x7d0…e34', phase:'Migration',     phaseColor:PHASE_COLOR['Migration'],     basePrice:31.50, progress:99, holders:61, volume24h:18.40, image:'/convergence/img3.jpg',         sparkline:[1,1.8,3.2,7,15,38,95,198,280,315] },
  { id:12, title:'Signal Noise',             ticker:'$SIGNAL',   artist:'Kezia Adeyemi',   artistAddr:'0x8e1…f45', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:0.44,  progress:8,  holders:4,  volume24h:0.09,  image:'/convergence/img4.jpg',         sparkline:[4,4.1,3.9,4.3,4.2,4.4,4.3,4.5,4.4,4.6] },
  { id:13, title:'Residue of Light',         ticker:'$RESID',    artist:'Ivan Sorokin',    artistAddr:'0x9c4…e17', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:8.90,  progress:74, holders:38, volume24h:5.44,  image:'/convergence/img5.jpg',         sparkline:[6,5.8,7.2,8.9,7.5,10.2,16.8,22.4,38,89] },
  { id:14, title:'Topology of Loss',         ticker:'$TOPO',     artist:'Soo-Ah Lim',      artistAddr:'0x3f7…a04', phase:'Migration',     phaseColor:PHASE_COLOR['Migration'],     basePrice:14.70, progress:91, holders:44, volume24h:9.20,  image:'/convergence/img6.jpg',         sparkline:[2,2.5,3.4,5.8,9,16,36,76,128,147] },
  { id:15, title:'Recursive Dream',          ticker:'$RECURSE',  artist:'Marcus Chen',     artistAddr:'0x8d3…f44', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:5.22,  progress:63, holders:27, volume24h:3.08,  image:'/convergence/img7.jpg',         sparkline:[4,4.8,6,5.2,7.1,9.4,12.8,17.5,28,52.2] },
  { id:16, title:'Entropy Protocol',         ticker:'$ENTROP',   artist:'Aiko Tanaka',     artistAddr:'0x1a9…c33', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:1.85,  progress:42, holders:14, volume24h:0.88,  image:'/convergence/img8.jpg',         sparkline:[5,5.3,4.9,5.8,6.4,6.1,7.5,8.8,10.2,12.4] },
  { id:17, title:'Meridian Crossing',        ticker:'$MERID',    artist:'Yui Nakamura',    artistAddr:'0x2b5…d81', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:7.43,  progress:71, holders:35, volume24h:4.65,  image:'/convergence/img9.jpg',         sparkline:[3,4.2,5.8,4.9,6.5,8.2,11.5,16.8,24,43.2] },
  { id:18, title:'Void Cartography',         ticker:'$VOID',     artist:'Arnold Böcklin',  artistAddr:'0x7e1…b22', phase:'Migration',     phaseColor:PHASE_COLOR['Migration'],     basePrice:27.80, progress:96, holders:58, volume24h:16.10, image:'/convergence/img10.jpg',        sparkline:[1,1.6,2.8,5.5,12,28,68,142,232,278] },
  { id:19, title:'Amber Protocol',           ticker:'$AMBER',    artist:'Kezia Adeyemi',   artistAddr:'0x8e1…f45', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:2.10,  progress:38, holders:16, volume24h:0.94,  image:'/images/artworks/art1.jpg',    sparkline:[6,6.4,5.9,7.1,7.8,7.3,8.6,9.5,11,12.8] },
  { id:20, title:'Fracture Line',            ticker:'$FRACT',    artist:'Paulo Reyes',     artistAddr:'0x6c9…d23', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:9.40,  progress:76, holders:41, volume24h:6.12,  image:'/images/artworks/art2.jpg',    sparkline:[4,5.1,6.8,5.4,8.2,11,15.8,22.5,42,79.4] },
  { id:21, title:'Temporal Drift',           ticker:'$DRIFT',    artist:'Mira Okafor',     artistAddr:'0x5b8…c12', phase:'Accumulation',  phaseColor:PHASE_COLOR['Accumulation'],  basePrice:0.88,  progress:19, holders:7,  volume24h:0.22,  image:'/images/artworks/art4.jpg',    sparkline:[5,5.2,4.8,5.5,5.3,5.7,5.9,6.2,6.5,6.9] },
  { id:22, title:'Sovereign Geometry',       ticker:'$SOVGEO',   artist:'Yuki Tanabe',     artistAddr:'0x7d0…e34', phase:'Migration',     phaseColor:PHASE_COLOR['Migration'],     basePrice:19.90, progress:93, holders:50, volume24h:13.20, image:'/images/artworks/art5.jpg',    sparkline:[2,2.6,4,8,17,42,98,154,188,199] },
  { id:23, title:'Chromatic Grief',          ticker:'$CHROMA',   artist:'Elena Vasquez',   artistAddr:'0x4f2…a91', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:4.55,  progress:60, holders:25, volume24h:2.66,  image:'/convergence/img3.jpg',         sparkline:[3,3.8,5,4.2,6.1,8,11.5,15.8,26,45.5] },
  { id:24, title:'Silent Architecture',      ticker:'$SILENT',   artist:'Ivan Sorokin',    artistAddr:'0x9c4…e17', phase:'FOMO',          phaseColor:PHASE_COLOR['FOMO'],          basePrice:7.10,  progress:69, holders:32, volume24h:4.28,  image:'/convergence/img7.jpg',         sparkline:[5,5.8,7.5,6.3,9.1,12.5,17,23.8,38.5,71] },
] as Omit<TradeArtwork, 'artworkId' | 'contractAddress'>[]).map((a, i) => ({ ...a, artworkId: '', contractAddress: null }))

// ── Adapter: backend Artwork → TradeArtwork ───────────────────────
function adaptTradeArtwork(artwork: Artwork, index: number): TradeArtwork {
  const price    = parseFloat(artwork.current_price)  || 0
  const supply   = parseFloat(artwork.current_supply) || 0
  const target   = parseFloat(artwork.target_cap)     || 0
  const mc       = price * supply || price
  const progress = target > 0 ? Math.min((mc / target) * 100, 100) : 0
  const phase: Phase =
    progress >= 90 ? 'Migration' :
    progress >= 50 ? 'FOMO' :
                     'Accumulation'
  const addr  = artwork.creator?.wallet_address ?? '0x000000000000'
  const artist = artwork.creator?.username ?? `${addr.slice(0,5)}…${addr.slice(-3)}`
  const rawImg = artwork.ipfs_metadata_uri ?? ''
  const image  = rawImg.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${rawImg.replace('ipfs://', '')}`
    : rawImg || '/images/artworks/art1.jpg'
  return {
    id:              index + 1,
    artworkId:       artwork.id,
    contractAddress: artwork.contract_address ?? null,
    title:           artwork.title,
    ticker:          artwork.ticker ?? `$TKN${index + 1}`,
    artist,
    artistAddr: `${addr.slice(0,5)}…${addr.slice(-3)}`,
    phase,
    phaseColor: PHASE_COLOR[phase],
    basePrice:  price,
    image,
    sparkline:  Array.from({ length: 10 }, (_, i) => price * (1 + i * 0.1) || 1),
    progress,
    holders:    0,
    volume24h:  0,
  }
}

// ─────────────────────────────────────────────────────────────────
//  Utilities
// ─────────────────────────────────────────────────────────────────
function fmtETH(v: number): string {
  if (!isFinite(v) || isNaN(v)) return '—'
  if (v >= 1e9)  return `${(v/1e9).toFixed(2)}B`
  if (v >= 1e6)  return `${(v/1e6).toFixed(2)}M`
  if (v >= 1e3)  return `${(v/1e3).toFixed(2)}k`
  if (v >= 100)  return v.toFixed(1)
  if (v >= 10)   return v.toFixed(2)
  return v.toFixed(4)
}

function fmtPct(pct: number): string {
  if (!isFinite(pct) || isNaN(pct)) return '—'
  const sign = pct >= 0 ? '+' : ''
  const abs  = Math.abs(pct)
  if (abs >= 1e6) return `${sign}${(pct/1e6).toFixed(1)}M%`
  if (abs >= 1e3) return `${sign}${(pct/1e3).toFixed(1)}k%`
  return `${sign}${pct.toFixed(2)}%`
}

function mkRng(seed: number) {
  let s = ((seed | 0) + 1) >>> 0
  return () => { s ^= s<<13; s ^= s>>17; s ^= s<<5; return (s>>>0)/0xffffffff }
}

/** Returns 'up' | 'down' | null for 600 ms after each price change */
function usePriceFlash(price: number) {
  const [flash, setFlash] = useState<'up'|'down'|null>(null)
  const prev = useRef(price)
  useEffect(() => {
    if (prev.current === price) return
    setFlash(price > prev.current ? 'up' : 'down')
    prev.current = price
    const t = setTimeout(() => setFlash(null), 600)
    return () => clearTimeout(t)
  }, [price])
  return flash
}

// ─────────────────────────────────────────────────────────────────
//  Animation Variants (centralised)
// ─────────────────────────────────────────────────────────────────
const PAGE_V = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const COL_V = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 255, damping: 24 } },
}
const STATS_V = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
}
const STAT_ITEM_V = {
  hidden: { opacity: 0, y: 6  },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
}
const TOKEN_ITEM_V = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0,  transition: { type: 'spring' as const, stiffness: 340, damping: 26 } },
  exit:   { opacity: 0, x: -10, transition: { duration: 0.16 } },
}
const TRADE_V = {
  initial: { opacity: 0, x: -8  },
  animate: { opacity: 1, x: 0   },
  exit:    { opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.18 } },
}

// ─────────────────────────────────────────────────────────────────
//  Order-book & recent-trade generators
// ─────────────────────────────────────────────────────────────────
function buildOrderBook(price: number, artId: number, tick: number) {
  const rng = mkRng(artId * 1013 + (tick & 0xffff))
  const N   = 12
  const asks: OrderLevel[] = []
  const bids: OrderLevel[] = []
  let maxSz = 0
  for (let i = 0; i < N; i++) {
    const step = 0.0004 + i * 0.0009 + rng() * 0.0003
    const aSz  = (rng() * 1.6 + 0.05) / Math.sqrt(i + 1)
    const bSz  = (rng() * 1.6 + 0.05) / Math.sqrt(i + 1)
    maxSz = Math.max(maxSz, aSz, bSz)
    asks.push({ price: price*(1+step), size: aSz, bar: 0, type: 'ask' })
    bids.push({ price: price*(1-step), size: bSz, bar: 0, type: 'bid' })
  }
  asks.forEach(a => { a.bar = a.size/maxSz })
  bids.forEach(b => { b.bar = b.size/maxSz })
  return { asks: asks.reverse(), bids, spread: asks[asks.length-1].price - bids[0].price }
}

function seedTrades(price: number, artId: number): RecentTrade[] {
  const rng = mkRng(artId * 7331)
  return Array.from({ length: 22 }, (_, i) => {
    const side = rng() > 0.36 ? 'buy' : 'sell' as 'buy'|'sell'
    const eth  = rng() * 0.8 + 0.02
    const p    = price * (1 + (rng()-0.5) * 0.014)
    return {
      id:     `seed-${artId}-${i}`,
      side,  price: p,  eth,  tokens: eth/p,
      wallet: `0x${Math.floor(rng()*0xffffff).toString(16).padStart(6,'0')}…${Math.floor(rng()*0xffff).toString(16).padStart(4,'0')}`,
      ago:    Math.floor(rng()*180 + i*6),
    }
  })
}

// ─────────────────────────────────────────────────────────────────
//  TokenRow
// ─────────────────────────────────────────────────────────────────
function TokenRow({
  art, livePrice, isSelected, onClick,
}: {
  art: TradeArtwork; livePrice: number; isSelected: boolean; onClick: () => void
}) {
  const pct   = ((livePrice - art.basePrice) / art.basePrice) * 100
  const up    = pct >= 0
  const flash = usePriceFlash(livePrice)

  const numColor = flash
    ? (flash === 'up' ? '#22c55e' : '#ef4444')
    : up ? 'rgba(74,222,128,0.82)' : 'rgba(248,113,113,0.82)'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout="position"
      whileHover={{ x: isSelected ? 0 : 2, backgroundColor: isSelected ? undefined : 'rgba(255,255,255,0.024)' }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      style={{
        background:  isSelected ? `${art.phaseColor}0d` : 'transparent',
        borderLeft:  `2px solid ${isSelected ? art.phaseColor : 'transparent'}`,
      }}
    >
      <div className="w-8 h-8 shrink-0 overflow-hidden"
        style={{ border:`1px solid ${isSelected ? art.phaseColor+'50' : 'rgba(255,255,255,0.08)'}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.image} alt="" className="w-full h-full object-cover" draggable={false}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[10px] font-bold truncate"
            style={{ color: isSelected ? art.phaseColor : 'rgba(255,255,255,0.78)' }}>
            {art.ticker}
          </span>
          <span className="font-mono text-[9px] shrink-0"
            style={{ color: numColor, transition: 'color 0.35s ease' }}>
            {fmtPct(pct)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="font-sans text-[8.5px] truncate" style={{ color:'rgba(255,255,255,0.26)' }}>
            {art.title}
          </span>
          <span className="font-mono text-[9px] shrink-0 font-semibold"
            style={{ color: numColor, transition: 'color 0.35s ease' }}>
            {fmtETH(livePrice)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Token Picker Panel
// ─────────────────────────────────────────────────────────────────
function TokenPickerPanel({
  artworks, livePrices, sortPrices, selectedId, onSelect,
}: {
  artworks:   TradeArtwork[]
  livePrices: Record<number,number>
  sortPrices: Record<number,number>
  selectedId: number
  onSelect:   (id: number) => void
}) {
  const { t } = useLanguage()
  const [search,      setSearch]      = useState('')
  const [phaseFilter, setPhaseFilter] = useState<Phase|'All'>('All')

  const filtered = useMemo(() => {
    let list: TradeArtwork[] = artworks
    if (phaseFilter !== 'All') list = list.filter(a => a.phase === phaseFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.ticker.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))
    }
    return [...list].sort((a,b) => (sortPrices[b.id]??b.basePrice) - (sortPrices[a.id]??a.basePrice))
  }, [artworks, sortPrices, search, phaseFilter])

  const phases: (Phase|'All')[] = ['All','Accumulation','FOMO','Migration']
  const chipLabel = (p: Phase|'All') =>
    p==='All' ? t.trade.chipAll :
    p==='Accumulation' ? t.trade.chipAcc :
    p==='FOMO' ? t.trade.chipFomo :
    t.trade.chipMig

  return (
    <div className="flex flex-col h-full" style={{ borderRight:'1px solid rgba(255,255,255,0.05)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ height:36, background:'rgba(0,0,0,0.35)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono text-[7px] tracking-[0.24em] uppercase" style={{ color:'rgba(255,255,255,0.22)' }}>{t.trade.markets}</span>
        <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.14)' }}>{filtered.length}/{artworks.length}</span>
      </div>

      {/* Search */}
      <div className="px-2.5 py-2 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div className="relative">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <motion.input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.trade.search}
            className="w-full bg-transparent font-mono text-[10px] pl-7 pr-2 py-1.5 outline-none"
            style={{ border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.65)', caretColor:'#D4AF37' }}
            whileFocus={{ outline: '1px solid rgba(212,175,55,0.4)' }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

      {/* Phase chips */}
      <div className="flex gap-1 px-2.5 py-2 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        {phases.map(p => {
          const active = phaseFilter === p
          const c = p==='All' ? '#D4AF37' : PHASE_COLOR[p as Phase]
          return (
            <motion.button key={p} type="button" onClick={() => setPhaseFilter(p)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              className="flex-1 py-0.5 font-mono text-[7px] tracking-wider"
              style={{
                color:      active ? c : 'rgba(255,255,255,0.22)',
                border:     `1px solid ${active ? c+'45' : 'rgba(255,255,255,0.07)'}`,
                background: active ? c+'0c' : 'transparent',
              }}>
              {chipLabel(p)}
            </motion.button>
          )
        })}
      </div>

      {/* Column labels */}
      <div className="flex items-center justify-between px-3 py-1 shrink-0"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
        <span className="font-mono text-[6.5px] tracking-wider" style={{ color:'rgba(255,255,255,0.14)' }}>{t.trade.tickerName}</span>
        <span className="font-mono text-[6.5px] tracking-wider" style={{ color:'rgba(255,255,255,0.14)' }}>{t.trade.price24h}</span>
      </div>

      {/* Token list — AnimatePresence popLayout for smooth reorder */}
      <div className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.06) transparent' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map(art => (
            <motion.div
              key={art.id}
              variants={TOKEN_ITEM_V}
              initial="hidden"
              animate="show"
              exit="exit"
              layout="position"
            >
              <TokenRow
                art={art}
                livePrice={livePrices[art.id]??art.basePrice}
                isSelected={art.id===selectedId}
                onClick={() => onSelect(art.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length===0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="flex items-center justify-center py-8">
            <span className="font-mono text-[9px]" style={{ color:'rgba(255,255,255,0.18)' }}>{t.common.noResults}</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Price Header  — animated price flip + stats stagger on token change
// ─────────────────────────────────────────────────────────────────
function PriceHeader({ art, livePrice }: { art: TradeArtwork; livePrice: number }) {
  const { t } = useLanguage()
  const pct   = ((livePrice - art.basePrice) / art.basePrice) * 100
  const up    = pct >= 0
  const flash = usePriceFlash(livePrice)

  const priceColor = flash
    ? (flash==='up' ? '#22c55e' : '#ef4444')
    : 'rgba(255,255,255,0.92)'

  const stats = [
    { label:t.trade.change24h, value:fmtPct(pct),                      color: up?'#22c55e':'#f87171' },
    { label:t.trade.vol24h,    value:`${fmtETH(art.volume24h)} ETH`    },
    { label:t.trade.high24h,   value:`${fmtETH(livePrice*1.042)} ETH` },
    { label:t.trade.low24h,    value:`${fmtETH(livePrice*0.881)} ETH` },
    { label:t.trade.holders,   value:String(art.holders)               },
    { label:t.trade.progress,  value:`${art.progress}%`,                color: art.phaseColor },
  ]

  return (
    <div className="flex items-center gap-4 px-4 shrink-0 overflow-x-auto"
      style={{
        height:44, background:'rgba(0,0,0,0.45)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        scrollbarWidth:'none',
      }}>

      {/* Identity */}
      <AnimatePresence mode="wait">
        <motion.div key={`id-${art.id}`}
          initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:8 }}
          transition={{ duration:0.2, ease:'easeOut' }}
          className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 overflow-hidden" style={{ border:`1px solid ${art.phaseColor}55` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.image} alt="" className="w-full h-full object-cover"/>
          </div>
          <div>
            <div className="font-mono text-[11px] font-bold leading-tight" style={{ color:art.phaseColor }}>{art.ticker}</div>
            <div className="font-sans text-[8.5px] leading-tight" style={{ color:'rgba(255,255,255,0.28)' }}>{art.title}</div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="w-px h-6 shrink-0" style={{ background:'rgba(255,255,255,0.07)' }}/>

      {/* Live price — flipping digit animation */}
      <div className="shrink-0 flex items-baseline gap-1 overflow-hidden" style={{ height:'1.5em' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={Math.floor(livePrice * 10)}
            initial={{ y:12, opacity:0 }}
            animate={{ y:0, opacity:1 }}
            exit={{ y:-12, opacity:0 }}
            transition={{ duration:0.14, ease:'easeOut' }}
            className="font-mono font-bold"
            style={{ fontSize:20, letterSpacing:'-0.02em', color:priceColor, transition:'color 0.38s ease' }}>
            {fmtETH(livePrice)}
          </motion.span>
        </AnimatePresence>
        <span className="font-mono text-[9px]" style={{ color:'rgba(255,255,255,0.22)' }}>ETH</span>
      </div>

      <div className="w-px h-6 shrink-0" style={{ background:'rgba(255,255,255,0.07)' }}/>

      {/* Stats — stagger in when artwork changes */}
      <motion.div
        key={`stats-${art.id}`}
        className="flex items-center gap-4 shrink-0"
        variants={STATS_V}
        initial="hidden"
        animate="show"
      >
        {stats.map(({ label, value, color }) => (
          <motion.div key={label} variants={STAT_ITEM_V} className="shrink-0 flex flex-col gap-0.5">
            <span className="font-mono text-[6.5px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.18)' }}>{label}</span>
            <span className="font-mono text-[10px] font-semibold" style={{ color: color??'rgba(255,255,255,0.58)' }}>{value}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Phase pill */}
      <motion.div
        key={`pill-${art.id}`}
        initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        transition={{ delay:0.15, duration:0.25 }}
        whileHover={{ scale:1.05 }}
        className="ml-auto shrink-0 flex items-center gap-1.5 px-2.5 py-1"
        style={{ border:`1px solid ${art.phaseColor}30`, background:`${art.phaseColor}09` }}>
        <span className="size-1.5 rounded-full animate-pulse" style={{ background:art.phaseColor }}/>
        <span className="font-mono text-[8px] tracking-[0.18em]" style={{ color:art.phaseColor }}>
          {art.phase==='Accumulation' ? t.marketplace.phaseAccumulation :
           art.phase==='FOMO' ? t.marketplace.phaseFomo :
           t.marketplace.phaseMigration}
        </span>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Order Book — animated depth bars
// ─────────────────────────────────────────────────────────────────
function OrderBookPanel({ art, livePrice, bookTick }: { art:TradeArtwork; livePrice:number; bookTick:number }) {
  const { t } = useLanguage()
  const { asks, bids, spread } = useMemo(
    () => buildOrderBook(livePrice, art.id, bookTick),
    [livePrice, art.id, bookTick],
  )

  const Row = ({ lvl }: { lvl: OrderLevel }) => (
    <div className="relative flex items-center px-3 py-[3.5px] font-mono text-[9px]" style={{ cursor:'default' }}>
      <motion.div
        className="absolute top-0 right-0 bottom-0 pointer-events-none"
        animate={{ width:`${lvl.bar*78}%` }}
        transition={{ type:'spring', stiffness:180, damping:28 }}
        style={{ background: lvl.type==='ask' ? '#ef4444' : '#22c55e', opacity:0.13 }}
      />
      <span className="flex-1 text-left z-[1] relative" style={{ color: lvl.type==='ask' ? '#f87171' : '#4ade80' }}>
        {lvl.price.toFixed(4)}
      </span>
      <span className="flex-1 text-right z-[1] relative" style={{ color:'rgba(255,255,255,0.5)' }}>
        {lvl.size.toFixed(3)}
      </span>
      <span className="flex-1 text-right z-[1] relative" style={{ color:'rgba(255,255,255,0.25)' }}>
        {(lvl.size*lvl.price).toFixed(3)}
      </span>
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center px-3 py-1.5 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        {[t.trade.priceEth, t.trade.size, t.trade.total].map((h,i)=>(
          <span key={h} className="flex-1 font-mono text-[6.5px] tracking-wider"
            style={{ color:'rgba(255,255,255,0.16)', textAlign: i===0?'left':'right' }}>{h}</span>
        ))}
      </div>
      <div className="flex-1 flex flex-col justify-end overflow-hidden">
        {asks.map((l,i)=><Row key={i} lvl={l}/>)}
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ background:'rgba(0,0,0,0.5)', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <span className="font-mono text-[10px] font-bold" style={{ color:'rgba(255,255,255,0.82)' }}>
          {fmtETH(livePrice)} ETH
        </span>
        <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.2)' }}>
          {t.trade.spread} {fmtETH(spread)} · {((spread/livePrice)*100).toFixed(3)}%
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        {bids.map((l,i)=><Row key={i} lvl={l}/>)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Recent Trades — AnimatePresence popLayout
// ─────────────────────────────────────────────────────────────────
function RecentTradesPanel({ trades }: { trades: RecentTrade[] }) {
  const { t } = useLanguage()
  return (
    <div className="h-full overflow-y-auto"
      style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.06) transparent' }}>
      <div className="sticky top-0 flex items-center px-3 py-1.5 shrink-0 z-[1]"
        style={{ background:'rgba(8,8,8,0.96)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        {[{l:t.trade.time,w:40},{l:t.trade.side,w:36},{l:t.trade.price,w:undefined},{l:t.trade.sizeEth,w:undefined},{l:t.trade.wallet,w:undefined}].map(({l,w})=>(
          <span key={l} className="font-mono text-[6.5px] tracking-wider"
            style={{ color:'rgba(255,255,255,0.15)', minWidth:w, flex:w?undefined:1 }}>{l}</span>
        ))}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {trades.map(trade => (
          <motion.div
            key={trade.id}
            variants={TRADE_V}
            initial="initial"
            animate="animate"
            exit="exit"
            layout="position"
            transition={{ type:'spring', stiffness:300, damping:28 }}
            className="flex items-center px-3 py-[3.5px] font-mono hover:bg-[var(--ac-paper)]/[0.018] cursor-default"
            style={{ borderBottom:'1px solid rgba(255,255,255,0.02)' }}
          >
            <span style={{ minWidth:40, fontSize:8, color:'rgba(255,255,255,0.2)' }}>
              {trade.ago<60?`${trade.ago}s`:`${Math.floor(trade.ago/60)}m`}
            </span>
            <span style={{ minWidth:36, fontSize:8, fontWeight:600, color:trade.side==='buy'?'#4ade80':'#f87171' }}>
              {trade.side==='buy'?t.common.buy:t.common.sell}
            </span>
            <span style={{ flex:1, fontSize:9, color:trade.side==='buy'?'rgba(74,222,128,0.7)':'rgba(248,113,113,0.7)' }}>
              {trade.price.toFixed(4)}
            </span>
            <span style={{ flex:1, fontSize:8, color:'rgba(255,255,255,0.45)' }}>{trade.eth.toFixed(3)}</span>
            <span style={{ flex:1, fontSize:8, color:'rgba(255,255,255,0.2)' }}>{trade.wallet}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Bottom Panel
// ─────────────────────────────────────────────────────────────────
function BottomPanel({ art, livePrice, trades, bookTick }: {
  art:TradeArtwork; livePrice:number; trades:RecentTrade[]; bookTick:number
}) {
  const { t } = useLanguage()
  const [tab, setTab] = useState<'trades'|'book'>('trades')
  const TABS = [{ key:'trades' as const, label:t.trade.recentTrades }, { key:'book' as const, label:t.trade.orderBook }]

  return (
    <div className="shrink-0 flex flex-col" style={{ height:170, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center shrink-0"
        style={{ height:34, background:'rgba(0,0,0,0.4)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {TABS.map(({ key, label }) => (
          <motion.button key={key} type="button" onClick={() => setTab(key)}
            whileTap={{ scale: 0.98 }}
            className="relative h-full px-4 font-mono text-[8px] tracking-widest transition-colors"
            style={{ color: tab===key ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.22)' }}>
            {label}
            {tab===key && (
              <motion.div layoutId="btm-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background:'#D4AF37' }}/>
            )}
          </motion.button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 px-4">
          <span className="size-1.5 rounded-full animate-pulse" style={{ background:'#22c55e' }}/>
          <span className="font-mono text-[7px] tracking-widest" style={{ color:'#22c55e' }}>{t.common.live.toUpperCase()}</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab==='trades' ? (
            <motion.div key="trades" className="h-full"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
              <RecentTradesPanel trades={trades}/>
            </motion.div>
          ) : (
            <motion.div key="book" className="h-full"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
              <OrderBookPanel art={art} livePrice={livePrice} bookTick={bookTick}/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Quote fetcher — FIX 5
// ─────────────────────────────────────────────────────────────────
interface QuoteResult {
  ethAmount:      number
  pricePerToken:  number
  newSupply:      number
  newSpotPrice:   number
  wouldGraduate?: boolean
  priceImpactPct: number
}

async function fetchQuote(artworkId: string, side: 'buy'|'sell', amount: string): Promise<QuoteResult | null> {
  if (!artworkId || !amount || parseFloat(amount) <= 0) return null
  try {
    const jwt = authStore.getJwt()
    const r = await fetch(
      `${API_URL}/artworks/${artworkId}/quote?side=${side}&amount=${amount}`,
      jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : {},
    )
    if (!r.ok) return null
    const json = await r.json()
    const data = json?.data ?? json
    return {
      ethAmount:      parseFloat(data.ethAmount     ?? data.eth_amount      ?? '0') || 0,
      pricePerToken:  parseFloat(data.pricePerToken ?? data.price_per_token ?? '0') || 0,
      newSupply:      parseFloat(data.newSupply     ?? data.new_supply      ?? '0') || 0,
      newSpotPrice:   parseFloat(data.newSpotPrice  ?? data.new_spot_price  ?? '0') || 0,
      wouldGraduate:  data.wouldGraduate ?? data.would_graduate ?? false,
      priceImpactPct: parseFloat(data.priceImpactPct ?? data.price_impact_pct ?? '0') || 0,
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
//  Trade Panel — BUY (green) / SELL (red) fully differentiated
// ─────────────────────────────────────────────────────────────────
function TradePanel({ art, livePrice }: { art:TradeArtwork; livePrice:number }) {
  const { t } = useLanguage()
  const [side,       setSide]       = useState<'buy'|'sell'>('buy')
  const [ethInput,   setEthInput]   = useState('')   // BUY: ETH to spend
  const [tokenInput, setTokenInput] = useState('')   // SELL: tokens to sell
  const [slippage,   setSlippage]   = useState('1.0')
  const [txState,    setTxState]    = useState<'idle'|'pending'|'success'>('idle')

  // FIX 5: Quote from API
  const [quote,        setQuote]        = useState<QuoteResult | null>(null)
  const [quoteFetching, setQuoteFetching] = useState(false)
  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Radial glow that follows the mouse — shifts between green/red per side
  const mouseX   = useMotionValue(0)
  const mouseY   = useMotionValue(0)
  const glowColor = side==='buy' ? '34,197,94' : '239,68,68'
  const glowBg    = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(${glowColor},0.06), transparent 70%)`

  // Real on-chain balances via wagmi
  const contractAddr = art.contractAddress as `0x${string}` | undefined
  const { formatted: WALLET_ETH }   = useEthBalance()
  const { formatted: WALLET_TOKEN } = useTokenBalance(contractAddr)

  // FIX 6: Query client for cache invalidation after trade
  const queryClient = useQueryClient()

  // Trade hooks
  const { buy, isPending: isBuying, isConfirming: buyConfirming, isSuccess: buySuccess } = useBuyTokens(contractAddr)
  const { sell, isPending: isSelling, isConfirming: sellConfirming, isSuccess: sellSuccess } = useSellTokens(contractAddr)

  // FIX 5: Debounced quote fetch from API
  useEffect(() => {
    const artworkUuid = art.artworkId
    if (!artworkUuid) { setQuote(null); return }

    const inputVal = side === 'buy' ? ethInput : tokenInput
    if (!inputVal || parseFloat(inputVal) <= 0) { setQuote(null); return }

    if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current)
    quoteDebounceRef.current = setTimeout(async () => {
      setQuoteFetching(true)
      const result = await fetchQuote(artworkUuid, side, inputVal)
      setQuote(result)
      setQuoteFetching(false)
    }, 300)

    return () => {
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ethInput, tokenInput, side, art.artworkId])

  // ── BUY calculations (use quote if available, else approximation) ──
  const ethAmt      = Math.max(0, parseFloat(ethInput)  || 0)
  const poolDepth   = livePrice * (art.progress * 0.18 + 4)
  const buyImpact   = quote ? quote.priceImpactPct : (ethAmt > 0 ? Math.min((ethAmt / poolDepth) * 100, 49.9) : 0)
  const tokensOut   = quote && side === 'buy' ? (ethAmt / (quote.pricePerToken || livePrice)) : (ethAmt > 0 ? (ethAmt / livePrice) * (1 - buyImpact / 180) : 0)
  const minReceived = tokensOut * (1 - parseFloat(slippage) / 100)

  // ── SELL calculations (use quote if available, else approximation) ──
  const tokenAmt  = Math.max(0, parseFloat(tokenInput) || 0)
  const sellImpact = quote ? quote.priceImpactPct : (tokenAmt > 0 ? Math.min((tokenAmt * livePrice / poolDepth) * 100, 49.9) : 0)
  const ethOut     = quote && side === 'sell' ? quote.ethAmount : (tokenAmt > 0 ? tokenAmt * livePrice * (1 - sellImpact / 180) * 0.993 : 0)
  const minEthOut  = ethOut * (1 - parseFloat(slippage) / 100)

  const impactPct  = side === 'buy' ? buyImpact : sellImpact
  const impactColor = impactPct === 0 ? 'rgba(255,255,255,0.28)'
    : impactPct < 1 ? '#4ade80' : impactPct < 3 ? '#fbbf24' : '#f87171'

  const canBuy  = ethAmt  > 0 && ethAmt  <= WALLET_ETH   && txState === 'idle'
  const canSell = tokenAmt > 0 && tokenAmt <= WALLET_TOKEN && txState === 'idle'
  const canTrade = side === 'buy' ? canBuy : canSell

  // Sync wagmi tx state into local txState
  useEffect(() => {
    if (isBuying || isSelling || buyConfirming || sellConfirming) setTxState('pending')
  }, [isBuying, isSelling, buyConfirming, sellConfirming])

  useEffect(() => {
    if (buySuccess || sellSuccess) {
      setTxState('success')
      // FIX 6: Invalidate relevant caches after trade success
      queryClient.invalidateQueries({ queryKey: ['artworks'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      if (art.artworkId) {
        queryClient.invalidateQueries({ queryKey: ['ohlcv', art.artworkId] })
      }
      setTimeout(() => { setTxState('idle'); setEthInput(''); setTokenInput('') }, 2200)
    }
  }, [buySuccess, sellSuccess, queryClient, art.artworkId])

  const handleExecute = useCallback(() => {
    if (!canTrade) return
    if (side === 'buy') {
      if (contractAddr) {
        // Real on-chain buy — slippage applied
        const ethWei  = toWei(ethInput)
        const minToks = BigInt(Math.floor(tokensOut * (1 - parseFloat(slippage) / 100) * 1e18))
        buy(ethWei, minToks)
      } else {
        // Contract not deployed yet — show pending UI
        setTxState('pending')
        setTimeout(() => { setTxState('success'); setTimeout(() => { setTxState('idle'); setEthInput('') }, 2200) }, 1700)
      }
    } else {
      if (contractAddr) {
        const tokenWei = parseEther(tokenInput || '0')
        const minEthWei = BigInt(Math.floor(minEthOut * 1e18))
        sell(tokenWei, minEthWei)
      } else {
        setTxState('pending')
        setTimeout(() => { setTxState('success'); setTimeout(() => { setTxState('idle'); setTokenInput('') }, 2200) }, 1700)
      }
    }
  }, [canTrade, side, contractAddr, ethInput, tokenInput, tokensOut, minEthOut, slippage, buy, sell])

  useEffect(() => {
    setEthInput('')
    setTokenInput('')
    setTxState('idle')
    setQuote(null)
  }, [art.id])

  // Reset input when switching side
  useEffect(() => {
    setEthInput('')
    setTokenInput('')
    setTxState('idle')
    setQuote(null)
  }, [side])

  // Side-specific colors
  const isBuy    = side === 'buy'
  const accent   = isBuy ? '#4ade80'              : '#f87171'
  const accentBg = isBuy ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
  const accentBdr= isBuy ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)'
  const btnBgAct = isBuy
    ? 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.08) 100%)'
    : 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.08) 100%)'
  const btnBgExec = txState==='success'
    ? 'linear-gradient(135deg, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.1) 100%)'
    : txState==='pending'
      ? 'rgba(212,175,55,0.08)'
      : canTrade ? btnBgAct : 'rgba(255,255,255,0.02)'

  const PARTICLES = [0,1,2,3,4,5]

  return (
    <motion.div
      className="flex flex-col h-full overflow-hidden"
      style={{
        borderLeft:'1px solid rgba(255,255,255,0.05)',
        background: glowBg,
      }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - r.left)
        mouseY.set(e.clientY - r.top)
      }}
    >
      {/* ── Header — accent line changes with side ── */}
      <div className="flex items-center justify-between px-3 shrink-0 relative overflow-hidden"
        style={{ height:30, background:'rgba(0,0,0,0.42)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <motion.div className="absolute top-0 left-0 right-0 h-[2px]"
          animate={{ background: isBuy
            ? 'linear-gradient(90deg,transparent,rgba(74,222,128,0.7),transparent)'
            : 'linear-gradient(90deg,transparent,rgba(248,113,113,0.7),transparent)' }}
          transition={{ duration:0.4 }}
        />
        <span className="font-mono text-[6.5px] tracking-[0.24em] uppercase" style={{ color:'rgba(255,255,255,0.22)' }}>{t.trade.tradeHeader}</span>
        <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.14)' }}>{art.ticker} / ETH</span>
      </div>

      {/* ── BUY / SELL toggle ── */}
      <div className="flex shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {(['buy','sell'] as const).map(s => {
          const active = side===s
          const c  = s==='buy'?'#4ade80':'#f87171'
          const bg = active?(s==='buy'?'rgba(34,197,94,0.11)':'rgba(239,68,68,0.11)'):'transparent'
          const bd = active?(s==='buy'?'rgba(74,222,128,0.35)':'rgba(248,113,113,0.35)'):'transparent'
          return (
            <motion.button key={s} type="button" onClick={() => setSide(s)}
              whileHover={{ background: s==='buy'?'rgba(34,197,94,0.07)':'rgba(239,68,68,0.07)' }}
              whileTap={{ scale:0.97 }}
              transition={{ type:'spring', stiffness:400, damping:18 }}
              className="flex-1 py-2 font-mono text-[9px] tracking-[0.18em] uppercase font-bold relative"
              style={{ background:bg, borderBottom:`2px solid ${bd}`, color:active?c:'rgba(255,255,255,0.22)' }}>
              <span className="mr-1 text-[7.5px]">{s==='buy'?'▲':'▼'}</span>
              {s==='buy' ? t.common.buy.toUpperCase() : t.common.sell.toUpperCase()}
            </motion.button>
          )
        })}
      </div>

      {/* ── Wallet strip — compact 1-row ── */}
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ height:28, background:'rgba(0,0,0,0.22)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.2)' }}>ETH</span>
          <span className="font-mono text-[10px] font-semibold" style={{ color: isBuy?'#4ade80':'rgba(255,255,255,0.5)' }}>
            {WALLET_ETH.toFixed(2)}
          </span>
        </div>
        <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.1)' }}>·</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.2)' }}>{art.ticker}</span>
          <span className="font-mono text-[10px] font-semibold" style={{ color: !isBuy?'#f87171':'rgba(255,255,255,0.5)' }}>
            {WALLET_TOKEN.toFixed(4)}
          </span>
        </div>
        <span className="font-mono text-[6px]" style={{ color:'rgba(255,255,255,0.1)' }}>0x4f2…a91</span>
      </div>

      {/* ── Form body — BUY / SELL cross-fade ── */}
      <div className="px-3 flex flex-col gap-2 mt-2 flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {isBuy ? (
            /* ─── BUY FORM ─── */
            <motion.div key="buy-form" className="flex flex-col gap-2"
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.15 }}>

              {/* Pay ETH */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[7px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.28)' }}>{t.trade.youPay}</span>
                  <span className="font-mono text-[7px]" style={{ color:'rgba(74,222,128,0.5)' }}>{t.trade.bal}: {WALLET_ETH.toFixed(2)} ETH</span>
                </div>
                <div className="relative">
                  <motion.input
                    type="number" min="0" step="0.001"
                    value={ethInput}
                    onChange={e => setEthInput(e.target.value)}
                    placeholder="0.0000"
                    className="w-full bg-transparent font-mono text-[15px] px-3 py-2 outline-none pr-12"
                    style={{ border:'1px solid rgba(74,222,128,0.16)', background:'rgba(74,222,128,0.03)', color:'rgba(255,255,255,0.88)', caretColor:'#4ade80' }}
                    whileFocus={{ outline:'1px solid rgba(74,222,128,0.35)', boxShadow:'0 0 0 3px rgba(74,222,128,0.05)' }}
                    transition={{ duration:0.2 }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold"
                    style={{ color:'rgba(74,222,128,0.55)' }}>ETH</span>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[0.1, 0.25, 0.5, 1.0].map(amt => (
                    <motion.button key={amt} type="button" onClick={() => setEthInput(String(amt))}
                      whileHover={{ scale:1.05, background:'rgba(74,222,128,0.1)' }}
                      whileTap={{ scale:0.95 }}
                      transition={{ type:'spring', stiffness:420, damping:20 }}
                      className="py-0.5 font-mono text-[7px]"
                      style={{ border:'1px solid rgba(74,222,128,0.14)', color:'rgba(74,222,128,0.45)', background:'rgba(74,222,128,0.02)' }}>
                      {amt} ETH
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-5 h-5 flex items-center justify-center"
                  style={{ border:'1px solid rgba(74,222,128,0.15)', background:'rgba(74,222,128,0.04)' }}>
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none"
                    stroke="rgba(74,222,128,0.45)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                </div>
              </div>

              {/* Receive token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[7px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.28)' }}>{t.trade.youReceive}</span>
                  <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.18)' }}>{t.trade.estimate}</span>
                </div>
                <div style={{ border:'1px solid rgba(74,222,128,0.1)', background:'rgba(74,222,128,0.03)', padding:'8px 12px' }}>
                  <div className="flex items-center justify-between">
                    <AnimatePresence mode="wait">
                      <motion.span key={Math.round(tokensOut*10000)}
                        initial={{ opacity:0.4 }} animate={{ opacity:1 }} exit={{ opacity:0.4 }}
                        transition={{ duration:0.16 }}
                        className="font-mono text-[15px]"
                        style={{ color: tokensOut>0?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.18)' }}>
                        {tokensOut>0 ? tokensOut.toFixed(4) : '0.0000'}
                      </motion.span>
                    </AnimatePresence>
                    <span className="font-mono text-[9px] font-bold" style={{ color:art.phaseColor }}>{art.ticker}</span>
                  </div>
                </div>
              </div>

              {/* Summary — 3 rows */}
              <div className="flex flex-col gap-1 py-1.5 px-2.5"
                style={{ background:'rgba(74,222,128,0.03)', border:'1px solid rgba(74,222,128,0.08)' }}>
                {[
                  { label:t.trade.price,        value: quoteFetching ? '…' : `${fmtETH(quote?.pricePerToken ?? livePrice)} ETH` },
                  { label:t.trade.impact,        value: quoteFetching ? '…' : (ethAmt>0?`${buyImpact.toFixed(2)}%`:'—'), color:impactColor },
                  { label:t.trade.minOut,        value: quoteFetching ? '…' : (tokensOut>0?`${minReceived.toFixed(3)} ${art.ticker}`:'—') },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.22)' }}>{label}</span>
                    <span className="font-mono text-[7px]" style={{ color: color??'rgba(255,255,255,0.5)' }}>{value}</span>
                  </div>
                ))}
                {quote?.wouldGraduate && (
                  <div className="flex items-center gap-1.5 mt-1 px-2 py-1"
                    style={{ background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.35)' }}>
                    <span style={{ fontSize:8, color:'#D4AF37' }}>✦</span>
                    <span className="font-mono text-[7px]" style={{ color:'#D4AF37' }}>{t.trade.graduationWarning}</span>
                  </div>
                )}
              </div>
            </motion.div>

          ) : (
            /* ─── SELL FORM ─── */
            <motion.div key="sell-form" className="flex flex-col gap-2"
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.15 }}>

              {/* Sell token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[7px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.28)' }}>{t.trade.youSell}</span>
                  <span className="font-mono text-[7px]" style={{ color:'rgba(248,113,113,0.5)' }}>{t.trade.bal}: {WALLET_TOKEN.toFixed(4)} {art.ticker}</span>
                </div>
                <div className="relative">
                  <motion.input
                    type="number" min="0" step="0.0001"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder="0.0000"
                    className="w-full bg-transparent font-mono text-[15px] px-3 py-2 outline-none pr-16"
                    style={{ border:'1px solid rgba(248,113,113,0.18)', background:'rgba(248,113,113,0.03)', color:'rgba(255,255,255,0.88)', caretColor:'#f87171' }}
                    whileFocus={{ outline:'1px solid rgba(248,113,113,0.38)', boxShadow:'0 0 0 3px rgba(248,113,113,0.05)' }}
                    transition={{ duration:0.2 }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[7.5px] font-bold"
                    style={{ color:'rgba(248,113,113,0.55)' }}>{art.ticker}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[25,50,75,100].map(pct => (
                    <motion.button key={pct} type="button"
                      onClick={() => setTokenInput((WALLET_TOKEN*pct/100).toFixed(4))}
                      whileHover={{ scale:1.05, background:'rgba(248,113,113,0.1)' }}
                      whileTap={{ scale:0.95 }}
                      transition={{ type:'spring', stiffness:420, damping:20 }}
                      className="py-0.5 font-mono text-[7px]"
                      style={{ border:'1px solid rgba(248,113,113,0.14)', color:'rgba(248,113,113,0.45)', background:'rgba(248,113,113,0.02)' }}>
                      {pct===100?t.trade.max:`${pct}%`}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Arrow up */}
              <div className="flex justify-center">
                <div className="w-5 h-5 flex items-center justify-center"
                  style={{ border:'1px solid rgba(248,113,113,0.15)', background:'rgba(248,113,113,0.04)' }}>
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none"
                    stroke="rgba(248,113,113,0.45)" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                </div>
              </div>

              {/* Receive ETH */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[7px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.28)' }}>{t.trade.youReceive}</span>
                  <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.18)' }}>{t.trade.estimate}</span>
                </div>
                <div style={{ border:'1px solid rgba(248,113,113,0.1)', background:'rgba(248,113,113,0.03)', padding:'8px 12px' }}>
                  <div className="flex items-center justify-between">
                    <AnimatePresence mode="wait">
                      <motion.span key={Math.round(ethOut*100000)}
                        initial={{ opacity:0.4 }} animate={{ opacity:1 }} exit={{ opacity:0.4 }}
                        transition={{ duration:0.16 }}
                        className="font-mono text-[15px]"
                        style={{ color: ethOut>0?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.18)' }}>
                        {ethOut>0 ? ethOut.toFixed(5) : '0.00000'}
                      </motion.span>
                    </AnimatePresence>
                    <span className="font-mono text-[9px] font-bold" style={{ color:'rgba(74,222,128,0.7)' }}>ETH</span>
                  </div>
                </div>
              </div>

              {/* Summary — 3 rows */}
              <div className="flex flex-col gap-1 py-1.5 px-2.5"
                style={{ background:'rgba(248,113,113,0.03)', border:'1px solid rgba(248,113,113,0.08)' }}>
                {[
                  { label:t.trade.price,    value: quoteFetching ? '…' : `${fmtETH(quote?.pricePerToken ?? livePrice)} ETH` },
                  { label:t.trade.impact,   value: quoteFetching ? '…' : (tokenAmt>0?`${sellImpact.toFixed(2)}%`:'—'), color:impactColor },
                  { label:t.trade.minOut,   value: quoteFetching ? '…' : (ethOut>0?`${minEthOut.toFixed(4)} ETH`:'—') },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.22)' }}>{label}</span>
                    <span className="font-mono text-[7px]" style={{ color: color??'rgba(255,255,255,0.5)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Slippage ── */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[6.5px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.18)' }}>{t.trade.slippage}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {['0.5','1.0','2.0'].map(s => {
              const active = slippage===s
              return (
                <motion.button key={s} type="button" onClick={() => setSlippage(s)}
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  transition={{ type:'spring', stiffness:420, damping:18 }}
                  className="py-0.5 font-mono text-[7.5px]"
                  style={{
                    border:`1px solid ${active?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.07)'}`,
                    background: active?'rgba(212,175,55,0.06)':'transparent',
                    color:      active?'#D4AF37':'rgba(255,255,255,0.28)',
                  }}>
                  {s}%
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ── Execute button ── */}
        <div className="relative overflow-hidden shrink-0">
          <motion.button
            type="button" onClick={handleExecute} disabled={!canTrade}
            whileHover={canTrade?{ scale:1.012 }:{}}
            whileTap={canTrade?{ scale:0.984 }:{}}
            transition={{ type:'spring', stiffness:380, damping:18 }}
            className="w-full py-3 font-mono text-[9px] tracking-[0.2em] uppercase font-bold overflow-hidden"
            style={{
              background: txState==='success'?'linear-gradient(135deg,rgba(34,197,94,0.22),rgba(34,197,94,0.1))'
                :txState==='pending'?'rgba(212,175,55,0.08)'
                :canTrade?btnBgExec:'rgba(255,255,255,0.02)',
              border: txState==='success'?'1px solid rgba(34,197,94,0.45)'
                :txState==='pending'?'1px solid rgba(212,175,55,0.28)'
                :canTrade?`1px solid ${accentBdr}`:'1px solid rgba(255,255,255,0.06)',
              color: txState==='success'?'#4ade80':txState==='pending'?'#D4AF37':canTrade?accent:'rgba(255,255,255,0.14)',
              cursor: canTrade?'pointer':'not-allowed',
            }}>
            <AnimatePresence mode="wait">
              {txState==='idle'&&<motion.span key="idle" initial={{ opacity:0,y:5 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }}>
                {isBuy?`▲ ${t.common.buy.toUpperCase()} ${art.ticker}`:`▼ ${t.common.sell.toUpperCase()} ${art.ticker}`}
              </motion.span>}
              {txState==='pending'&&<motion.span key="pending" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate:360 }} transition={{ duration:0.9,repeat:Infinity,ease:'linear' }}
                  className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full"/>
                {t.trade.confirming}
              </motion.span>}
              {txState==='success'&&<motion.span key="success" initial={{ opacity:0,scale:0.88 }} animate={{ opacity:1,scale:1 }}
                className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                {t.trade.orderExecuted}
              </motion.span>}
            </AnimatePresence>
          </motion.button>

          {/* Confetti */}
          <AnimatePresence>
            {txState==='success'&&PARTICLES.map(i=>(
              <motion.span key={i} className="absolute bottom-2 pointer-events-none rounded-full"
                style={{ width:4,height:4,left:`${14+i*13}%`,
                  background:isBuy?(i%3===0?'#4ade80':i%3===1?'#D4AF37':'#a78bfa'):(i%3===0?'#f87171':i%3===1?'#fbbf24':'#fb923c') }}
                initial={{ y:0,opacity:1 }}
                animate={{ y:-(20+i*6),opacity:0,x:(i%2===0?1:-1)*(4+i*3) }}
                transition={{ duration:0.55,delay:i*0.04,ease:'easeOut' }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ── Graduation bar — ultra-compact ── */}
        <div className="shrink-0 pb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-mono text-[6px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.14)' }}>{t.trade.graduation}</span>
            <span className="font-mono text-[7px] font-semibold" style={{ color:art.phaseColor }}>{art.progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
            <motion.div className="h-full"
              style={{ background:`linear-gradient(90deg,${art.phaseColor}60,${art.phaseColor})` }}
              initial={{ width:0 }}
              animate={{ width:`${art.progress}%` }}
              transition={{ duration:1.1, ease:[0.25,0.46,0.45,0.94] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Main TradePage
// ─────────────────────────────────────────────────────────────────
export function TradePage() {
  const { t } = useLanguage()
  // ── Backend data (falls back to mock when API unreachable) ────────
  const { artworks: _rawArtworks } = useMarketplace({ initialLimit: 50 })
  const _apiArtworks = useMemo(
    () => _rawArtworks.map(adaptTradeArtwork),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_rawArtworks],
  )
  const ARTWORKS = _apiArtworks.length > 0 ? _apiArtworks : ARTWORKS_MOCK

  const [selectedId,  setSelectedId]  = useState(1)   // first artwork
  const [chartRange,  setChartRange]  = useState<CandleRange>('1D')
  const [ohlcvData,   setOhlcvData]   = useState<OhlcvCandle[] | null>(null)
  const [livePrices,  setLivePrices]  = useState<Record<number,number>>(
    () => Object.fromEntries(ARTWORKS_MOCK.map(a => [a.id, a.basePrice]))
  )
  // Debounced sort prices — update every 8 s for smooth list reorder
  const [sortPrices,  setSortPrices]  = useState<Record<number,number>>(
    () => Object.fromEntries(ARTWORKS_MOCK.map(a => [a.id, a.basePrice]))
  )
  const [trades,      setTrades]      = useState<RecentTrade[]>(
    () => seedTrades(ARTWORKS_MOCK[0].basePrice, 1)
  )
  const [bookTick,    setBookTick]    = useState(0)

  // Ref so live-trades interval can read current prices without stale closure
  const livePricesRef  = useRef(livePrices)
  const apiSyncedRef   = useRef(false)
  useEffect(() => { livePricesRef.current = livePrices }, [livePrices])

  // Seed price maps once when real API data first arrives
  useEffect(() => {
    if (_apiArtworks.length > 0 && !apiSyncedRef.current) {
      apiSyncedRef.current = true
      setSelectedId(1)
      setLivePrices(Object.fromEntries(_apiArtworks.map(a => [a.id, a.basePrice])))
      setSortPrices(Object.fromEntries(_apiArtworks.map(a => [a.id, a.basePrice])))
    }
  }, [_apiArtworks])

  // Measure chart container height
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartH, setChartH] = useState(380)
  useEffect(() => {
    const el = chartContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setChartH(e.contentRect.height || 380))
    ro.observe(el)
    setChartH(el.clientHeight || 380)
    return () => ro.disconnect()
  }, [])

  const selectedArt = ARTWORKS.find(a => a.id===selectedId) ?? ARTWORKS[0]
  const livePrice   = livePrices[selectedId] ?? selectedArt.basePrice

  // Fetch OHLCV từ BE khi artwork có UUID thật hoặc range thay đổi
  useEffect(() => {
    const artworkUuid = selectedArt.artworkId
    if (!artworkUuid) { setOhlcvData(null); return }

    const tfMap: Record<CandleRange, OhlcvTimeframe> = {
      '1H': '1m', '6H': '15m', '1D': '1h', '7D': '4h',
    }
    const timeframe = tfMap[chartRange]

    tradeService.ohlcv(artworkUuid, { timeframe, limit: 200 })
      .then(candles => setOhlcvData(candles.length > 0 ? candles : null))
      .catch(() => setOhlcvData(null))
  }, [selectedArt.artworkId, chartRange])

  // ── Price simulation (3-tier) ────────────────────────────────────
  useEffect(() => {
    const MAX = 18
    const t1 = setInterval(() => {
      setLivePrices(prev => {
        const next = {...prev}
        for (const art of ARTWORKS) {
          const p   = prev[art.id] ?? art.basePrice
          const cap = art.basePrice * MAX
          next[art.id] = Math.max(Math.min(p*(1+(Math.random()-0.49)*0.04), cap), art.basePrice*0.25)
        }
        return next
      })
    }, 2400)
    const t2 = setInterval(() => {
      const art = ARTWORKS[Math.floor(Math.random()*ARTWORKS.length)]
      setLivePrices(prev => ({
        ...prev,
        [art.id]: Math.min(prev[art.id]*(1.05+Math.random()*0.23), art.basePrice*MAX),
      }))
    }, 5000)
    const t3 = setInterval(() => {
      setLivePrices(prev => {
        const next = {...prev}
        for (const art of ARTWORKS) {
          const p = prev[art.id] ?? art.basePrice
          next[art.id] = p + (art.basePrice*3.5 - p)*0.16
        }
        return next
      })
    }, 9000)
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3) }
  }, [])

  // Debounced sort-price snapshot every 8 s
  useEffect(() => {
    const id = setInterval(() => setSortPrices({...livePricesRef.current}), 8000)
    return () => clearInterval(id)
  }, [])

  // FIX 10: Load real trade history from API, refresh every 15s
  useEffect(() => {
    const artworkUuid = selectedArt.artworkId
    if (!artworkUuid) {
      // Fallback to mock data for artworks without UUID
      setTrades(seedTrades(livePricesRef.current[selectedId] ?? selectedArt.basePrice, selectedId))
      return
    }

    const loadHistory = () => {
      tradeService.history(artworkUuid, 20, 0)
        .then(result => {
          const records = result.data ?? []
          if (records.length === 0) {
            setTrades(seedTrades(livePricesRef.current[selectedId] ?? selectedArt.basePrice, selectedId))
            return
          }
          const mapped: RecentTrade[] = records.map((r, i) => ({
            id:     r.id,
            side:   r.tx_type === 'BUY' ? 'buy' : 'sell',
            price:  parseFloat(r.price_per_share) || 0,
            eth:    parseFloat(r.eth_amount) || 0,
            tokens: parseFloat(r.share_amount) || 0,
            wallet: r.wallet_address
              ? `${r.wallet_address.slice(0, 6)}…${r.wallet_address.slice(-4)}`
              : `0x????`,
            ago:    Math.floor((Date.now() - new Date(r.timestamp).getTime()) / 1000),
          }))
          setTrades(mapped)
        })
        .catch(() => {
          setTrades(seedTrades(livePricesRef.current[selectedId] ?? selectedArt.basePrice, selectedId))
        })
    }

    loadHistory()
    const refreshId = setInterval(loadHistory, 15_000)
    return () => clearInterval(refreshId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedArt.artworkId])

  // Stream live trades (stale-closure safe)
  useEffect(() => {
    const id = setInterval(() => {
      const p = livePricesRef.current[selectedId] ?? selectedArt.basePrice
      const t: RecentTrade = {
        id:     `live-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        side:   Math.random()>0.38 ? 'buy' : 'sell',
        price:  p*(1+(Math.random()-0.5)*0.009),
        eth:    Math.random()*0.65+0.01,
        tokens: 0,
        wallet: `0x${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')}…${Math.floor(Math.random()*0xffff).toString(16).padStart(4,'0')}`,
        ago:    0,
      }
      t.tokens = t.eth / t.price
      setTrades(prev => [t, ...prev.slice(0, 28)])
    }, 3000+Math.random()*1800)
    return () => clearInterval(id)
  }, [selectedId, selectedArt.basePrice])

  // Order book refresh every 6 s
  useEffect(() => {
    const id = setInterval(() => setBookTick(t => t+1), 6000)
    return () => clearInterval(id)
  }, [])

  const RANGES: CandleRange[] = ['1H','6H','1D','7D']

  return (
    /* Page entrance: columns stagger in */
    <motion.div
      className="flex flex-col overflow-hidden"
      style={{ height:'calc(100vh - 68px)', background:'#070707', marginTop:68, paddingTop:12 }}
      variants={PAGE_V}
      initial="hidden"
      animate="show"
    >
      {/* Price header — cross-fades on artwork change */}
      <motion.div variants={COL_V}>
        <AnimatePresence mode="wait">
          <motion.div key={`header-${selectedId}`}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.2 }}>
            <PriceHeader art={selectedArt} livePrice={livePrice}/>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 3-column main area */}
      <div className="flex flex-1 min-h-0">

        {/* Left: Token Picker */}
        <motion.div variants={COL_V} className="shrink-0 overflow-hidden" style={{ width:252 }}>
          <TokenPickerPanel
            artworks={ARTWORKS}
            livePrices={livePrices}
            sortPrices={sortPrices}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </motion.div>

        {/* Center: Chart + Bottom Panel */}
        <motion.div variants={COL_V} className="flex-1 min-w-0 flex flex-col min-h-0">

          {/* Timeframe bar */}
          <div className="flex items-center shrink-0 px-3 gap-1"
            style={{ height:36, background:'rgba(0,0,0,0.32)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            {RANGES.map(r => (
              <motion.button key={r} type="button" onClick={() => setChartRange(r)}
                whileTap={{ scale:0.94 }}
                className="relative px-3 h-full font-mono text-[8px] tracking-[0.16em] transition-colors"
                style={{ color: chartRange===r ? '#D4AF37' : 'rgba(255,255,255,0.22)' }}>
                {r}
                {chartRange===r && (
                  <motion.div layoutId="range-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background:'#D4AF37' }}/>
                )}
              </motion.button>
            ))}
            <div className="ml-auto flex items-center gap-2 pr-1">
              <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.16)' }}>
                {selectedArt.ticker} / ETH · {t.trade.candlestick}
              </span>
            </div>
          </div>

          {/* Chart — cross-fades on artwork or range change */}
          <div ref={chartContainerRef} className="flex-1 min-h-0 overflow-hidden"
            style={{ background:'rgba(0,0,0,0.12)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedId}-${chartRange}`}
                className="w-full h-full"
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.22 }}>
                <CandlestickChart
                  artId={selectedArt.id}
                  sparkline={selectedArt.sparkline}
                  phaseColor={selectedArt.phaseColor}
                  range={chartRange}
                  height={chartH}
                  apiCandles={ohlcvData ?? undefined}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <BottomPanel
            art={selectedArt} livePrice={livePrice}
            trades={trades} bookTick={bookTick}
          />
        </motion.div>

        {/* Right: Trade Panel */}
        <motion.div variants={COL_V} className="shrink-0 overflow-hidden" style={{ width:302 }}>
          <TradePanel art={selectedArt} livePrice={livePrice}/>
        </motion.div>
      </div>
    </motion.div>
  )
}
