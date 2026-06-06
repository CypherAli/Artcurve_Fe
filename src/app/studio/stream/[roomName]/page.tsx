import { LiveBroadcaster } from '@/components/live/LiveBroadcaster'

export default function StudioStreamPage({ params }: { params: { roomName: string } }) {
  return <LiveBroadcaster roomName={params.roomName} />
}
