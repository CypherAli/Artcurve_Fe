import type { Metadata } from 'next'
import { Header }     from '@/components/layout/Header'
import { WalletPage } from '@/components/wallet/WalletPage'

export const metadata: Metadata = {
  title: 'Wallet — ArtCurve',
  description: 'Your connected wallet — balance, transactions, and keys.',
}

export default function Wallet() {
  return (
    <div style={{ background: '#070707', minHeight: '100vh' }}>
      <Header />
      <WalletPage />
    </div>
  )
}
