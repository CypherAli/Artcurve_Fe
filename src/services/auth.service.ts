import { post, request } from '@/lib/http'
import type { NonceResponse, AuthResponse } from '@/types/api'

export const authService = {
  nonce:  (walletAddress: string)                                     => post<NonceResponse>('/auth/nonce', { wallet_address: walletAddress }),
  verify: (walletAddress: string, signature: string, message: string) => post<AuthResponse>('/auth/verify', { wallet_address: walletAddress, signature, message }),
  logout: ()                                                          => request<void>('/auth/logout', { method: 'POST', auth: true }),
}
