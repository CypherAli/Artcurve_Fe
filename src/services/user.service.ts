import { get, request } from '@/lib/http'
import type { UserProfile, UpdateProfileDto } from '@/types/api'

export const userService = {
  me:          ()                          => get<UserProfile>('/users/me', true),
  updateMe:    (dto: UpdateProfileDto)     => request<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(dto), auth: true }),
  topCreators: (limit = 10)               => get<UserProfile[]>(`/users/top-creators?limit=${limit}`),
  getByWallet: (walletAddress: string)    => get<UserProfile>(`/users/${walletAddress}`),
}
