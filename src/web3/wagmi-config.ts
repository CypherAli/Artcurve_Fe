'use client'

// ─────────────────────────────────────────────────────────────────
//  wagmi-config.ts  — Single source of truth cho wagmi + RainbowKit
//
//  Chain: Base Mainnet (chainId 8453) — khớp với:
//    - BE SIWE_CHAIN_ID = 8453
//    - BE CHAIN_ID      = 8453
//    - Indexer          = base (viem/chains)
//
//  QUAN TRỌNG: baseSepolia (84532) bị xóa — nếu dùng testnet thì
//  đổi CẢ BE env SIWE_CHAIN_ID + CHAIN_ID đồng thời.
// ─────────────────────────────────────────────────────────────────

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName:   'ArtCurve',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'cc275f83791b65f859c7acb215931508',
  chains:    [base],
  ssr:       true,
})
