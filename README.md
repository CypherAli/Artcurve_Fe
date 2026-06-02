# ArtCurve — Frontend

Web3 Art Trading Platform built with **Next.js 14**, **wagmi v2**, **TanStack Query**, and **Framer Motion**.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS variables |
| Animation | Framer Motion + GSAP |
| Web3 | wagmi v2 + viem |
| State | Zustand (auth, price, portfolio) |
| Data fetching | TanStack React Query v5 |
| Charts | Custom SVG candlestick chart |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI components by domain
│   ├── common/       # Shared: Chart, Cursor, Toast, ErrorBoundary
│   ├── home/         # Landing page sections (13 sections)
│   ├── layout/       # Header, LoginModal
│   ├── marketplace/  # Trading terminal
│   ├── trade/        # DEX trade view
│   ├── vault/        # Portfolio dashboard
│   ├── studio/       # Artist upload studio
│   ├── live/         # Live stream
│   └── guild/        # Community
├── hooks/            # React Query + wagmi hooks
├── services/         # Typed API clients (split by domain)
├── store/            # Zustand global stores
├── web3/             # Contract ABIs, addresses, hooks
├── lib/              # HTTP client, auth-store, GSAP
├── types/            # TypeScript API types
├── utils/            # Format helpers
└── constants/        # App-wide constants
```

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CHAIN_ID=84532
```

## Auth Flow

Login uses **SIWE (Sign-In with Ethereum, EIP-4361)**:
1. Connect wallet via RainbowKit
2. Auto-request nonce from backend
3. Sign SIWE message in MetaMask
4. Backend verifies + issues JWT
5. JWT stored in localStorage + cookie for middleware

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/marketplace` | Live art marketplace terminal |
| `/trade` | DEX trading terminal |
| `/vault` | Portfolio dashboard (auth required) |
| `/studio` | Artist upload studio (auth required) |
| `/live` | Live streams |
| `/guild` | Community |
