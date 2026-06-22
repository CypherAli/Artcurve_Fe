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
}

export interface ViewerToken {
  token: string
}

export const liveService = {
  list: () =>
    get<LiveStream[]>('/live'),

  get: (roomName: string) =>
    get<LiveStream>(`/live/${roomName}`),

  create: (body: { title: string; category?: string; artwork_ticker?: string }) =>
    post<LiveStream>('/live/create', body, true),

  viewerToken: (roomName: string, identity: string) =>
    get<ViewerToken>(`/live/${roomName}/viewer-token?identity=${encodeURIComponent(identity)}`),

  end: (roomName: string) =>
    request<void>(`/live/${roomName}`, { method: 'DELETE', auth: true }),
}
