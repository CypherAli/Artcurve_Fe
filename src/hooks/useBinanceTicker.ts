'use client'
// ─────────────────────────────────────────────────────────────────
//  useBinanceTicker.ts — Singleton Binance WebSocket
//
//  ONE WebSocket shared across ALL components.
//  Uses useSyncExternalStore for efficient React subscription.
// ─────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from 'react'

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

export interface CoinTick {
  symbol:   string
  name:     string
  price:    number
  change:   number
  high:     number
  low:      number
  volume:   number
}

export type TickerMap = Record<string, CoinTick>

interface TickerState {
  ticks:     TickerMap
  connected: boolean
}

// ── Singleton store ──────────────────────────────────────────────
const WS_URL =
  'wss://stream.binance.com:9443/stream?streams=' +
  TICKER_COINS.map(c => `${c.pair}@miniTicker`).join('/')

let state: TickerState = { ticks: {}, connected: false }
const listeners: Set<() => void> = new Set()
let ws: WebSocket | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 1000
let refCount = 0

function emit() {
  state = { ...state }
  listeners.forEach(fn => fn())
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  try {
    ws = new WebSocket(WS_URL)
  } catch { return }

  ws.onopen = () => {
    state.connected = true
    retryDelay = 1000
    emit()
  }

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data as string) as {
        data: { s: string; c: string; o: string; h: string; l: string; q: string }
      }
      const d    = msg.data
      const pair = d.s.toUpperCase().replace('USDT', '')
      const coin = TICKER_COINS.find(c => c.symbol === pair)
      if (!coin) return

      const cur    = parseFloat(d.c)
      const open   = parseFloat(d.o)
      const change = open > 0 ? ((cur - open) / open) * 100 : 0

      state.ticks = {
        ...state.ticks,
        [pair]: {
          symbol: pair, name: coin.name, price: cur, change,
          high: parseFloat(d.h), low: parseFloat(d.l), volume: parseFloat(d.q),
        },
      }
      emit()
    } catch {}
  }

  ws.onerror = () => { ws?.close() }

  ws.onclose = () => {
    state.connected = false
    emit()
    if (refCount > 0) {
      const delay = Math.min(retryDelay, 30_000)
      retryDelay = delay * 2
      retryTimer = setTimeout(connect, delay)
    }
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  refCount++
  if (refCount === 1) connect()
  return () => {
    listeners.delete(listener)
    refCount--
    if (refCount === 0) {
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
      ws = null
    }
  }
}

function getSnapshot(): TickerState {
  return state
}

const SERVER_STATE: TickerState = { ticks: {}, connected: false }
function getServerSnapshot(): TickerState {
  return SERVER_STATE
}

// ── Hook ──────────────────────────────────────────────────────────
export function useBinanceTicker() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// ── Helpers ──────────────────────────────────────────────────────

export function fmtUSD(price: number): string {
  if (!price) return '$—'
  if (price < 0.001)  return `$${price.toFixed(6)}`
  if (price < 1)      return `$${price.toFixed(4)}`
  if (price < 1000)   return `$${price.toFixed(2)}`
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtChange(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}
