'use client'

// ─────────────────────────────────────────────────────────────────
//  wagmi-config.ts  — Wagmi v3 + RainbowKit v2 configuration
//
//  Uses RainbowKit's `getDefaultConfig` helper which wraps
//  WagmiConfig + WalletConnect setup in one call.
//  Chains: Base (primary for ArtCurve) + Ethereum mainnet (fallback)
// ─────────────────────────────────────────────────────────────────

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName:   'ArtCurve',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'cc275f83791b65f859c7acb215931508',
  chains:    [baseSepolia],
  ssr:       true, // Required for Next.js App Router SSR compatibility
})
