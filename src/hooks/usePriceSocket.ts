'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/usePriceSocket.ts  —  Real-time price updates via Socket.IO
//
//  Connects to backend WebSocket gateway:
//    /prices  (PriceGateway namespace)
//
//  Flow:
//    socket.emit('subscribe_artwork',   { artwork_id })
//    socket.on('price_update', handler)
//    socket.emit('unsubscribe_artwork', { artwork_id })
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { PriceUpdateEvent }       from '@/types/api'

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1')
    .replace('/api/v1', '')

interface PriceState {
  price:     string | null
  supply:    string | null
  volume24h: string | null
  timestamp: string | null
}

const INIT: PriceState = { price: null, supply: null, volume24h: null, timestamp: null }

export function usePriceSocket(artworkId: string | null) {
  const [connected,   setConnected]   = useState(false)
  const [priceState,  setPriceState]  = useState<PriceState>(INIT)
  const [socketError, setSocketError] = useState<string | null>(null)

  // Ref để cleanup type-safe — không cần `any`
  const socketRef  = useRef<{ emit: (e: string, d?: unknown) => void; disconnect: () => void } | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (!artworkId) return

    let socket: ReturnType<typeof import('socket.io-client')['io']> | null = null

    import('socket.io-client').then(({ io }) => {
      // Nếu component đã unmount trước khi import hoàn thành — bỏ qua
      if (!mountedRef.current) return

      socket = io(`${WS_URL}/prices`, {
        transports:           ['websocket'],
        reconnection:         true,
        reconnectionAttempts: 5,
        reconnectionDelay:    2000,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        if (!mountedRef.current) return
        setConnected(true)
        setSocketError(null)
        socket!.emit('subscribe_artwork', { artwork_id: artworkId })
      })

      socket.on('disconnect', () => {
        if (!mountedRef.current) return
        setConnected(false)
      })

      socket.on('connect_error', (err: Error) => {
        if (!mountedRef.current) return
        setSocketError(err.message)
        setConnected(false)
      })

      const handlePriceEvent = (evt: PriceUpdateEvent & { price?: string; supply?: string }) => {
        if (!mountedRef.current) return
        if (evt.artwork_id !== artworkId) return
        setPriceState({
          price:     evt.current_price  ?? evt.price ?? null,
          supply:    evt.current_supply ?? evt.supply ?? null,
          volume24h: evt.volume_24h     ?? null,
          timestamp: String(evt.timestamp ?? Date.now()),
        })
      }

      socket.on('price_snapshot', handlePriceEvent)
      socket.on('price_update',   handlePriceEvent)

    }).catch(err => {
      if (!mountedRef.current) return
      setSocketError(`socket.io-client load failed: ${err.message}`)
    })

    return () => {
      mountedRef.current = false
      if (socket?.connected) {
        socket.emit('unsubscribe_artwork', { artwork_id: artworkId })
        socket.disconnect()
      }
      socketRef.current = null
      setConnected(false)
      setPriceState(INIT)
    }
  }, [artworkId])

  // Cleanup on unmount
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
