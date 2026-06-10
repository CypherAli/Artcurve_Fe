import { get, post, request } from '@/lib/http'
import type { UserProfile, UpdateProfileDto } from '@/types/api'

export interface LinkedWallet {
  id:             string
  wallet_address: string
  label:          string | null
  is_primary:     boolean
  created_at:     string
}

export const userService = {
  me:          ()                          => get<UserProfile>('/users/me', true),
  updateMe:    (dto: UpdateProfileDto)     => request<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(dto), auth: true }),
  topCreators: (limit = 10)               => get<UserProfile[]>(`/users/top-creators?limit=${limit}`),
  getByWallet: (walletAddress: string)    => get<UserProfile>(`/users/${walletAddress}`),

  // ── Multi-wallet linking ────────────────────────────────────────
  listWallets:     ()                       => get<LinkedWallet[]>('/users/me/wallets', true),
  linkWalletNonce: (wallet_address: string) =>
    post<{ nonce: string; message: string }>('/users/me/wallets/nonce', { wallet_address }, true),
  linkWallet: (dto: { wallet_address: string; signature: string; message: string; label?: string }) =>
    post<LinkedWallet[]>('/users/me/wallets', dto, true),
  unlinkWallet: (wallet_address: string) =>
    request<LinkedWallet[]>(`/users/me/wallets/${wallet_address}`, { method: 'DELETE', auth: true }),
}
