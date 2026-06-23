import type { Metadata }      from 'next'
import { Header }             from '@/components/layout/Header'
import { ArtworkDetailPage }  from '@/components/artwork/ArtworkDetailPage'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://artcurve-be.onrender.com/api/v1'
    const res = await fetch(`${apiUrl}/artworks/${id}`, { next: { revalidate: 60 } })
    if (res.ok) {
      const data = await res.json()
      const name = data?.data?.name ?? data?.name
      if (name) {
        return {
          title: name,
          description: `View "${name}" on ArtCurve. Bonding curve stats, collector reviews, and trading.`,
        }
      }
    }
  } catch {}
  return {
    title:       'Artwork Detail',
    description: 'View artwork details, bonding curve stats, and collector reviews on ArtCurve.',
  }
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
