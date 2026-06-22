import { use } from 'react'
import { LiveViewer } from '@/components/live/LiveViewer'

export default function LiveViewerPage({ params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = use(params)
  return <LiveViewer roomName={roomName} />
}
