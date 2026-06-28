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

export interface LiveChatMessage {
  id: string
  room_name: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface LiveTipData {
  id: string
  room_name: string
  from_user_id: string
  from_user_name: string
  to_host_id: string
  amount_eth: string
  message: string | null
  created_at: string
}

export const liveService = {
  list: () =>
    get<LiveStream[]>('/live'),

  get: (roomName: string) =>
    get<LiveStream>(`/live/${roomName}`),

  create: (body: { title: string; category?: string; artwork_ticker?: string }) =>
    post<CreateStreamResponse>('/live/create', body, true),

  viewerToken: (roomName: string, identity: string) =>
    post<ViewerTokenResponse>(`/live/${roomName}/viewer-token`, { identity }),

  end: (roomName: string) =>
    request<{ ended: boolean }>(`/live/${roomName}`, { method: 'DELETE', auth: true }),

  // Chat
  postChat: (roomName: string, content: string) =>
    post<LiveChatMessage>(`/live/${roomName}/chat`, { content }, true),
  chatMessages: (roomName: string, limit = 50) =>
    get<LiveChatMessage[]>(`/live/${roomName}/chat?limit=${limit}`),

  // Tips
  sendTip: (roomName: string, amountEth: string, message?: string) =>
    post<LiveTipData>(`/live/${roomName}/tip`, { amount_eth: amountEth, message }, true),
  tips: (roomName: string, limit = 20) =>
    get<LiveTipData[]>(`/live/${roomName}/tips?limit=${limit}`),
  totalTips: (roomName: string) =>
    get<{ total_eth: number; tip_count: number }>(`/live/${roomName}/tips/total`),
}
