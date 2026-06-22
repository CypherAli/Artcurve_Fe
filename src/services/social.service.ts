import { get, post, request } from '@/lib/http'

export interface FollowUser {
  id: string
  wallet_address: string
  username: string | null
  avatar_url: string | null
}

export const socialService = {
  follow:    (userId: string) => post<void>(`/social/follow/${userId}`, {}, true),
  unfollow:  (userId: string) => request<void>(`/social/follow/${userId}`, { method: 'DELETE', auth: true }),
  followers: (userId: string) => get<FollowUser[]>(`/social/followers/${userId}`),
  following: (userId: string) => get<FollowUser[]>(`/social/following/${userId}`),
}
