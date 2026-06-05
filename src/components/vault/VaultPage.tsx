'use client'
// ─────────────────────────────────────────────────────────────────
//  VaultPage.tsx  —  Portfolio dashboard
//  Added: portfolio chart, sortable columns, quick trade, realized P&L
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PHASE_COLOR, Phase } from '../marketplace/ArtCard'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useEthBalance } from '@/web3/hooks/useContract'
import type { PortfolioHolding } from '@/types/api'

// ── Types ─────────────────────────────────────────────────────────
interface Holding {
  id:       number
  ticker:   string
  title:    string
  phase:    Phase
  qty:      number
  avgBuy:   number
  curPrice: number
}

interface TxRecord {
  id:     string
  ticker: string
  side:   'buy' | 'sell'
  price:  number
  eth:    number
  date:   string
}

type SortKey = 'ticker' | 'qty' | 'avgBuy' | 'curPrice' | 'value' | 'pnl' | 'pnlPct'
type SortDir = 'asc' | 'desc'
type Timeframe = '7D' | '30D' | '90D'

// ── Mock data (fallback when API unreachable) ─────────────────────
const HOLDINGS_MOCK: Holding[] = [
  { id:1, ticker:'$PALE',    title:'Pale Architecture',      phase:'Migration',    qty:0.4518, avgBuy:65.20, curPrice:85.84 },
  { id:2, ticker:'$BLOOM',   title:'Bloom & Blade',          phase:'FOMO',         qty:1.2200, avgBuy:2.88,  curPrice:4.12  },
  { id:3, ticker:'$THRESH',  title:'Threshold Fragment',     phase:'Migration',    qty:0.1840, avgBuy:18.40, curPrice:31.50 },
  { id:4, ticker:'$NOCTURNE',title:'Nocturne at the Bridge', phase:'FOMO',         qty:3.5500, avgBuy:1.92,  curPrice:2.45  },
  { id:5, ticker:'$CONV1',   title:'Convergence I',          phase:'Accumulation', qty:8.2000, avgBuy:1.10,  curPrice:1.32  },
  { id:6, ticker:'$SIGNAL',  title:'Signal Noise',           phase:'Accumulation', qty:22.000, avgBuy:0.51,  curPrice:0.44  },
]

// ── Adapter: backend PortfolioHolding → Holding ───────────────────
function adaptHolding(h: PortfolioHolding, index: number): Holding {
  const pnlPct  = parseFloat(h.unrealized_pnl_pct)
  const phase: Phase =
    pnlPct >= 20 ? 'Migration' :
    pnlPct >=  5 ? 'FOMO' :
                   'Accumulation'
  return {
    id:       index + 1,
    ticker:   h.artwork_title
                ? '$' + h.artwork_title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,6)
                : `$TKN${index + 1}`,
    title:    h.artwork_title,
    phase,
    qty:      parseFloat(h.share_balance),
    avgBuy:   parseFloat(h.avg_buy_price),
    curPrice: parseFloat(h.current_price),
  }
}

const TXS: TxRecord[] = [
  { id:'t1', ticker:'$PALE',    side:'buy',  price:65.20, eth:0.420, date:'2026-05-28' },
  { id:'t2', ticker:'$BLOOM',   side:'buy',  price:2.88,  eth:0.350, date:'2026-05-26' },
  { id:'t3', ticker:'$THRESH',  side:'buy',  price:18.40, eth:0.338, date:'2026-05-22' },
  { id:'t4', ticker:'$SIGNAL',  side:'buy',  price:0.51,  eth:0.112, date:'2026-05-20' },
  { id:'t5', ticker:'$NOCTURNE',side:'sell', price:2.10,  eth:0.210, date:'2026-05-18' },
  { id:'t6', ticker:'$CONV1',   side:'buy',  price:1.10,  eth:0.220, date:'2026-05-15' },
  { id:'t7', ticker:'$PALE',    side:'buy',  price:58.40, eth:0.584, date:'2026-05-10' },
  { id:'t8', ticker:'$BLOOM',   side:'sell', price:3.55,  eth:0.142, date:'2026-05-08' },
]

const REALIZED_PNL = 0.312   // ETH — from closed positions
const ETH_USD      = 3_420
const ETH_BALANCE  = 4.20

function fmtETH(v: number) { return v >= 1 ? v.toFixed(3) : v.toFixed(4) }
function fmtUSD(eth: number) {
  return '$' + (eth * ETH_USD).toLocaleString('en', { maximumFractionDigits: 0 })
}

// ── Portfolio chart data (deterministic sine-wave) ────────────────
function genHistory(days: number, end: number): number[] {
  const pts: number[] = []
  for (let i = 0; i <= days; i++) {
    const t  = i / days
    const trend = end * (0.56 + 0.44 * t)
    const w1 = Math.sin(i * 0.72 + 1.2) * end * 0.07
    const w2 = Math.cos(i * 0.31 + 0.8) * end * 0.04
    pts.push(Math.max(end * 0.32, trend + w1 + w2))
  }
  pts[pts.length - 1] = end
  return pts
}

// ── Portfolio chart component ─────────────────────────────────────
function PortfolioChart({ totalValue, pnlPct }: { totalValue: number; pnlPct: number }) {
  const [tf, setTf] = useState<Timeframe>('30D')

  const pts = useMemo(() => {
    const days = tf === '7D' ? 7 : tf === '30D' ? 30 : 90
    return genHistory(days, totalValue)
  }, [tf, totalValue])

  const W = 700, H = 88
  const minV = Math.min(...pts) * 0.98
  const maxV = Math.max(...pts) * 1.01
  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - ((v - minV) / (maxV - minV || 1)) * (H - 10) - 5,
  }))

  let line = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  for (let i = 1; i < coords.length; i++) {
    const p = coords[i - 1], c = coords[i]
    const mx = (p.x + c.x) / 2
    line += ` C ${mx.toFixed(1)} ${p.y.toFixed(1)} ${mx.toFixed(1)} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
  }
  const fill = `${line} L ${W} ${H} L 0 ${H} Z`

  const isUp    = pnlPct >= 0
  const color   = isUp ? '#4ade80' : '#f87171'
  const lastPt  = coords[coords.length - 1]

  // Hover label
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const hoverPt  = hoverIdx !== null ? coords[hoverIdx]  : null
  const hoverVal = hoverIdx !== null ? pts[hoverIdx]     : null

  return (
    <div className="shrink-0 mx-4 mb-2"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.32)' }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[6.5px] tracking-[0.2em] uppercase"
            style={{ color: 'rgba(255,255,255,0.2)' }}>Portfolio Value</span>
          <span className="font-sans text-[13px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em' }}>
            {fmtETH(totalValue)} ETH
          </span>
          <span className="font-mono text-[9px] font-semibold"
            style={{ color }}>
            {isUp ? '+' : ''}{pnlPct.toFixed(2)}%
          </span>
          {hoverVal && (
            <motion.span key={hoverIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-mono text-[8.5px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              · {fmtETH(hoverVal)} ETH
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(['7D', '30D', '90D'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTf(t)}
              className="px-2 py-0.5 font-mono text-[7px]"
              style={{
                background: tf === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                border:     tf === t ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                color:      tf === t ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div className="relative" style={{ height: 88 }}
        onMouseLeave={() => setHoverIdx(null)}>
        <svg width="100%" height="88" viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none" style={{ display: 'block' }}
          onMouseMove={e => {
            const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
            const xPct = (e.clientX - rect.left) / rect.width
            setHoverIdx(Math.min(pts.length - 1, Math.round(xPct * (pts.length - 1))))
          }}>
          <defs>
            <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
            </linearGradient>
          </defs>
          <path d={fill} fill="url(#vaultGrad)"/>
          <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>

          {/* End dot */}
          <circle cx={lastPt.x} cy={lastPt.y} r="3" fill={color}/>

          {/* Hover vertical line */}
          {hoverPt && (
            <>
              <line x1={hoverPt.x} y1={0} x2={hoverPt.x} y2={H}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3"/>
              <circle cx={hoverPt.x} cy={hoverPt.y} r="3.5" fill={color} opacity="0.9"/>
            </>
          )}
        </svg>
      </div>
    </div>
  )
}

// ── Allocation donut ──────────────────────────────────────────────
function AllocationDonut({ holdings }: { holdings: Holding[] }) {
  const total = holdings.reduce((s, h) => s + h.qty * h.curPrice, 0)
  type Seg = { path: string; color: string; pct: number; ticker: string }
  const segments = useMemo<Seg[]>(() => {
    let cum = -90
    return holdings.map(h => {
      const val = h.qty * h.curPrice
      const pct = val / total
      const angle = pct * 360
      const start = cum
      cum += angle
      const r = 44, cx = 56, cy = 56
      const x1 = cx + r * Math.cos((start * Math.PI) / 180)
      const y1 = cy + r * Math.sin((start * Math.PI) / 180)
      const x2 = cx + r * Math.cos(((start + angle) * Math.PI) / 180)
      const y2 = cy + r * Math.sin(((start + angle) * Math.PI) / 180)
      const large = angle > 180 ? 1 : 0
      return {
        path:   `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
        color:   PHASE_COLOR[h.phase],
        pct,
        ticker: h.ticker,
      }
    })
  }, [holdings, total])

  return (
    <div className="flex flex-col h-full" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between px-3 shrink-0"
        style={{ height: 36, background: 'rgba(0,0,0,0.38)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="font-mono text-[7px] tracking-[0.2em] uppercase"
          style={{ color: 'rgba(255,255,255,0.22)' }}>ALLOCATION</span>
        <span className="font-mono text-[7px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {fmtUSD(total)}
        </span>
      </div>
      <div className="flex justify-center items-center pt-4 pb-2">
        <svg width="120" height="120" viewBox="0 0 112 112">
          {segments.map((s, i) => (
            <motion.path key={i} d={s.path} fill={s.color} opacity={0.78}
              initial={{ opacity: 0 }} animate={{ opacity: 0.78 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}/>
          ))}
          <circle cx="56" cy="56" r="30" fill="#070707"/>
          <text x="56" y="52" textAnchor="middle" fontFamily="monospace"
            fontSize="8" fill="rgba(255,255,255,0.45)">TOTAL</text>
          <text x="56" y="65" textAnchor="middle" fontFamily="monospace"
            fontSize="9" fontWeight="bold" fill="rgba(255,255,255,0.7)">
            {fmtETH(total)}
          </text>
        </svg>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-2" style={{ scrollbarWidth: 'none' }}>
        {holdings.map(h => {
          const val = h.qty * h.curPrice
          const pct = (val / total * 100).toFixed(1)
          return (
            <div key={h.id} className="flex items-center justify-between py-1.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-sm" style={{ background: PHASE_COLOR[h.phase] }}/>
                <span className="font-mono text-[8.5px]" style={{ color: PHASE_COLOR[h.phase] }}>
                  {h.ticker}
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{pct}%</div>
                <div className="font-mono text-[7px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{fmtUSD(val)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sortable column header ────────────────────────────────────────
function SortHeader({
  label, sk, sortKey, sortDir, onSort, flex, minWidth,
}: {
  label: string; sk: SortKey; sortKey: SortKey; sortDir: SortDir
  onSort: (k: SortKey) => void; flex?: number; minWidth?: number
}) {
  const active = sortKey === sk
  return (
    <button type="button" onClick={() => onSort(sk)}
      className="flex items-center gap-0.5 font-mono text-[6.5px] tracking-wider cursor-pointer select-none"
      style={{ color: active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)', flex, minWidth }}>
      {label}
      {active && (
        <span style={{ fontSize: 8, marginLeft: 1, color: '#D4AF37' }}>
          {sortDir === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  )
}

// ── Variants ──────────────────────────────────────────────────────
const ROW_V = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { type: 'tween' as const, duration: 0.25, ease: [0.215,0.61,0.355,1.0] as [number,number,number,number] } },
}
const TABLE_V = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
}

// ─────────────────────────────────────────────────────────────────
//  Main VaultPage
// ─────────────────────────────────────────────────────────────────
export function VaultPage() {
  // ── Backend portfolio data ────────────────────────────────────────
  const portfolio  = usePortfolio()
  const { formatted: walletEthBalance } = useEthBalance()
  const _apiHoldings = useMemo(
    () => portfolio.holdings.map(adaptHolding),
    [portfolio.holdings],
  )
  // Shadow: real data when available, mock otherwise
  const HOLDINGS = _apiHoldings.length > 0 ? _apiHoldings : HOLDINGS_MOCK

  const [activeTab, setActiveTab]   = useState<'holdings' | 'history'>('holdings')
  const [sortKey,   setSortKey]     = useState<SortKey>('value')
  const [sortDir,   setSortDir]     = useState<SortDir>('desc')

  // Use API P&L numbers when available; fall back to local computation
  const totalValue = portfolio.totalValue ?? HOLDINGS.reduce((s, h) => s + h.qty * h.curPrice, 0)
  const totalCost  = portfolio.totalCost  ?? HOLDINGS.reduce((s, h) => s + h.qty * h.avgBuy,   0)
  const unrealPnL  = portfolio.pnlEth     ?? (totalValue - totalCost)
  const unrealPct  = portfolio.pnlPct     ?? ((totalValue - totalCost) / (totalCost || 1) * 100)
  const totalPnL   = unrealPnL + REALIZED_PNL

  const STATS = [
    { label: 'PORTFOLIO VALUE', value: fmtETH(totalValue) + ' ETH', sub: fmtUSD(totalValue),         up: true          },
    { label: 'UNREALIZED P&L',  value: (unrealPnL >= 0 ? '+' : '') + fmtETH(unrealPnL) + ' ETH',    sub: (unrealPct >= 0 ? '+' : '') + unrealPct.toFixed(1) + '%', up: unrealPnL >= 0 },
    { label: 'REALIZED P&L',    value: '+' + fmtETH(REALIZED_PNL)  + ' ETH',                         sub: '+' + fmtUSD(REALIZED_PNL), up: true              },
    { label: 'ETH BALANCE',     value: walletEthBalance.toFixed(4) + ' ETH',                          sub: fmtUSD(walletEthBalance),   up: true              },
  ]

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const sortedHoldings = useMemo(() => {
    return [...HOLDINGS].sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0
      if (sortKey === 'ticker')  { av = a.ticker;  bv = b.ticker }
      if (sortKey === 'qty')     { av = a.qty;     bv = b.qty    }
      if (sortKey === 'avgBuy')  { av = a.avgBuy;  bv = b.avgBuy }
      if (sortKey === 'curPrice'){ av = a.curPrice; bv = b.curPrice }
      if (sortKey === 'value')   { av = a.qty * a.curPrice;              bv = b.qty * b.curPrice }
      if (sortKey === 'pnl')     { av = a.qty * (a.curPrice - a.avgBuy); bv = b.qty * (b.curPrice - b.avgBuy) }
      if (sortKey === 'pnlPct')  { av = (a.curPrice - a.avgBuy) / a.avgBuy; bv = (b.curPrice - b.avgBuy) / b.avgBuy }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [sortKey, sortDir])

  return (
    <motion.div
      className="flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 68px)', marginTop: 68, background: '#070707', paddingTop: 8 }}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Stats row */}
      <motion.div className="grid grid-cols-4 gap-px shrink-0 mx-4 mb-2"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        variants={TABLE_V} initial="hidden" animate="show">
        {STATS.map(s => (
          <motion.div key={s.label} variants={ROW_V}
            className="px-4 py-2.5" style={{ background: 'rgba(8,8,8,0.9)' }}>
            <div className="font-mono text-[6.5px] tracking-wider uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.2)' }}>{s.label}</div>
            <div className="font-mono text-[16px] font-bold leading-none"
              style={{ color: s.up ? 'rgba(255,255,255,0.88)' : '#f87171', letterSpacing: '-0.025em' }}>
              {s.value}
            </div>
            <div className="font-mono text-[8px] mt-0.5"
              style={{ color: s.up ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)' }}>
              {s.sub}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Portfolio chart */}
      <PortfolioChart totalValue={totalValue} pnlPct={(totalPnL / totalCost) * 100}/>

      {/* Table + Donut */}
      <div className="flex flex-1 min-h-0 mx-4 gap-3 mb-3">

        {/* Holdings / History table */}
        <div className="flex-1 min-w-0 flex flex-col"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Tabs */}
          <div className="flex shrink-0"
            style={{ background: 'rgba(0,0,0,0.38)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {(['holdings', 'history'] as const).map(tab => (
              <motion.button key={tab} type="button" onClick={() => setActiveTab(tab)}
                whileTap={{ scale: 0.97 }}
                className="relative px-5 py-2 font-mono text-[8px] tracking-widest uppercase"
                style={{ color: activeTab === tab ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)' }}>
                {tab === 'holdings' ? 'MY HOLDINGS' : 'TX HISTORY'}
                {activeTab === tab && (
                  <motion.div layoutId="vault-tab" className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: '#D4AF37' }}/>
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'holdings' ? (
              <motion.div key="holdings" className="flex flex-col flex-1 min-h-0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}>
                {/* Sortable header */}
                <div className="flex items-center px-4 shrink-0"
                  style={{ height: 28, background: 'rgba(0,0,0,0.28)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <SortHeader label="ASSET"   sk="ticker"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} minWidth={172}/>
                  <SortHeader label="QTY"     sk="qty"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} flex={1}/>
                  <SortHeader label="AVG BUY" sk="avgBuy"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} flex={1}/>
                  <SortHeader label="CURRENT" sk="curPrice" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} flex={1}/>
                  <SortHeader label="VALUE"   sk="value"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} flex={1}/>
                  <SortHeader label="P&L"     sk="pnl"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} flex={1}/>
                  <SortHeader label="CHG %"   sk="pnlPct"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} flex={1}/>
                  {/* trade col */}
                  <span className="font-mono text-[6.5px] tracking-wider" style={{ color: 'rgba(255,255,255,0.12)', width: 56, textAlign: 'right' }}/>
                </div>
                <motion.div className="flex-1 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
                  variants={TABLE_V} initial="hidden" animate="show">
                  {sortedHoldings.map(h => {
                    const value   = h.qty * h.curPrice
                    const pnl     = h.qty * (h.curPrice - h.avgBuy)
                    const pnlPct  = ((h.curPrice - h.avgBuy) / h.avgBuy) * 100
                    const up      = pnl >= 0
                    const phaseC  = PHASE_COLOR[h.phase]
                    return (
                      <motion.div key={h.id} variants={ROW_V}
                        className="flex items-center px-4 py-2 cursor-default group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        whileHover={{ background: 'rgba(255,255,255,0.016)' }}>
                        <div style={{ minWidth: 172 }}>
                          <div className="font-mono text-[10px] font-bold" style={{ color: phaseC }}>
                            {h.ticker}
                          </div>
                          <div className="font-sans text-[7px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {h.title}
                          </div>
                        </div>
                        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>
                          {h.qty.toFixed(4)}
                        </span>
                        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.42)' }}>
                          {fmtETH(h.avgBuy)}
                        </span>
                        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                          {fmtETH(h.curPrice)}
                        </span>
                        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>
                          {fmtETH(value)}
                        </span>
                        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, fontWeight: 600,
                          color: up ? 'rgba(74,222,128,0.82)' : 'rgba(248,113,113,0.82)' }}>
                          {up ? '+' : ''}{fmtETH(pnl)}
                        </span>
                        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9,
                          color: up ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)' }}>
                          {up ? '+' : ''}{pnlPct.toFixed(1)}%
                        </span>
                        {/* Quick trade */}
                        <a href="/trade"
                          className="shrink-0 px-2 py-0.5 font-mono text-[7px] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ width: 56, textAlign: 'right', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)', textDecoration: 'none' }}>
                          TRADE →
                        </a>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="history" className="flex flex-col flex-1 min-h-0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}>
                <div className="flex items-center px-4 shrink-0"
                  style={{ height: 28, background: 'rgba(0,0,0,0.28)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['DATE', 'SIDE', 'TOKEN', 'PRICE', 'ETH SPENT'].map(l => (
                    <span key={l} className="font-mono text-[6.5px] tracking-wider flex-1"
                      style={{ color: 'rgba(255,255,255,0.15)' }}>{l}</span>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                  {TXS.map(tx => (
                    <div key={tx.id} className="flex items-center px-4 py-2.5 cursor-default"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.28)' }}>
                        {tx.date}
                      </span>
                      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 8, fontWeight: 700,
                        color: tx.side === 'buy' ? '#4ade80' : '#f87171' }}>
                        {tx.side.toUpperCase()}
                      </span>
                      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.55)' }}>
                        {tx.ticker}
                      </span>
                      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.42)' }}>
                        {fmtETH(tx.price)}
                      </span>
                      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>
                        {tx.eth.toFixed(3)} ETH
                      </span>
                    </div>
                  ))}
                </div>
                {/* Realized P&L summary */}
                <div className="flex items-center justify-between px-4 py-2 shrink-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
                  <span className="font-mono text-[7px] tracking-wider" style={{ color: 'rgba(255,255,255,0.22)' }}>
                    REALIZED P&L (CLOSED POSITIONS)
                  </span>
                  <span className="font-mono text-[10px] font-bold" style={{ color: '#4ade80' }}>
                    +{fmtETH(REALIZED_PNL)} ETH ({fmtUSD(REALIZED_PNL)})
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Allocation donut */}
        <div className="shrink-0 overflow-hidden" style={{ width: 220, border: '1px solid rgba(255,255,255,0.06)' }}>
          <AllocationDonut holdings={HOLDINGS}/>
        </div>
      </div>
    </motion.div>
  )
}
