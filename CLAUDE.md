# ArtCurve Frontend — Development Guide

## Stack
- Next.js 14 (App Router)
- TypeScript 5
- Tailwind CSS v4 + inline styles for dynamic values
- Wagmi v2 + RainbowKit (Web3 wallet)
- TanStack Query (data fetching)
- Zustand (auth, portfolio, notifications state)
- Framer Motion (animations)
- Socket.IO (real-time prices)

## Conventions
- CSS: Use `var(--tp-*)` tokens for trade page, `var(--ac-*)` for general
- Colors: Gold `#D4AF37` (accent), phase colors in `PHASE_COLOR` constant
- Typography: `--font-serif` (Cormorant Garamond) for headings, `--font-sans` (Inter) for body
- Dark mode: Uses `html.dark` class with View Transition API ("claw rip" animation)
- i18n: 10 locales (en, vi, ar, de, es, fr, ja, ko, pt, zh) — always add keys to ALL locale files
- API: Services in `src/services/`, hooks in `src/hooks/`, types in `src/types/api.ts`
- State: TanStack Query for server state, Zustand only for client state (auth, UI)
- Components: `src/components/{feature}/` — one directory per feature

## Important Files
- `src/types/api.ts` — All TypeScript types matching BE DTOs
- `src/services/artwork.service.ts` — Artwork API calls
- `src/hooks/useMarketplace.ts` — Marketplace data hook with artworkType filter
- `src/components/marketplace/MarketplacePage.tsx` — Main marketplace (3500+ lines)
- `src/components/trade/TradePage.tsx` — Trading terminal
- `src/components/studio/StudioPage.tsx` — Artwork creation form
- `src/app/globals.css` — CSS variables and design tokens

## Environment Variables
- `NEXT_PUBLIC_API_URL` — Backend API base URL
- `NEXT_PUBLIC_CHAIN_ID` — Blockchain chain ID (84532 = Base Sepolia)
- `NEXT_PUBLIC_WS_HUB_URL` — WebSocket hub URL
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect project ID
- `NEXT_PUBLIC_LIVEKIT_URL` — LiveKit streaming URL

## Deploy
- Platform: Vercel
- Branch: main (auto-deploy)
- URL: https://artcurve-fe.vercel.app
