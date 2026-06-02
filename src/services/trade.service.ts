import { get } from '@/lib/http'
import type { OhlcvCandle, OhlcvTimeframe, TradeHistoryResponse, LeaderboardEntry } from '@/types/api'

export const tradeService = {
  ohlcv(artworkId: string, params: { timeframe?: OhlcvTimeframe; from?: string; to?: string; limit?: number } = {}) {
    const q = new URLSearchParams()
    if (params.timeframe) q.set('timeframe', params.timeframe)
    if (params.from)      q.set('from',      params.from)
    if (params.to)        q.set('to',        params.to)
    if (params.limit)     q.set('limit',     String(params.limit))
    return get<OhlcvCandle[]>(`/trades/${artworkId}/ohlcv${q.toString() ? `?${q}` : ''}`, true)
  },
  history:     (artworkId: string, limit=50, offset=0)  => get<TradeHistoryResponse>(`/trades/${artworkId}/history?limit=${limit}&offset=${offset}`, true),
  volume24h:   (artworkId: string)                       => get<{ volume_eth: string }>(`/trades/${artworkId}/volume`, true),
  leaderboard: (limit = 20)                              => get<LeaderboardEntry[]>(`/trades/leaderboard?limit=${limit}`, true),
}
