'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/usePortfolio.ts  —  Authenticated user portfolio P&L
//
//  Wraps GET /portfolio/me/pnl with TanStack Query.
//  Returns null data when user is not authenticated — callers
//  should check isAuthenticated before rendering portfolio UI.
//
//  Usage:
//    const { pnl, holdings, isLoading } = usePortfolio()
// ─────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { portfolioService } from '@/services/portfolio.service'
import { useAuthStore } from '@/store/authStore'
import type { PortfolioPnL, PortfolioHolding } from '@/types/api'

export function usePortfolio() {
  const jwt = useAuthStore(s => s.jwt)
  const isAuth = !!jwt

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['portfolio', 'pnl'],
    queryFn:  () => portfolioService.myPnL(),
    enabled:  isAuth,
    staleTime: 60_000,   // 1 min
    retry:     false,    // don't retry 401
  })

  // Convenience numeric accessors (backend returns DECIMAL strings)
  const pf = data as PortfolioPnL | undefined

  return {
    raw:           pf,
    holdings:      (pf?.holdings ?? []) as PortfolioHolding[],
    totalValue:    pf ? parseFloat(pf.total_current_value_eth)  : null,
    totalCost:     pf ? parseFloat(pf.total_cost_basis_eth)     : null,
    pnlEth:        pf ? parseFloat(pf.total_unrealized_pnl_eth) : null,
    pnlPct:        pf ? parseFloat(pf.total_unrealized_pnl_pct) : null,
    isLoading,
    isFetching,
    error,
    isAuth,
    refetch,
  }
}

// ── Per-artwork holding ────────────────────────────────────────────
export function useHolding(artworkId: string | null) {
  return useQuery({
    queryKey: ['portfolio', 'holding', artworkId],
    queryFn:  () => portfolioService.myHolding(artworkId!),
    enabled:  !!artworkId && !!useAuthStore.getState().jwt,
    staleTime: 30_000,
  })
}

// ── Top holders leaderboard ────────────────────────────────────────
export function useTopHolders(artworkId: string | null, limit = 10) {
  return useQuery({
    queryKey: ['portfolio', 'holders', artworkId, limit],
    queryFn:  () => portfolioService.topHolders(artworkId!, limit),
    enabled:  !!artworkId,
    staleTime: 60_000,
  })
}
