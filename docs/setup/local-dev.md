# Local Development Setup

## Prerequisites

- Node.js 20+
- npm or pnpm

## Quick Start

```bash
# Clone
git clone https://github.com/CypherAli/Artcurve_Fe.git
cd Artcurve_Fe

# Install
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values (see below)

# Run
npm run dev
# → http://localhost:3000
```

## Environment Variables (.env.local)

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
# For production: https://artcurve-be.onrender.com/api/v1

# Blockchain
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-walletconnect-project-id>

# WebSocket
NEXT_PUBLIC_WS_HUB_URL=ws://localhost:8080
# For production: wss://artcurve-ws-hub.onrender.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Live streaming
NEXT_PUBLIC_LIVEKIT_URL=wss://artcurve-3el8ft2f.livekit.cloud
```

## Running with Backend

1. Start BE: `cd Artcurve_Be && npm run start:dev`
2. Start FE: `cd Artcurve_Fe && npm run dev`
3. Open http://localhost:3000

## Without Backend

The marketplace page falls back to mock data when the API is unreachable. Most pages will show empty states.

## Build

```bash
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check
```
