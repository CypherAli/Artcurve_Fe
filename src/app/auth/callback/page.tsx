'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authStore } from '@/lib/auth-store'

export default function AuthCallbackPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token   = searchParams.get('token')
    const address = searchParams.get('address')
    const name    = searchParams.get('name')
    const error   = searchParams.get('auth_error')

    if (error || !token || !address) {
      router.replace('/?auth_error=1')
      return
    }

    // Lưu JWT + user vào localStorage (giống SIWE flow)
    authStore.setJwt(token)
    authStore.setUser({
      id:             '',
      wallet_address: address,
      username:       name ?? null,
      role:           'user',
      is_verified:    false,
    })

    // Redirect về trang trước hoặc marketplace
    const from = sessionStorage.getItem('auth_redirect') ?? '/marketplace'
    sessionStorage.removeItem('auth_redirect')
    router.replace(from)
  }, [searchParams, router])

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
