'use client'

import { useBinanceTicker, fmtUSD, fmtChange, TICKER_COINS } from '@/hooks/useBinanceTicker'

export function TickerDivider() {
  const { ticks, connected } = useBinanceTicker()

  const items = TICKER_COINS.map(coin => {
    const t = ticks[coin.symbol]
    return {
      symbol:   coin.symbol,
      price:    t ? fmtUSD(t.price)     : '…',
      change:   t ? fmtChange(t.change) : '-',
      positive: t ? t.change >= 0       : true,
    }
  })

  return (
    <div
      className="overflow-hidden relative"
      style={{
        height:     28,
        borderTop:  '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#000000',
      }}
    >
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
          {connected ? 'LIVE' : '···'}
        </span>
      </div>

      <div
        className="flex items-center h-full pl-20 ticker-scroll"
        style={{ width: 'max-content', willChange: 'transform' }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-5 h-full shrink-0"
            style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="font-mono text-[8px] font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              {item.symbol}
            </span>
            <span className="font-mono text-[8.5px]"
              style={{ color: 'rgba(255,255,255,0.9)' }}>
              {item.price}
            </span>
            <span className="font-mono text-[8px] font-semibold"
              style={{ color: item.positive ? '#4ade80' : '#f87171' }}>
              {item.change}
            </span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .ticker-scroll { animation: ticker-scroll 80s linear infinite; }
      `}</style>
    </div>
  )
}
