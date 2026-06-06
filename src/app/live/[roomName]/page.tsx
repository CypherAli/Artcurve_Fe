import { LiveViewer } from '@/components/live/LiveViewer'

export default function LiveViewerPage({ params }: { params: { roomName: string } }) {
  return <LiveViewer roomName={params.roomName} />
}
