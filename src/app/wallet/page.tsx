import type { Metadata } from 'next'
import { Header }     from '@/components/layout/Header'
import { WalletPage } from '@/components/wallet/WalletPage'

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Your connected wallet: balance, transactions, and keys.',
}

export default function Wallet() {
  return (
    <div style={{ background: 'var(--ac-paper, #070707)', minHeight: '100vh' }}>
      <Header />
      <WalletPage />
    </div>
  )
}
