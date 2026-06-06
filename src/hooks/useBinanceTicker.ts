'use client'
// ─────────────────────────────────────────────────────────────────
//  useBinanceTicker.ts
//
//  Connects to Binance public WebSocket combined stream.
//  No API key required — completely free and public.
//
//  Stream URL:
//    wss://stream.binance.com:9443/stream?streams=<sym>@miniTicker/...
//
//  Each message shape (24hrMiniTicker):
//    { stream: "btcusdt@miniTicker", data: { s, c, o, h, l, v, q } }
//      s = symbol (BTCUSDT)
//      c = current / last price
//      o = open price 24h ago
//      h = 24h high
//      l = 24h low
//      v = base volume
//      q = quote volume (USD)
//
//  Auto-reconnects with exponential back-off (up to 30 s).
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

// ── Coins to track ────────────────────────────────────────────────
export const TICKER_COINS = [
  { symbol: 'BTC',   name: 'Bitcoin',       pair: 'btcusdt'   },
  { symbol: 'ETH',   name: 'Ethereum',      pair: 'ethusdt'   },
  { symbol: 'SOL',   name: 'Solana',        pair: 'solusdt'   },
  { symbol: 'BNB',   name: 'BNB',           pair: 'bnbusdt'   },
  { symbol: 'XRP',   name: 'XRP',           pair: 'xrpusdt'   },
  { symbol: 'ADA',   name: 'Cardano',       pair: 'adausdt'   },
  { symbol: 'DOGE',  name: 'Dogecoin',      pair: 'dogeusdt'  },
  { symbol: 'AVAX',  name: 'Avalanche',     pair: 'avaxusdt'  },
  { symbol: 'LINK',  name: 'Chainlink',     pair: 'linkusdt'  },
  { symbol: 'MATIC', name: 'Polygon',       pair: 'maticusdt' },
  { symbol: 'LTC',   name: 'Litecoin',      pair: 'ltcusdt'   },
  { symbol: 'BCH',   name: 'Bitcoin Cash',  pair: 'bchusdt'   },
  { symbol: 'ATOM',  name: 'Cosmos',        pair: 'atomusdt'  },
  { symbol: 'DOT',   name: 'Polkadot',      pair: 'dotusdt'   },
  { symbol: 'AAVE',  name: 'Aave',          pair: 'aaveusdt'  },
  { symbol: 'TRX',   name: 'Tron',          pair: 'trxusdt'   },
  { symbol: 'UNI',   name: 'Uniswap',       pair: 'uniusdt'   },
  { symbol: 'XLM',   name: 'Stellar',       pair: 'xlmusdt'   },
  { symbol: 'FIL',   name: 'Filecoin',      pair: 'filusdt'   },
  { symbol: 'ALGO',  name: 'Algorand',      pair: 'algousdt'  },
] as const

const WS_URL =
  'wss://stream.binance.com:9443/stream?streams=' +
  TICKER_COINS.map(c => `${c.pair}@miniTicker`).join('/')

// ── Public types ──────────────────────────────────────────────────
export interface CoinTick {
  symbol:   string   // e.g. "BTC"
  name:     string   // e.g. "Bitcoin"
  price:    number   // USD current price
  change:   number   // 24h % change (e.g. -2.34)
  high:     number   // 24h high
  low:      number   // 24h low
  volume:   number   // 24h quote volume (USD)
}

export type TickerMap = Record<string, CoinTick>

// ── Hook ──────────────────────────────────────────────────────────
export function useBinanceTicker() {
  const [ticks, setTicks]           = useState<TickerMap>({})
  const [connected, setConnected]   = useState(false)
  const wsRef    = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef = useRef(1000)   // back-off delay ms

  useEffect(() => {
    let destroyed = false

    function connect() {
      if (destroyed) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (destroyed) { ws.close(); return }
        setConnected(true)
        delayRef.current = 1000   // reset back-off on success
      }

      ws.onmessage = (ev) => {
        if (destroyed) return
        try {
          const msg = JSON.parse(ev.data as string) as {
            stream: string
            data: { s: string; c: string; o: string; h: string; l: string; q: string }
          }
          const d    = msg.data
          const pair = d.s.toUpperCase().replace('USDT', '')
          const coin = TICKER_COINS.find(c => c.symbol === pair)
          if (!coin) return

          const cur    = parseFloat(d.c)
          const open   = parseFloat(d.o)
          const change = open > 0 ? ((cur - open) / open) * 100 : 0

          setTicks(prev => ({
            ...prev,
            [pair]: {
              symbol:  pair,
              name:    coin.name,
              price:   cur,
              change,
              high:    parseFloat(d.h),
              low:     parseFloat(d.l),
              volume:  parseFloat(d.q),
            },
          }))
        } catch { /* ignore malformed */ }
      }

      ws.onerror = () => { ws.close() }

      ws.onclose = () => {
        if (destroyed) return
        setConnected(false)
        // Exponential back-off: 1s → 2s → 4s → … → 30s
        const delay = Math.min(delayRef.current, 30_000)
        delayRef.current = delay * 2
        retryRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      destroyed = true
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [])

  return { ticks, connected }
}

// ── Helpers ───────────────────────────────────────────────────────

/** Format price: $0.00042, $1.23, $43,210 */
export function fmtUSD(price: number): string {
  if (!price) return '$—'
  if (price < 0.001)  return `$${price.toFixed(6)}`
  if (price < 1)      return `$${price.toFixed(4)}`
  if (price < 1000)   return `$${price.toFixed(2)}`
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Format 24h % change */
export function fmtChange(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}
