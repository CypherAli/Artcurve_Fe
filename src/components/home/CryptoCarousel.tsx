'use client'

// ─────────────────────────────────────────────────────────────────
//  CryptoCarousel.tsx
//
//  3-row infinite-scroll coin carousel with real-time Binance prices.
//  Row 1 → scrolls LEFT  (fast)
//  Row 2 → scrolls RIGHT (medium)
//  Row 3 → scrolls LEFT  (slow)
//
//  Each card shows:
//    - Colored coin badge with symbol initial(s)
//    - Coin name
//    - Live price (USD) — updated via Binance WebSocket
//    - 24h % change — green / red
//
//  No API key needed. Graceful fallback if WS unavailable.
// ─────────────────────────────────────────────────────────────────

import { useBinanceTicker, fmtUSD, fmtChange, TICKER_COINS } from '@/hooks/useBinanceTicker'

// ── Coin color palette (branded per-coin) ─────────────────────────
const COIN_COLORS: Record<string, { bg: string; text: string }> = {
  BTC:   { bg: '#F7931A', text: '#fff' },
  ETH:   { bg: '#627EEA', text: '#fff' },
  SOL:   { bg: '#9945FF', text: '#fff' },
  BNB:   { bg: '#F3BA2F', text: '#1A1A1A' },
  XRP:   { bg: '#00AAE4', text: '#fff' },
  ADA:   { bg: '#0033AD', text: '#fff' },
  DOGE:  { bg: '#C2A633', text: '#1A1A1A' },
  AVAX:  { bg: '#E84142', text: '#fff' },
  LINK:  { bg: '#2A5ADA', text: '#fff' },
  MATIC: { bg: '#8247E5', text: '#fff' },
  LTC:   { bg: '#A6A9AA', text: '#fff' },
  BCH:   { bg: '#4CC947', text: '#fff' },
  ATOM:  { bg: '#2E3148', text: '#fff' },
  DOT:   { bg: '#E6007A', text: '#fff' },
  AAVE:  { bg: '#B6509E', text: '#fff' },
  TRX:   { bg: '#EF0027', text: '#fff' },
  UNI:   { bg: '#FF007A', text: '#fff' },
  XLM:   { bg: '#000000', text: '#fff' },
  FIL:   { bg: '#0090FF', text: '#fff' },
  ALGO:  { bg: '#000000', text: '#fff' },
}

// ── Split coins into 3 rows ───────────────────────────────────────
const ROW_SIZE = Math.ceil(TICKER_COINS.length / 3)
const ROW_1 = TICKER_COINS.slice(0,          ROW_SIZE)
const ROW_2 = TICKER_COINS.slice(ROW_SIZE,   ROW_SIZE * 2)
const ROW_3 = TICKER_COINS.slice(ROW_SIZE * 2)

// ── CoinCard ──────────────────────────────────────────────────────
function CoinCard({
  symbol, name, price, change, positive,
}: {
  symbol: string; name: string
  price: string; change: string; positive: boolean
}) {
  const col = COIN_COLORS[symbol] ?? { bg: '#C9A96E', text: '#1A1A1A' }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl shrink-0"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border:     '1px solid rgba(255,255,255,0.09)',
        minWidth:   190,
      }}
    >
      {/* Badge */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold"
        style={{ background: col.bg, color: col.text }}
      >
        {symbol.length <= 3 ? symbol : symbol.slice(0, 2)}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-white/85 truncate leading-tight">
          {name}
        </p>
        <p className="font-mono text-[11px] text-white/45 mt-0.5">{price}</p>
      </div>

      {/* % change */}
      <span
        className="font-mono text-[10.5px] font-bold shrink-0"
        style={{ color: positive ? '#4ade80' : '#f87171' }}
      >
        {change}
      </span>
    </div>
  )
}

// ── InfiniteRow ────────────────────────────────────────────────────
function InfiniteRow({
  coins, direction, duration, ticks,
}: {
  coins: typeof TICKER_COINS[number][]
  direction: 'left' | 'right'
  duration: number
  ticks: ReturnType<typeof useBinanceTicker>['ticks']
}) {
  const doubled = [...coins, ...coins]
  const start   = direction === 'left' ? '0%'   : '-50%'
  const end     = direction === 'left' ? '-50%'  : '0%'

  return (
    <div className="overflow-hidden select-none" aria-hidden="true">
      <div
        className="flex gap-3 py-1"
        style={{
          width:     'max-content',
          animation: `crypto-scroll-${direction} ${duration}s linear infinite`,
        }}
      >
        {doubled.map((coin, i) => {
          const t = ticks[coin.symbol]
          return (
            <CoinCard
              key={`${coin.symbol}-${i}`}
              symbol={coin.symbol}
              name={coin.name}
              price={t ? fmtUSD(t.price) : '…'}
              change={t ? fmtChange(t.change) : '—'}
              positive={t ? t.change >= 0 : true}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export function CryptoCarousel() {
  const { ticks, connected } = useBinanceTicker()

  return (
    <section
      className="relative py-10 overflow-hidden"
      style={{ background: '#111111' }}
      aria-label="Live crypto prices"
    >
      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes crypto-scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes crypto-scroll-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Edge fade masks */}
      <div className="absolute inset-y-0 left-0 z-10 w-24 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #111 0%, transparent 100%)' }}/>
      <div className="absolute inset-y-0 right-0 z-10 w-24 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #111 0%, transparent 100%)' }}/>

      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-16 mb-6">
        <div>
          <p className="text-[10.5px] font-mono tracking-[0.2em] uppercase mb-1"
            style={{ color: 'rgba(201,169,110,0.7)' }}>
            Market Prices
          </p>
          <h3 className="text-[1.15rem] text-white/80 font-light"
            style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            Live Crypto Markets
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="size-[6px] rounded-full"
            style={{
              background: connected ? '#4ade80' : '#f87171',
              boxShadow:  connected ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
            }}
          />
          <span className="font-mono text-[9px] tracking-widest"
            style={{ color: connected ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.6)' }}>
            {connected ? 'BINANCE · LIVE' : 'CONNECTING…'}
          </span>
        </div>
      </div>

      {/* 3 rows */}
      <div className="flex flex-col gap-3">
        <InfiniteRow coins={ROW_1} direction="left"  duration={35} ticks={ticks} />
        <InfiniteRow coins={ROW_2} direction="right" duration={45} ticks={ticks} />
        <InfiniteRow coins={ROW_3} direction="left"  duration={40} ticks={ticks} />
      </div>
    </section>
  )
}
