# ArtCurve — Frontend

> Fractionalized Art Trading DApp on Base L2 — Next.js 14 + Wagmi + LiveKit

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Base L2](https://img.shields.io/badge/Base-L2-0052FF?logo=coinbase)](https://base.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://artcurve-fe.vercel.app)

**Live:** [https://artcurve-fe.vercel.app](https://artcurve-fe.vercel.app)

---

## 📚 Documentation

| Tài liệu | Nội dung |
|---|---|
| [docs/PROJECT.md](docs/PROJECT.md) | Tổng quan kiến trúc frontend |
| [docs/setup/](docs/setup/) | Chạy local (`local-dev.md`) · deploy (`deployment.md`) |
| [docs/architecture/](docs/architecture/) | Kiến trúc tổng thể · state management |
| [docs/design/](docs/design/) | Design tokens · dark mode |
| [docs/features/](docs/features/) | Marketplace · artwork type system |
| [docs/i18n/](docs/i18n/) | Thêm ngôn ngữ mới |
| [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) | Hướng dẫn cho AI coding agent (phải ở root) |

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Artwork Type System](#artwork-type-system)
- [Web3 Integration](#web3-integration)
- [Real-time Updates](#real-time-updates)
- [Live Streaming](#live-streaming)
- [Deployment](#deployment)

---

## Overview

ArtCurve is a Web3 platform where artists tokenize their artwork into tradeable shares on Base L2. Collectors buy and sell shares via bonding curve AMMs, with prices determined algorithmically. The frontend provides:

- **Marketplace** — Browse and discover artworks with real-time price data
- **Trade Page** — Buy/sell artwork shares directly via smart contract
- **Studio** — Artists create, upload, and launch artwork token sales
- **Live** — Artists stream creation process with embedded trading
- **Wallet** — Portfolio dashboard with P&L and holdings

---

## Features

| Feature | Description |
|---------|-------------|
| 🔐 **SIWE Auth** | Sign-In With Ethereum (EIP-4361) via MetaMask / WalletConnect |
| 📈 **Bonding Curve** | Real-time price chart (TradingView Lightweight Charts) |
| ⚡ **Live Prices** | Socket.IO subscription to `/prices` namespace |
| 🎥 **Live Streaming** | LiveKit Cloud — artists broadcast while collectors trade |
| 🎨 **IPFS Upload** | Artwork image + ERC-721 metadata pinned to Pinata |
| 💼 **Portfolio** | P&L tracking, holdings, top holders leaderboard |
| 👥 **Social** | Follow artists, like artworks, post reviews with star ratings |
| 📊 **Analytics** | OHLCV candlestick charts (ClickHouse Materialized Views) |
| 🌐 **Multi-chain** | Base Mainnet (8453) + Base Sepolia testnet (84532) |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **Animation** | Framer Motion, GSAP + Lenis (scroll) |
| **Web3** | Wagmi v2, RainbowKit, viem |
| **State** | Zustand (auth store) |
| **Data Fetching** | Native `fetch()` |
| **WebSocket** | Socket.IO client (`/prices` namespace) |
| **Charts** | TradingView Lightweight Charts |
| **Live Video** | LiveKit React SDK |
| **Price Feed** | Binance WebSocket public stream |

---

## Prerequisites

- Node.js ≥ 20
- npm / pnpm / yarn
- A browser with MetaMask or another Web3 wallet
- Backend API running (see [ArtCurve Backend](https://github.com/CypherAli/Artcurve_BE))

---

## Quick Start

```bash
# 1. Clone repo
git clone https://github.com/CypherAli/Artcurve_Fe.git
cd Artcurve_Fe

# 2. Install dependencies
npm install

# 3. Copy env file and configure
cp .env.example .env.local

# 4. Start development server
npm run dev
```

App available at: `http://localhost:3000`

> **Note:** The app requires the backend API to be running. Point `NEXT_PUBLIC_API_URL` to your local backend or the production URL.

---

## Environment Variables

Create `.env.local` in the project root:

```env
# ── Backend API ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
# Production:
# NEXT_PUBLIC_API_URL=https://artcurve-be.onrender.com/api/v1

# ── LiveKit ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_LIVEKIT_URL=wss://artcurve-3el8ft2f.livekit.cloud

# ── WalletConnect (RainbowKit) ────────────────────────────────────────────────
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# ── Chain ────────────────────────────────────────────────────────────────────
# 8453  = Base Mainnet
# 84532 = Base Sepolia (testnet)
NEXT_PUBLIC_CHAIN_ID=84532
```

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (providers, fonts)
│   ├── page.tsx                # Homepage
│   ├── marketplace/
│   │   └── page.tsx            # Artwork marketplace grid
│   ├── artwork/
│   │   └── [id]/
│   │       └── page.tsx        # Artwork detail + trade panel
│   ├── studio/
│   │   ├── page.tsx            # Artist studio (create artwork)
│   │   └── stream/
│   │       └── [roomName]/
│   │           └── page.tsx    # Live broadcast room
│   ├── live/
│   │   └── page.tsx            # Live streams listing
│   ├── wallet/
│   │   └── page.tsx            # Portfolio + holdings dashboard
│   ├── profile/
│   │   └── [wallet]/
│   │       └── page.tsx        # Public artist profile
│   └── auth/
│       └── callback/
│           └── page.tsx        # OAuth callback handler
│
├── components/
│   ├── home/                   # Homepage sections
│   ├── marketplace/            # Artwork cards, filters, grid
│   ├── artwork/                # Detail page, trade panel
│   ├── trade/                  # Buy/sell UI, price chart
│   ├── studio/                 # Create artwork flow
│   ├── live/
│   │   ├── LivePage.tsx        # Stream listing + Go Live modal
│   │   ├── LiveBroadcaster.tsx # Host broadcasting component
│   │   └── LiveViewer.tsx      # Viewer component
│   ├── portfolio/              # Holdings, P&L cards
│   ├── wallet/                 # Wallet connect, balance
│   └── ui/                     # Shared UI components
│
├── hooks/
│   ├── usePriceSocket.ts       # Socket.IO /prices real-time price
│   ├── useBinanceTicker.ts     # Binance WebSocket ETH/USD price
│   ├── useTrades.ts            # Trade history fetching
│   ├── useMarketplace.ts       # Marketplace data + filters
│   ├── useBuyTokens.ts         # wagmi buy contract call
│   └── useSellTokens.ts        # wagmi sell contract call
│
├── services/                   # API service layer
│   ├── auth.service.ts         # SIWE nonce + verify
│   ├── artwork.service.ts      # Artwork CRUD, upload, OHLCV
│   ├── trade.service.ts        # Trade history, leaderboard
│   ├── portfolio.service.ts    # P&L, holdings
│   ├── user.service.ts         # User profiles
│   └── review.service.ts       # Social interactions
│
├── lib/
│   ├── http.ts                 # Fetch wrapper with auth header + error handling
│   └── wagmi.ts                # Wagmi + RainbowKit config
│
├── stores/
│   └── authStore.ts            # Zustand auth state (JWT, user, wallet)
│
└── types/
    └── api.ts                  # TypeScript interfaces for all API responses
```

---

## Pages & Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Homepage — hero, stats, featured artworks | Public |
| `/marketplace` | Full artwork grid with filters and sorting | Public |
| `/artwork/[id]` | Artwork detail: price chart, trade panel, holders | Public |
| `/studio` | Artist dashboard — create and manage artworks | Required |
| `/studio/stream/[roomName]` | Live broadcast room (host) | Required |
| `/live` | Live streams listing — "Go Live" button for artists | Public |
| `/wallet` | Portfolio P&L and holdings | Required |
| `/profile/[wallet]` | Public artist profile with their artworks | Public |
| `/auth/callback` | OAuth redirect landing (GitHub / Twitter / Telegram) | Public |

---

## Artwork Type System

ArtCurve separates Original (hand-made) and AI-generated artworks across the platform:

### Marketplace
- **Filter chips** next to phase tabs: `Original` | `AI Art`
- Click to toggle filter — clicking active chip deselects it (shows all)
- Color coding: Original = green (#4ade80), AI Art = purple (#a78bfa)

### Trade Page
- Same filter chips in the TokenPickerPanel sidebar
- Filters the artwork list by type

### Studio (Create Artwork)
- Artists self-declare artwork type when uploading:
  - **Original (Hand-made)** — traditional/digital art created by human
  - **AI Generated** — fully AI-created artwork
  - **AI Assisted** — human-created with AI tools assistance
- Default: Original

### API Integration
```typescript
// useMarketplace hook supports artworkType filter
const { artworks, artworkType, setArtworkType } = useMarketplace()

// Service layer
artworkService.list({ artwork_type: 'ORIGINAL' })
artworkService.search({ artwork_type: 'AI_GENERATED', q: 'landscape' })
```

---

## Web3 Integration

### Wallet Connection

RainbowKit handles wallet connection UI. Supported wallets: MetaMask, Coinbase Wallet, WalletConnect (mobile), and browser injected wallets.

```tsx
// lib/wagmi.ts
const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]:        http(),
    [baseSepolia.id]: http(),
  },
})
```

### Authentication — SIWE (Sign-In With Ethereum)

```
1. User connects wallet (RainbowKit)
2. FE calls POST /auth/nonce { wallet_address }
   ← { nonce, message }  (EIP-4361 formatted)
3. User signs message with MetaMask
   wallet.signMessage(message) → signature
4. FE calls POST /auth/verify { wallet_address, signature, message }
   ← { access_token, user }
5. JWT stored in authStore (Zustand)
   All subsequent API calls: Authorization: Bearer <token>
```

### On-chain Trading

Trades go **directly to the smart contract** — no REST order endpoint. The backend indexes on-chain events after the fact.

```tsx
// hooks/useBuyTokens.ts
const { writeContract } = useWriteContract()

writeContract({
  address: BONDING_CURVE_AMM_ADDRESS,
  abi: BondingCurveAMM_ABI,
  functionName: 'buyShares',
  args: [artworkId, sharesAmount],
  value: ethAmount,   // ETH sent with transaction
})
```

### Network

| Network | Chain ID | RPC |
|---------|----------|-----|
| Base Mainnet | 8453 | https://mainnet.base.org |
| Base Sepolia | 84532 | https://sepolia.base.org |

---

## Real-time Updates

### Price Socket (`/prices` namespace)

```tsx
// hooks/usePriceSocket.ts
const { price, supply, volume24h, connected } = usePriceSocket(artworkId)
```

Internally:
```js
const socket = io(`${BASE_URL}/prices`, { transports: ['websocket'] })

socket.on('connect', () => {
  socket.emit('subscribe_artwork', { artwork_id })
})

socket.on('price_snapshot', handler)   // immediate snapshot on subscribe
socket.on('price_update',   handler)   // real-time update per trade
socket.on('artwork_graduated', handler) // artwork reached target cap
```

### Binance ETH/USD Ticker

```tsx
// hooks/useBinanceTicker.ts
// Connects to wss://stream.binance.com:9443 for real-time ETH price
const { ethUsd } = useBinanceTicker(['ETHUSDT'])
```

---

## Live Streaming

### Host Flow

```
1. Artist clicks "Go Live" on /live page
2. Modal: fill title, category, linked artwork ticker
3. POST /api/v1/live/create → { roomName, token, liveKitUrl }
4. Token stored in sessionStorage
5. Redirect to /studio/stream/[roomName]
6. LiveBroadcaster renders:
   - <LiveKitRoom token={token} serverUrl={LK_URL}>
   - Camera + screen share controls
   - Overlay: price ticker of linked artwork
```

### Viewer Flow

```
1. Viewer picks a stream on /live listing
2. Navigate to stream viewer page
3. GET /api/v1/live/{roomName}/viewer-token → { token }
4. LiveViewer renders:
   - <LiveKitRoom token={token} serverUrl={LK_URL}>
   - Video feed from host
   - Trade panel alongside (buy/sell while watching)
```

---

## Deployment

### Vercel (current)

The app deploys automatically on push to `main` via Vercel GitHub integration.

```
Live URL: https://artcurve-fe.vercel.app
```

**Required environment variables** must be set in the Vercel project dashboard (Settings → Environment Variables).

### Manual Deploy

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

### Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

---

## Scripts

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

---

## Known Patterns

| Context | Correct | Wrong |
|---------|---------|-------|
| Auth store | `authStore.getJwt()` | `authStore.getToken()` |
| Framer Motion ease | `[0.215, 0.61, 0.355, 1.0] as [number,number,number,number]` | `number[]` |
| Framer variants | Annotate `Variants` explicitly | Infer from object literal |
| Tailwind | `size-*`, `min-h-dvh`, `outline-hidden` | Deprecated v3 utilities |
| WebSocket base URL | `API_URL.replace('/api/v1', '')` for Socket.IO host | Use raw API URL with path |

---

## License

Private — ArtCurve Team © 2026
