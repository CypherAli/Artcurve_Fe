'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/usePriceSocket.ts  —  Real-time price updates via Socket.IO
//
//  Connects to backend WebSocket gateway:
//    ws://localhost:3001/prices  (PriceGateway namespace)
//
//  Flow:
//    socket.emit('subscribe_artwork',   { artwork_id })
//    socket.on('price_update', handler)
//    socket.emit('unsubscribe_artwork', { artwork_id })
//
//  Install dependency:
//    npm install socket.io-client
//
//  Usage:
//    const { price, supply, volume24h, connected } = usePriceSocket(artworkId)
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { PriceUpdateEvent } from '@/types/api'

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1')
    .replace('/api/v1', '')  // strip API path — socket connects to root

interface PriceState {
  price:     string | null
  supply:    string | null
  volume24h: string | null
  timestamp: string | null
}

const INIT: PriceState = {
  price: null, supply: null, volume24h: null, timestamp: null,
}

export function usePriceSocket(artworkId: string | null) {
  const [connected, setConnected] = useState(false)
  const [priceState, setPriceState] = useState<PriceState>(INIT)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!artworkId) return

    let socket: ReturnType<typeof import('socket.io-client')['io']> | null = null

    // Dynamic import so SSR doesn't bundle socket.io-client
    import('socket.io-client').then(({ io }) => {
      socket = io(`${WS_URL}/prices`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        setConnected(true)
        socket!.emit('subscribe_artwork', { artwork_id: artworkId })
      })

      socket.on('disconnect', () => setConnected(false))

      // price_snapshot: giá hiện tại gửi ngay khi subscribe (từ Redis cache)
      // price_update:   giá mới sau mỗi trade
      // Cả 2 event đều có cùng shape {artwork_id, current_price, current_supply, volume_24h}
      const handlePriceEvent = (evt: any) => {
        if (evt.artwork_id !== artworkId) return
        setPriceState({
          price:     evt.current_price  ?? evt.price,
          supply:    evt.current_supply ?? evt.supply,
          volume24h: evt.volume_24h,
          timestamp: String(evt.timestamp ?? Date.now()),
        })
      }

      socket.on('price_snapshot', handlePriceEvent)
      socket.on('price_update',   handlePriceEvent)
    }).catch(err => {
      console.warn('[usePriceSocket] socket.io-client not installed:', err.message)
    })

    return () => {
      if (socket) {
        socket.emit('unsubscribe_artwork', { artwork_id: artworkId })
        socket.disconnect()
        socketRef.current = null
      }
      setConnected(false)
      setPriceState(INIT)
    }
  }, [artworkId])

  return {
    ...priceState,
    connected,
    // Format helpers
    priceFloat:     priceState.price     ? parseFloat(priceState.price)     : null,
    volume24hFloat: priceState.volume24h ? parseFloat(priceState.volume24h) : null,
  }
}
