// ─────────────────────────────────────────────────────────────────
//  app/trade/page.tsx  —  Trade Route (Server Component)
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { Header }        from '@/components/layout/Header'
import { TradePage }     from '@/components/trade/TradePage'

export const metadata: Metadata = {
  title: 'Trade',
  description:
    'Trade art tokens on ArtCurve: real-time candlestick charts, bonding curve pricing, ' +
    'and instant on-chain execution on Base.',
}

export default function Trade() {
  return (
    <div style={{ background: '#070707', minHeight: '100vh' }}>
      <Header />
      <TradePage />
    </div>
  )
}
