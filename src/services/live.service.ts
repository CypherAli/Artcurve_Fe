import { get, post, request } from '@/lib/http'

export interface LiveStream {
  id: string
  room_name: string
  title: string
  category: string
  host_id: string
  host_name: string
  viewer_count: number
  is_live: boolean
  artwork_ticker: string | null
  started_at: string
  ended_at: string | null
}

export interface CreateStreamResponse {
  roomName: string
  token: string
  liveKitUrl: string
  streamId: string
}

export interface ViewerTokenResponse {
  token: string
  liveKitUrl: string
  stream: LiveStream
}

export const liveService = {
  list: () =>
    get<LiveStream[]>('/live'),

  get: (roomName: string) =>
    get<LiveStream>(`/live/${roomName}`),

  create: (body: { title: string; category?: string; artwork_ticker?: string }) =>
    post<CreateStreamResponse>('/live/create', body, true),

  viewerToken: (roomName: string, identity: string) =>
    get<ViewerTokenResponse>(`/live/${roomName}/viewer-token?identity=${encodeURIComponent(identity)}`),

  end: (roomName: string) =>
    request<{ ended: boolean }>(`/live/${roomName}`, { method: 'DELETE', auth: true }),
}
