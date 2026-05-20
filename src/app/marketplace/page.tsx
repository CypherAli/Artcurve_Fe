// ─────────────────────────────────────────────────────────────────
//  app/marketplace/page.tsx  —  Marketplace Route (Server Component)
// ─────────────────────────────────────────────────────────────────

import type { Metadata }        from 'next'
import { Header }               from '@/components/layout/Header'
import { MarketplacePage }      from '@/components/marketplace/MarketplacePage'

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Browse and collect unique artworks as bonding-curve tokens on ArtCurve. ' +
    'Filter by phase, sort by price or volume, and trade on Base.',
}

export default function Marketplace() {
  return (
    <>
      <Header />
      <MarketplacePage />
    </>
  )
}
