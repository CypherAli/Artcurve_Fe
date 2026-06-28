# Frontend Architecture

## App Router Structure

```
src/app/
├── layout.tsx              ← Root layout (providers, theme, navbar)
├── globals.css             ← CSS variables, design tokens
├── marketplace/page.tsx    ← Marketplace listing
├── trade/page.tsx          ← Trading terminal
├── studio/page.tsx         ← Artwork creation
├── artwork/[id]/page.tsx   ← Artwork detail
├── vault/page.tsx          ← Portfolio & P&L
├── guild/page.tsx          ← Guild communities
├── live/page.tsx           ← Live streaming
├── wallet/page.tsx         ← Wallet management
├── settings/page.tsx       ← User settings
├── chat/page.tsx           ← AI assistant
└── auth/callback/page.tsx  ← OAuth callback handler
```

## Component Hierarchy

```
Layout (providers, theme, auth)
  └── Navbar (navigation, wallet connect, notifications)
      └── Page Components
          ├── MarketplacePage (3500+ lines)
          │   ├── HeaderChartBg (animated background)
          │   ├── TickerTape (Binance live prices)
          │   ├── Phase tabs + Artwork type chips
          │   ├── ListItem (left panel)
          │   ├── InspectionDeck (right panel)
          │   ├── RaceView (animated ranking)
          │   └── BuyModal (transaction)
          ├── TradePage
          │   ├── TokenPickerPanel (sidebar)
          │   ├── CandlestickChart (TradingView-style)
          │   └── OrderPanel (buy/sell)
          └── StudioPage
              ├── UploadForm (left)
              ├── Preview + BondingCurveChart (center)
              └── LaunchChecklist (right)
```

## Data Flow

```
API (artworkService)
  ↓
TanStack Query (cache, refetch)
  ↓
useMarketplace / useAuth hooks
  ↓
Component (render)
  ↓
WebSocket (real-time price updates)
  ↓
Local state update (livePrices)
```

## Key Patterns

- **Server state**: TanStack Query (`useQuery`, `useMutation`) — artworks, portfolio, trades
- **Client state**: Zustand — auth tokens, UI preferences, notifications
- **Real-time**: Socket.IO for price updates, WebSocket for live chat
- **Styling**: Tailwind + inline `style={}` for dynamic values (phase colors, theme tokens)
- **Animations**: Framer Motion (`motion.div`, `AnimatePresence`)
- **Web3**: Wagmi v2 + RainbowKit for wallet connection, viem for contract calls
