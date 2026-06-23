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

export interface ApiGuildAnnouncement {
  id:        string
  guild_id:  string
  user_id:   string
  user_name: string
  title:     string
  content:   string
  is_pinned: boolean
  created_at: string
}

export interface ApiGuildInvite {
  id:         string
  guild_id:   string
  code:       string
  created_by: string
  uses:       number
  max_uses:   number | null
  expires_at: string | null
  created_at: string
}

export interface ApiGuildAnalytics {
  total_volume_eth: number
  weekly_volume_eth: number
  total_trades:     number
  weekly_trades:    number
  unique_artworks:  number
  top_traders:  { user_id: string; username: string; volume_eth: number; trade_count: number }[]
  top_holdings: { artwork_id: string; title: string; total_shares: number; holder_count: number }[]
}

export interface ApiGuildActivity {
  tx_hash:       string
  user_id:       string
  username:      string
  artwork_id:    string
  artwork_title: string
  image_uri:     string | null
  is_buy:        boolean
  share_amount:  string
  eth_amount:    string
  timestamp:     string
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

  // Announcements
  createAnnouncement: (id: string, title: string, content: string) =>
    post<ApiGuildAnnouncement>(`/guilds/${id}/announcements`, { title, content }, true),
  announcements:      (id: string, limit = 10) =>
    get<ApiGuildAnnouncement[]>(`/guilds/${id}/announcements?limit=${limit}`),
  deleteAnnouncement: (guildId: string, annId: string) =>
    request<{ deleted: boolean }>(`/guilds/${guildId}/announcements/${annId}`, { method: 'DELETE', auth: true }),
  togglePin:          (guildId: string, annId: string) =>
    request<{ pinned: boolean }>(`/guilds/${guildId}/announcements/${annId}/pin`, {
      method: 'PATCH', auth: true, body: '{}', headers: { 'Content-Type': 'application/json' },
    }),

  // Invitations
  createInvite:  (id: string, maxUses?: number, expiresInHours?: number) =>
    post<ApiGuildInvite>(`/guilds/${id}/invites`, { max_uses: maxUses, expires_in_hours: expiresInHours }, true),
  invites:       (id: string) => get<ApiGuildInvite[]>(`/guilds/${id}/invites`, true),
  deleteInvite:  (guildId: string, inviteId: string) =>
    request<{ deleted: boolean }>(`/guilds/${guildId}/invites/${inviteId}`, { method: 'DELETE', auth: true }),
  joinByInvite:  (code: string) =>
    post<{ joined: boolean; guild_id: string; guild_name: string }>('/guilds/join-by-invite', { code }, true),

  // Analytics & Activity
  analytics: (id: string) => get<ApiGuildAnalytics>(`/guilds/${id}/analytics`),
  activity:  (id: string, limit = 20) => get<ApiGuildActivity[]>(`/guilds/${id}/activity?limit=${limit}`),
}
