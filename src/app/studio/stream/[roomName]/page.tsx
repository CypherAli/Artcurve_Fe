import { use } from 'react'
import { LiveBroadcaster } from '@/components/live/LiveBroadcaster'

export default function StudioStreamPage({ params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = use(params)
  return <LiveBroadcaster roomName={roomName} />
}
