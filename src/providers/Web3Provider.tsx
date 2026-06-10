'use client'

// ─────────────────────────────────────────────────────────────────
//  Web3Provider.tsx
//
//  Wraps the entire app with:
//    1. WagmiProvider    — blockchain state + hooks
//    2. QueryClientProvider — TanStack Query (required by Wagmi)
//    3. RainbowKitProvider  — pre-built connect UI (ConnectButton)
//
//  MUST be 'use client' — all Web3 hooks require browser environment.
//  Imported in layout.tsx as a child of SmoothScrollProvider.
// ─────────────────────────────────────────────────────────────────

import { ReactNode, useState } from 'react'
import { WagmiProvider }            from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme }    from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { wagmiConfig } from '@/web3/wagmi-config'

// Custom RainbowKit theme matching Neo-Luxury palette
const luxuryTheme = darkTheme({
  accentColor:          '#C9A96E', // gold
  accentColorForeground:'#1A1A1A', // charcoal on gold
  borderRadius:         'small',
  fontStack:            'system',
  overlayBlur:          'small',
})

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // QueryClient created inside component to avoid sharing state between users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,  // 1 minute cache
        retry:     1,
      },
    },
  }))

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={luxuryTheme}
          modalSize="wide"
          appInfo={{
            appName: 'ArtCurve',
            learnMoreUrl: 'https://artcurve.io',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
