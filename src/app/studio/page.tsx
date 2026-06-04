import type { Metadata } from 'next'
import { Header }     from '@/components/layout/Header'
import { StudioPage } from '@/components/studio/StudioPage'

export const metadata: Metadata = {
  title: 'Studio — ArtCurve',
  description: 'Launch your artwork on ArtCurve — set your bonding curve, mint tokens, and reach collectors.',
}

export default function Studio() {
  return (
    <div style={{ background:'#FDFBF7', minHeight:'100vh' }}>
      <Header />
      <StudioPage />
    </div>
  )
}
