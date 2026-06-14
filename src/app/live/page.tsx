import type { Metadata } from 'next'
import { Header }   from '@/components/layout/Header'
import { LivePage } from '@/components/live/LivePage'

export const metadata: Metadata = {
  title: 'Live | ArtCurve',
  description: 'Real-time activity feed: watch every trade, graduation, and new listing happen live on ArtCurve.',
}

export default function Live() {
  return (
    <div style={{ background:'#070707', minHeight:'100vh' }}>
      <Header />
      <LivePage />
    </div>
  )
}
