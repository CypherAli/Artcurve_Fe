import { create } from 'zustand'
import type { PortfolioPnL } from '@/types/api'

interface PortfolioState {
  pnl:       PortfolioPnL | null
  lastSync:  number | null
  setPnL:    (pnl: PortfolioPnL) => void
  clear:     () => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  pnl:      null,
  lastSync: null,
  setPnL:   (pnl) => set({ pnl, lastSync: Date.now() }),
  clear:    ()    => set({ pnl: null, lastSync: null }),
}))
