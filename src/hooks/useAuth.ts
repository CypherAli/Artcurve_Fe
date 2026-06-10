'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/useAuth.ts  —  SIWE (Sign-In with Ethereum) auth hook
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { authService }   from '@/services/auth.service'
import { ApiError }      from '@/lib/http'
import { authStore }     from '@/lib/auth-store'
import { useAuthStore }  from '@/store/authStore'
import type { AuthUser } from '@/types/api'

export type AuthStatus = 'idle' | 'signing' | 'verifying' | 'authenticated' | 'error'

interface AuthState {
  status:  AuthStatus
  user:    AuthUser | null
  error:   string | null
}

/** Parse chuỗi SIWE message thô để lấy domain và chainId */
function parseSiweMessage(raw: string): { domain: string; chainId: number } | null {
  try {
    const domainMatch  = raw.match(/^([^\s]+) wants you to sign/m)
    const chainIdMatch = raw.match(/Chain ID: (\d+)/)
    if (!domainMatch || !chainIdMatch) return null
    return {
      domain:  domainMatch[1],
      chainId: parseInt(chainIdMatch[1], 10),
    }
  } catch {
    return null
  }
}

const EXPECTED_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532',
  10,
)

export function useAuth() {
  const { address, isConnected }   = useAccount()
  const { signMessageAsync }       = useSignMessage()
  const { disconnect }             = useDisconnect()
  // Ref để track apakah sedang dalam proses login — tránh double-trigger
  const loginInProgressRef = useRef(false)

  const [state, setState] = useState<AuthState>(() => {
    const user = authStore.getUser()
    const jwt  = authStore.getJwt()
    return {
      status: user && jwt ? 'authenticated' : 'idle',
      user,
      error: null,
    }
  })

  // ── SIWE login flow ────────────────────────────────────────────
  const login = useCallback(async () => {
    if (!address) return
    if (loginInProgressRef.current) return
    if (state.status === 'signing' || state.status === 'verifying') return

    loginInProgressRef.current = true
    try {
      setState(s => ({ ...s, status: 'signing', error: null }))

      // 1. Get nonce + SIWE message
      const { message } = await authService.nonce(address)

      // 2. Validate SIWE message TRƯỚC KHI ký — chặn backend giả mạo / MITM
      const parsed = parseSiweMessage(message)
      if (!parsed) {
        throw new Error('SIWE message không hợp lệ — không thể parse domain/chainId')
      }
      const expectedDomain = typeof window !== 'undefined' ? window.location.hostname : ''
      if (expectedDomain && parsed.domain !== expectedDomain) {
        throw new Error(
          `SIWE domain mismatch: expected "${expectedDomain}", got "${parsed.domain}"`,
        )
      }
      if (parsed.chainId !== EXPECTED_CHAIN_ID) {
        throw new Error(
          `SIWE chainId mismatch: expected ${EXPECTED_CHAIN_ID}, got ${parsed.chainId}`,
        )
      }

      // 3. Ký message
      const signature = await signMessageAsync({ message })

      // 4. Verify với backend
      setState(s => ({ ...s, status: 'verifying' }))
      const auth = await authService.verify(address, signature, message)

      // 5. Persist — sync cả 2 stores
      authStore.setJwt(auth.access_token)
      authStore.setUser(auth.user)
      useAuthStore.getState().setAuth(auth.access_token, auth.user)

      setState({ status: 'authenticated', user: auth.user, error: null })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message :
        err instanceof Error    ? err.message :
        'Authentication failed'
      setState({ status: 'error', user: null, error: msg })
      authStore.clear()
    } finally {
      loginInProgressRef.current = false
    }
  }, [address, signMessageAsync, state.status])

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout().catch(() => {})
    authStore.clear()
    useAuthStore.getState().clearAuth()
    disconnect()
    setState({ status: 'idle', user: null, error: null })
  }, [disconnect])

  // ── Auto-trigger SIWE khi wallet connect và chưa có JWT ───────
  // Dùng state.status trong deps để tránh stale closure khi status thay đổi
  useEffect(() => {
    if (isConnected && address && state.status === 'idle' && !authStore.getJwt()) {
      login()
    }
    // login được wrap bằng useCallback với deps [address, signMessageAsync, state.status]
    // nên an toàn khi đưa vào đây
  }, [isConnected, address, state.status, login])

  // ── Clear state khi wallet disconnect ─────────────────────────
  useEffect(() => {
    if (!isConnected && state.status === 'authenticated') {
      // Logout API best-effort
      authService.logout().catch(() => {})
      authStore.clear()
      useAuthStore.getState().clearAuth()
      setState({ status: 'idle', user: null, error: null })
    }
  }, [isConnected, state.status])

  return {
    status:          state.status,
    user:            state.user,
    error:           state.error,
    isAuthenticated: state.status === 'authenticated',
    isSigning:       state.status === 'signing' || state.status === 'verifying',
    login,
    logout,
    walletAddress:   address ?? null,
  }
}
