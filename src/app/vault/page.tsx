import type { Metadata } from 'next'
import { Header }    from '@/components/layout/Header'
import { VaultPage } from '@/components/vault/VaultPage'

export const metadata: Metadata = {
  title: 'Vault — ArtCurve',
  description: 'Your art token portfolio — holdings, P&L, and transaction history.',
}

export default function Vault() {
  return (
    <div style={{ background:'#FDFBF7', minHeight:'100vh' }}>
      <Header />
      <VaultPage />
    </div>
  )
}
