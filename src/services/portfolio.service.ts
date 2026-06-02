import { get } from '@/lib/http'
import type { PortfolioPnL, TopHolder } from '@/types/api'

export const portfolioService = {
  myPnL:      ()                                    => get<PortfolioPnL>('/portfolio/me/pnl', true),
  myHolding:  (artworkId: string)                   => get<{ share_balance: string; avg_buy_price: string } | null>(`/portfolio/me/holdings/${artworkId}`, true),
  topHolders: (artworkId: string, limit = 10)       => get<TopHolder[]>(`/portfolio/artworks/${artworkId}/holders?limit=${limit}`, true),
}
