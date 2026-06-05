'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/useAuth.ts  —  SIWE (Sign-In with Ethereum) auth hook
//
//  Flow:
//    1. Wallet connects via RainbowKit (wagmi useAccount)
//    2. Auto-request nonce from backend POST /auth/nonce
//    3. signMessageAsync(nonce message) via MetaMask/wallet
//    4. POST /auth/verify → receive JWT + user
//    5. Store JWT in localStorage (authStore)
//    6. All subsequent api calls inject the JWT automatically
//
//  Re-exports:
//    isAuthenticated — boolean
//    user            — AuthUser | null
//    status          — 'idle' | 'signing' | 'verifying' | 'authenticated' | 'error'
//    login()         — trigger SIWE flow manually
//    logout()        — revoke JWT + disconnect
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { authService } from '@/services/auth.service'
import { ApiError } from '@/lib/http'
import { authStore } from '@/lib/auth-store'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/api'

export type AuthStatus = 'idle' | 'signing' | 'verifying' | 'authenticated' | 'error'

interface AuthState {
  status:  AuthStatus
  user:    AuthUser | null
  error:   string | null
}

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync }     = useSignMessage()
  const { disconnect }           = useDisconnect()

  const [state, setState] = useState<AuthState>(() => {
    // Hydrate from localStorage on mount
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
    if (state.status === 'signing' || state.status === 'verifying') return

    try {
      // 1. Get nonce + SIWE message from backend
      setState(s => ({ ...s, status: 'signing', error: null }))
      const { message } = await authService.nonce(address)

      // 2. Ask wallet to sign the message
      const signature = await signMessageAsync({ message })

      // 3. Verify with backend → receive JWT
      setState(s => ({ ...s, status: 'verifying' }))
      const auth = await authService.verify(address, signature, message)

      // 4. Persist — sync cả 2 stores
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
    }
  }, [address, signMessageAsync, state.status])

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    // Best-effort — revoke JWT on server (adds it to Redis blacklist)
    await authService.logout().catch(() => {})
    authStore.clear()
    useAuthStore.getState().clearAuth()
    disconnect()
    setState({ status: 'idle', user: null, error: null })
  }, [disconnect])

  // ── Auto-trigger SIWE when wallet connects ─────────────────────
  // Only auto-login if no valid JWT is already stored
  useEffect(() => {
    if (
      isConnected &&
      address &&
      state.status === 'idle' &&
      !authStore.getJwt()
    ) {
      login()
    }
  }, [isConnected, address]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clear state when wallet disconnects ────────────────────────
  useEffect(() => {
    if (!isConnected && state.status === 'authenticated') {
      authStore.clear()
      setState({ status: 'idle', user: null, error: null })
    }
  }, [isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

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
