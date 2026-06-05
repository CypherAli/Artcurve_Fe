import { get } from '@/lib/http'
import type { OhlcvCandle, OhlcvCandleRaw, OhlcvTimeframe, TradeHistoryResponse, LeaderboardEntry } from '@/types/api'
import { normalizeCandle } from '@/types/api'

export const tradeService = {
  // ohlcv: endpoint public (BE đã có @Public()) → auth=false
  async ohlcv(artworkId: string, params: { timeframe?: OhlcvTimeframe; from?: string; to?: string; limit?: number } = {}): Promise<OhlcvCandle[]> {
    const q = new URLSearchParams()
    if (params.timeframe) q.set('timeframe', params.timeframe)
    if (params.from)      q.set('from',      params.from)
    if (params.to)        q.set('to',        params.to)
    if (params.limit)     q.set('limit',     String(params.limit))
    const raw = await get<OhlcvCandleRaw[]>(`/trades/${artworkId}/ohlcv${q.toString() ? `?${q}` : ''}`)
    return Array.isArray(raw) ? raw.map(normalizeCandle) : []
  },

  // history, volume, leaderboard: public endpoints
  history:     (artworkId: string, limit=50, offset=0)  =>
    get<TradeHistoryResponse>(`/trades/${artworkId}/history?limit=${limit}&offset=${offset}`),
  volume24h:   (artworkId: string)                       =>
    get<{ volume_eth: string }>(`/trades/${artworkId}/volume`),
  leaderboard: (limit = 20)                              =>
    get<LeaderboardEntry[]>(`/trades/leaderboard?limit=${limit}`),
}
