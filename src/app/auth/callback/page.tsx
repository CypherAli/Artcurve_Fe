'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { userService }  from '@/services/user.service'
import { useLanguage }  from '@/context/LanguageContext'

function Spinner() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#0E0E0E' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm tracking-widest uppercase font-mono">
          {t.auth.signingIn}
        </p>
      </div>
    </div>
  )
}

function CallbackHandler() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('auth_error')
    const code  = searchParams.get('code')

    if (error || !code) {
      router.replace('/?auth_error=1')
      return
    }

    // Xóa code khỏi URL ngay lập tức — tránh lộ qua browser history
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/auth/callback')
    }

    // Exchange one-time code for JWT via backend
    const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '')

    fetch(`${BASE}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Exchange failed')
        const json = await res.json()
        return json.data ?? json
      })
      .then((data: { access_token: string; refresh_token?: string; address: string; name: string; avatar: string; provider: string }) => {
        const token   = data.access_token
        const address = data.address
        const name    = data.name
        const avatar  = data.avatar
        const provider = data.provider

        const tempUser = {
          id:             address,
          wallet_address: address,
          username:       name || null,
          avatar_url:     avatar || null,
          role:           'user' as const,
          is_verified:    false,
        }

        useAuthStore.getState().setAuth(token, tempUser, data.refresh_token)

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
          })
          .catch(() => { /* giữ nguyên tempUser nếu request fail */ })

        // Remember last social account for account picker in LoginModal
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
      })
      .catch(() => {
        router.replace('/?auth_error=exchange_failed')
      })
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
