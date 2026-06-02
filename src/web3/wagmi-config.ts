'use client'

// ─────────────────────────────────────────────────────────────────
//  wagmi-config.ts  — Wagmi v3 + RainbowKit v2 configuration
//
//  Uses RainbowKit's `getDefaultConfig` helper which wraps
//  WagmiConfig + WalletConnect setup in one call.
//  Chains: Base (primary for ArtCurve) + Ethereum mainnet (fallback)
// ─────────────────────────────────────────────────────────────────

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, mainnet } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName:   'ArtCurve',
  // NOTE: Replace with real WalletConnect Project ID from cloud.walletconnect.com
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'artcurve-demo-id',
  chains:    [base, mainnet],
  ssr:       true, // Required for Next.js App Router SSR compatibility
})
