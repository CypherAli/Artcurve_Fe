import type { Metadata } from 'next'
import { Header }    from '@/components/layout/Header'
import { VaultPage } from '@/components/vault/VaultPage'

export const metadata: Metadata = {
  title: 'Vault',
  description: 'Your art token portfolio: holdings, P&L, and transaction history.',
}

export default function Vault() {
  return (
    <div style={{ background:'var(--ac-paper, #070707)', minHeight:'100vh' }}>
      <Header />
      <VaultPage />
    </div>
  )
}
