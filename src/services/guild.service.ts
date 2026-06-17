import { get, post } from '@/lib/http'

// ─────────────────────────────────────────────────────────────────
//  guild.service — gọi API Guild backend (/guilds).
//  Có mock fallback để UI vẫn render khi backend chưa bật (đồ án/demo).
// ─────────────────────────────────────────────────────────────────

// Phí lập guild: phí ETH nhỏ chống spam (một lần). Rẻ — bằng ~5 share ở
// init price 0.001 ETH. Để ở constant cho dễ chỉnh.
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
}

export interface ApiGuildMember {
  user_id: string
  role:    string
  joined_at: string
  user?: { username?: string | null; wallet_address?: string; avatar_url?: string | null }
}

export interface ApiGuildHolding {
  artwork_id: string
  title:      string
  image_uri:  string | null
  total_shares: string
  holder_count: string
}

export const guildService = {
  list:    ()                              => get<ApiGuild[]>('/guilds'),
  mine:    ()                              => get<ApiGuild[]>('/guilds/mine', true),
  detail:  (id: string)                    => get<ApiGuild>(`/guilds/${id}`),
  members: (id: string)                    => get<ApiGuildMember[]>(`/guilds/${id}/members`),
  holdings:(id: string)                    => get<ApiGuildHolding[]>(`/guilds/${id}/holdings`),
  join:    (id: string)                    => post<{ joined: boolean }>(`/guilds/${id}/join`, {}, true),
  create:  (body: { name: string; description?: string; focus: string }) =>
                                              post<ApiGuild>('/guilds', body, true),
}
