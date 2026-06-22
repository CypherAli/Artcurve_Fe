import { get } from '@/lib/http'

export interface VaultOverview {
  total_value_eth: string
  total_cost_basis_eth: string
  unrealized_pnl_eth: string
  unrealized_pnl_pct: string
  realized_pnl_eth: string
  eth_balance: string
  holdings_count: number
}

export interface VaultHolding {
  artwork_id: string
  title: string
  ticker: string
  category: string
  image_uri: string | null
  share_balance: string
  avg_buy_price: string
  current_price: string
  value_eth: string
  cost_basis_eth: string
  pnl_eth: string
  pnl_pct: string
}

export interface VaultTransaction {
  id: string
  artwork_id: string
  artwork_title: string
  artwork_ticker: string
  tx_type: 'BUY' | 'SELL'
  share_amount: string
  eth_amount: string
  price_per_share: string
  tx_hash: string | null
  timestamp: string
}

export interface VaultPerformancePoint {
  date: string
  value_eth: string
}

export const vaultService = {
  overview: () =>
    get<VaultOverview>('/vault/overview', true),

  holdings: () =>
    get<VaultHolding[]>('/vault/holdings', true),

  transactions: (page = 1, limit = 20, side?: 'buy' | 'sell') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (side) params.set('side', side)
    return get<{ data: VaultTransaction[]; total: number; page: number; totalPages: number }>(
      `/vault/transactions?${params}`, true,
    )
  },

  performance: (period: '7d' | '30d' | '90d' = '30d') =>
    get<VaultPerformancePoint[]>(`/vault/performance?period=${period}`, true),
}
