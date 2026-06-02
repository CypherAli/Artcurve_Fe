'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/useTrades.ts  —  OHLCV candles + trade history
//
//  Wraps GET /trades/:artworkId/ohlcv and /history
//  Data comes from ClickHouse Materialized Views — very fast.
//
//  Usage:
//    const { candles, isLoading } = useOhlcv(artworkId, '1h')
//    const { trades }             = useTradeHistory(artworkId)
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tradeService } from '@/services/trade.service'
import type { OhlcvTimeframe } from '@/types/api'

export function useOhlcv(artworkId: string | null, timeframe: OhlcvTimeframe = '1h') {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['ohlcv', artworkId, timeframe],
    queryFn:  () => tradeService.ohlcv(artworkId!, { timeframe }),
    enabled:  !!artworkId,
    staleTime: 15_000,    // 15 s — price changes quickly
    refetchInterval: 30_000,  // poll every 30 s when page is visible
  })
  return { candles: data ?? [], isLoading, isFetching, error }
}

export function useTradeHistory(artworkId: string | null, limit = 50) {
  const [offset, setOffset] = useState(0)
  const { data, isLoading, error } = useQuery({
    queryKey: ['trade-history', artworkId, limit, offset],
    queryFn:  () => tradeService.history(artworkId!, limit, offset),
    enabled:  !!artworkId,
    staleTime: 15_000,
  })
  return {
    trades:  data?.data ?? [],
    total:   data?.total ?? 0,
    offset,
    setOffset,
    isLoading,
    error,
  }
}

export function useVolume24h(artworkId: string | null) {
  return useQuery({
    queryKey: ['volume24h', artworkId],
    queryFn:  () => tradeService.volume24h(artworkId!),
    enabled:  !!artworkId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn:  () => tradeService.leaderboard(limit),
    staleTime: 5 * 60_000,  // 5 min
  })
}

// ── Timeframe selector hook (UI state + derived query window) ─────
export function useTimeframeSelector(initial: OhlcvTimeframe = '1h') {
  const [timeframe, setTimeframe] = useState<OhlcvTimeframe>(initial)

  const TIMEFRAMES: OhlcvTimeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

  // derive "from" date based on selected timeframe
  function getFrom(): string {
    const now = Date.now()
    const ms: Record<OhlcvTimeframe, number> = {
      '1m':  60 * 60 * 1000,          // last 1 h of 1m candles
      '5m':  4  * 60 * 60 * 1000,     // last 4 h
      '15m': 12 * 60 * 60 * 1000,
      '1h':  7  * 24 * 60 * 60 * 1000,
      '4h':  30 * 24 * 60 * 60 * 1000,
      '1d':  365 * 24 * 60 * 60 * 1000,
    }
    return new Date(now - ms[timeframe]).toISOString()
  }

  return { timeframe, setTimeframe, TIMEFRAMES, getFrom }
}
