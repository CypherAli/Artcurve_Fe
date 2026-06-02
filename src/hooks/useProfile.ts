// ─────────────────────────────────────────────────────────────────
//  hooks/useProfile.ts  —  User profile hooks
// ─────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService }               from '@/services/user.service'
import { authStore }                 from '@/lib/auth-store'
import type { UpdateProfileDto }     from '@/types/api'

/** Get current user's profile (requires auth) */
export function useMyProfile() {
  const isAuth = Boolean(authStore.getJwt())

  return useQuery({
    queryKey:   ['profile', 'me'],
    queryFn:    () => userService.me(),
    enabled:    isAuth,
    staleTime:  5 * 60_000,   // 5 min — profile rarely changes
    retry:      1,
  })
}

/** Update current user's profile */
export function useUpdateProfile() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => userService.updateMe(dto),
    onSuccess: (updatedUser) => {
      // Update cache immediately
      qc.setQueryData(['profile', 'me'], updatedUser)
      // Update auth store with new username/avatar
      const current = authStore.getUser()
      if (current) {
        authStore.setUser({
          ...current,
          username:   updatedUser.username ?? null,
          avatar_url: updatedUser.avatar_url ?? null,
        })
      }
    },
  })
}

/** Get another user's public profile by wallet address */
export function usePublicProfile(walletAddress: string | undefined) {
  return useQuery({
    queryKey:  ['profile', walletAddress],
    queryFn:   () => userService.getByWallet(walletAddress!),
    enabled:   Boolean(walletAddress),
    staleTime: 5 * 60_000,
  })
}

/** Top creators for homepage / marketplace */
export function useTopCreators(limit = 10) {
  return useQuery({
    queryKey:  ['top-creators', limit],
    queryFn:   () => userService.topCreators(limit),
    staleTime: 5 * 60_000,
  })
}
