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
import { base } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName:   'ArtCurve',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'cc275f83791b65f859c7acb215931508',
  chains:    [base],
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
