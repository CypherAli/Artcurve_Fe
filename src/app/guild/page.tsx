import type { Metadata } from 'next'
import { Header }    from '@/components/layout/Header'
import { GuildPage } from '@/components/guild/GuildPage'

export const metadata: Metadata = {
  title: 'Guild',
  description: 'The ArtCurve collector guild: governance, rankings, and community proposals.',
}

export default function Guild() {
  return (
    <>
      <Header />
      <GuildPage />
    </>
  )
}
