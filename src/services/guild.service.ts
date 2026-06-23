import { get, post, request } from '@/lib/http'

export const GUILD_FOUNDATION_FEE_ETH = 0.005

export interface ApiGuild {
  id:           string
  name:         string
  description:  string | null
  focus:        string
  member_count: number
  max_members?: number
  avatar_color: string
  level?:       number
  weekly_volume_eth?: number
  acceptance?:  'auto' | 'manual'
  myRole?:      string
  creator_id?:  string
  created_at?:  string
}

export interface ApiGuildMember {
  id:        string
  user_id:   string
  role:      string
  joined_at: string
  user?: { id?: string; username?: string | null; wallet_address?: string; avatar_url?: string | null }
}

export interface ApiGuildHolding {
  artwork_id:   string
  title:        string
  image_uri:    string | null
  total_shares: string
  holder_count: string
}

export interface ApiGuildMessage {
  id:         string
  guild_id:   string
  user_id:    string
  user_name:  string
  content:    string
  created_at: string
}

export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

export const guildService = {
  list:     (page = 1, limit = 20) => get<PaginatedResponse<ApiGuild>>(`/guilds?page=${page}&limit=${limit}`),
  mine:     ()                     => get<(ApiGuild & { myRole: string })[]>('/guilds/my', true),
  detail:   (id: string)           => get<ApiGuild>(`/guilds/${id}`),
  members:  (id: string, page = 1, limit = 30) =>
    get<PaginatedResponse<ApiGuildMember>>(`/guilds/${id}/members?page=${page}&limit=${limit}`),
  holdings: (id: string)           => get<ApiGuildHolding[]>(`/guilds/${id}/holdings`),
  join:     (id: string)           => post<{ joined: boolean }>(`/guilds/${id}/join`, {}, true),
  leave:    (id: string)           => request<{ left: boolean }>(`/guilds/${id}/leave`, { method: 'DELETE', auth: true }),
  create:   (body: { name: string; description?: string; focus: string; max_members?: number; acceptance?: string }) =>
    post<ApiGuild>('/guilds', body, true),
  update:   (id: string, body: Partial<Pick<ApiGuild, 'name' | 'description' | 'focus' | 'max_members' | 'acceptance'>>) =>
    request<ApiGuild>(`/guilds/${id}`, { method: 'PATCH', auth: true, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  delete:   (id: string) =>
    request<{ deleted: boolean }>(`/guilds/${id}`, { method: 'DELETE', auth: true }),

  kickMember:  (guildId: string, userId: string) =>
    request<{ kicked: boolean }>(`/guilds/${guildId}/members/${userId}`, { method: 'DELETE', auth: true }),
  changeRole:  (guildId: string, userId: string, role: string) =>
    request<{ updated: boolean }>(`/guilds/${guildId}/members/${userId}/role`, {
      method: 'PATCH', auth: true, body: JSON.stringify({ role }), headers: { 'Content-Type': 'application/json' },
    }),
  transferOwnership: (guildId: string, newOwnerId: string) =>
    post<{ transferred: boolean }>(`/guilds/${guildId}/transfer`, { userId: newOwnerId }, true),

  postMessage:   (id: string, content: string) =>
    post<ApiGuildMessage>(`/guilds/${id}/messages`, { content }, true),
  deleteMessage: (guildId: string, messageId: string) =>
    request<{ deleted: boolean }>(`/guilds/${guildId}/messages/${messageId}`, { method: 'DELETE', auth: true }),
  messages:      (id: string, limit = 50, before?: string) =>
    get<ApiGuildMessage[]>(`/guilds/${id}/messages?limit=${limit}${before ? `&before=${before}` : ''}`),
}
