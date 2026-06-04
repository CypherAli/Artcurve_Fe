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

    const userData = {
      id:             '',
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

    // Remember last GitHub account for account picker in LoginModal
    localStorage.setItem('artcurve_github_account', JSON.stringify({
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
