import { usePortfolioStore } from './portfolioStore'

beforeEach(() => {
  usePortfolioStore.setState({ pnl: null, lastSync: null })
})

describe('usePortfolioStore', () => {
  it('setPnL stores pnl and sets lastSync', () => {
    const pnl = { total_invested: '1.0', current_value: '1.5', pnl_percent: 50, holdings: [] } as any
    usePortfolioStore.getState().setPnL(pnl)
    const s = usePortfolioStore.getState()
    expect(s.pnl).toEqual(pnl)
    expect(s.lastSync).toBeGreaterThan(0)
  })

  it('clear resets state', () => {
    usePortfolioStore.getState().setPnL({ total_invested: '1' } as any)
    usePortfolioStore.getState().clear()
    const s = usePortfolioStore.getState()
    expect(s.pnl).toBeNull()
    expect(s.lastSync).toBeNull()
  })
})
