'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authStore }    from '@/lib/auth-store'

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

    // id không được trả về trong callback params → dùng wallet_address làm key tạm thời.
    // useAuthStore.user.id sẽ được làm giàu sau khi GET /users/me với JWT mới.
    const userData = {
      id:             address,   // placeholder — sẽ được replace khi /users/me trả về UUID thật
      wallet_address: address,
      username:       name ?? null,
      avatar_url:     avatar || null,
      role:           'user' as const,
      is_verified:    false,
    }

    // Sync both stores so http.ts (authStore) and UI (useAuthStore) both work
    useAuthStore.getState().setAuth(token, userData)
    authStore.setJwt(token)
    authStore.setUser(userData)

    // Remember last social account for account picker in LoginModal
    const provider = searchParams.get('provider') ?? 'github'
    const storageKey =
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
