import type { Metadata } from 'next'
import { Header }     from '@/components/layout/Header'
import { StudioPage } from '@/components/studio/StudioPage'

export const metadata: Metadata = {
  title: 'Studio',
  description: 'Launch your artwork on ArtCurve. Set your bonding curve, mint tokens, and reach collectors.',
}

export default function Studio() {
  return (
    <div style={{ background:'var(--ac-paper, #070707)', minHeight:'100vh' }}>
      <Header />
      <StudioPage />
    </div>
  )
}
