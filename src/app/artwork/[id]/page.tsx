import type { Metadata }      from 'next'
import { Header }             from '@/components/layout/Header'
import { ArtworkDetailPage }  from '@/components/artwork/ArtworkDetailPage'

export const metadata: Metadata = {
  title:       'Artwork Detail',
  description: 'View artwork details, bonding curve stats, and collector reviews on ArtCurve.',
}

export default async function ArtworkDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <Header />
      <ArtworkDetailPage artworkId={id} />
    </>
  )
}
