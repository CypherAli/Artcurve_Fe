'use client'
// hooks/usePriceSocket.ts — Real-time price updates via native WebSocket → Go WS Hub
//
// Protocol (Go WS Hub at /ws):
//   client → {"action":"subscribe","artwork_id":"<uuid>"}
//   server → {"type":"price_update","data":{...PriceEvent}}
//   server → {"type":"artwork_graduated","data":{...}}
//   client → {"action":"unsubscribe","artwork_id":"<uuid>"}
//
// Env var: NEXT_PUBLIC_WS_HUB_URL  e.g. wss://artcurve-ws-hub.onrender.com
// Falls back to API_URL host on port 8080 for local dev.

import { useState, useEffect, useRef } from 'react'
import type { PriceUpdateEvent }       from '@/types/api'

function resolveHubUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_HUB_URL
  if (explicit) return explicit.replace(/\/$/, '')

  // local dev fallback: derive from API URL
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try {
    const u = new URL(api)
    const proto = u.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${u.hostname}:8080`
  } catch {
    return 'ws://localhost:8080'
  }
}

const HUB_BASE = resolveHubUrl()

interface PriceState {
  price:     string | null
  supply:    string | null
  volume24h: string | null
  timestamp: string | null
}

const INIT: PriceState = { price: null, supply: null, volume24h: null, timestamp: null }

const MAX_RETRIES  = 5
const BASE_DELAY   = 2_000  // ms, doubles each retry

export function usePriceSocket(artworkId: string | null) {
  const [connected,   setConnected]   = useState(false)
  const [priceState,  setPriceState]  = useState<PriceState>(INIT)
  const [socketError, setSocketError] = useState<string | null>(null)

  const wsRef      = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)
  const retryRef   = useRef(0)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    retryRef.current   = 0

    if (!artworkId) return

    function connect() {
      if (!mountedRef.current) return

      const ws = new WebSocket(`${HUB_BASE}/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        retryRef.current = 0
        setConnected(true)
        setSocketError(null)
        ws.send(JSON.stringify({ action: 'subscribe', artwork_id: artworkId }))
      }

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return
        try {
          const msg = JSON.parse(evt.data as string) as {
            type: string
            data: PriceUpdateEvent & { price?: string; supply?: string }
          }
          if (msg.type !== 'price_update') return
          const d = msg.data
          if (d.artwork_id !== artworkId) return
          setPriceState({
            price:     d.current_price  ?? d.price ?? null,
            supply:    d.current_supply ?? d.supply ?? null,
            volume24h: d.volume_24h     ?? null,
            timestamp: String(d.timestamp ?? Date.now()),
          })
        } catch {
          // malformed message — ignore
        }
      }

      ws.onerror = () => {
        if (!mountedRef.current) return
        setSocketError('WebSocket error')
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        wsRef.current = null

        if (retryRef.current < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryRef.current)
          retryRef.current++
          timerRef.current = setTimeout(connect, delay)
        } else {
          setSocketError(`Connection failed after ${MAX_RETRIES} retries`)
        }
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'unsubscribe', artwork_id: artworkId }))
        ws.close()
      }
      wsRef.current = null
      setConnected(false)
      setPriceState(INIT)
    }
  }, [artworkId])

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  return {
    ...priceState,
    connected,
    socketError,
    priceFloat:     priceState.price     ? parseFloat(priceState.price)     : null,
    volume24hFloat: priceState.volume24h ? parseFloat(priceState.volume24h) : null,
  }
}
