'use client'

// ─────────────────────────────────────────────────────────────────
//  wagmi-config.ts  — Single source of truth cho wagmi + RainbowKit
//
//  Chain: env-driven qua NEXT_PUBLIC_CHAIN_ID — PHẢI khớp BE CHAIN_ID:
//    - 84532 (Base Sepolia, mặc định) — contracts đã deploy tại đây
//    - 8453  (Base Mainnet) — chỉ đổi khi đã deploy contracts mainnet
//    - 31337 (Anvil local sandbox) — chạy Artcurve_Be/contracts/sandbox.ps1
//      rồi đặt NEXT_PUBLIC_CHAIN_ID=31337 trong .env.local (chỉ dev local)
//
//  QUAN TRỌNG: đổi chain thì đổi CẢ FE NEXT_PUBLIC_CHAIN_ID (Vercel)
//  + BE CHAIN_ID (Render) đồng thời, nếu lệch SIWE login sẽ sai chain.
//
//  Wallets: danh sách mở rộng thay vì 4 ví mặc định của
//  getDefaultConfig. Ví injected/safe vẫn nằm trong nhóm "Khác".
// ─────────────────────────────────────────────────────────────────

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
  okxWallet,
  binanceWallet,
  bitgetWallet,
  rabbyWallet,
  phantomWallet,
  zerionWallet,
  uniswapWallet,
  ledgerWallet,
  imTokenWallet,
  tokenPocketWallet,
  oneKeyWallet,
  braveWallet,
  safeWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { base, baseSepolia, foundry } from 'wagmi/chains'

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? '84532')
const activeChain =
  CHAIN_ID === base.id    ? base :
  CHAIN_ID === foundry.id ? foundry : // 31337 — Anvil sandbox local
  baseSepolia

export const wagmiConfig = getDefaultConfig({
  appName:   'ArtCurve',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'PLACEHOLDER_BUILD',
  chains:    [activeChain],
  ssr:       true,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
        trustWallet,
      ],
    },
    {
      groupName: 'Exchanges & Multi-chain',
      wallets: [
        okxWallet,
        binanceWallet,
        bitgetWallet,
        rabbyWallet,
        phantomWallet,
        zerionWallet,
        uniswapWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        ledgerWallet,
        imTokenWallet,
        tokenPocketWallet,
        oneKeyWallet,
        braveWallet,
        safeWallet,
        injectedWallet,
      ],
    },
  ],
})
