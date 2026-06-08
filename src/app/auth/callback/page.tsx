'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authStore }    from '@/lib/auth-store'
import { userService }  from '@/services/user.service'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#0E0E0E' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm tracking-widest uppercase font-mono">
          Signing in…
        </p>
      </div>
    </div>
  )
}

function CallbackHandler() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token   = searchParams.get('token')
    const address = searchParams.get('address')
    const name    = searchParams.get('name')
    const avatar  = searchParams.get('avatar')
    const error   = searchParams.get('auth_error')

    if (error || !token || !address) {
      router.replace('/?auth_error=1')
      return
    }

    const tempUser = {
      id:             address,
      wallet_address: address,
      username:       name ?? null,
      avatar_url:     avatar || null,
      role:           'user' as const,
      is_verified:    false,
    }

    // Xóa token khỏi URL ngay lập tức — tránh JWT lộ qua browser history / Referer header
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/auth/callback')
    }

    // Sync both stores so http.ts (authStore) and UI (useAuthStore) both work
    useAuthStore.getState().setAuth(token, tempUser)
    authStore.setJwt(token)
    authStore.setUser(tempUser)

    // Hydrate with real UUID and full profile from backend
    userService.me()
      .then(profile => {
        const fullUser = {
          ...tempUser,
          id:          profile.id,
          avatar_url:  profile.avatar_url ?? tempUser.avatar_url,
          username:    profile.username   ?? tempUser.username,
          role:        profile.role       ?? tempUser.role,
          is_verified: profile.is_verified ?? tempUser.is_verified,
        }
        useAuthStore.getState().setAuth(token, fullUser)
        authStore.setUser(fullUser)
      })
      .catch(() => { /* giữ nguyên tempUser nếu request fail */ })

    // Remember last social account for account picker in LoginModal
    const provider = searchParams.get('provider') ?? 'github'
    const storageKey =
      provider === 'google'   ? 'artcurve_google_account'   :
      provider === 'twitter'  ? 'artcurve_twitter_account'  :
      provider === 'telegram' ? 'artcurve_telegram_account' :
      provider === 'apple'    ? 'artcurve_apple_account'    :
      'artcurve_github_account'
    localStorage.setItem(storageKey, JSON.stringify({
      username:   name ?? '',
      avatar_url: avatar ?? '',
    }))

    const from = sessionStorage.getItem('auth_redirect') ?? '/marketplace'
    sessionStorage.removeItem('auth_redirect')
    router.replace(from)
  }, [searchParams, router])

  return <Spinner />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  )
}
