# Marketplace Page

## Layout

Split-pane trading terminal at 100vh:

```
┌────────────────────────────────────────────────────────────┐
│  Command Center (header with animated charts + ticker)     │
├────────────────────────────────────────────────────────────┤
│  Phase tabs: ALL | ACCUMULATION | FOMO | MIGRATION         │
│  Artwork type: ✦ Original | ⬡ AI Art    ↗ RACE   Search   │
├──────────────────────────┬─────────────────────────────────┤
│  Left (40%)              │  Right (60%)                    │
│  Artwork list items      │  Inspection Deck                │
│  - Title, ticker         │  - Full artwork image           │
│  - Market cap            │  - Price details                │
│  - 24h change %          │  - Bonding curve chart          │
│  - Mini sparkline        │  - Buy button                   │
│  - Phase color badge     │  - Reviews                      │
│                          │                                 │
│  (infinite scroll)       │                                 │
└──────────────────────────┴─────────────────────────────────┘
```

## Phase System

Artworks are classified into phases based on bonding curve progress:

| Phase | Progress | Color | Meaning |
|-------|----------|-------|---------|
| Accumulation | 0-49% | Green `#4ade80` | Early stage, low price |
| FOMO | 50-89% | Gold `#D4AF37` | Growing demand |
| Migration | 90-100% | Red `#f87171` | Near graduation to DEX |

## Artwork Type Filter

Chips between phase tabs and RACE button:

- **✦ Original** (green `#4ade80`) — hand-made artworks
- **⬡ AI Art** (purple `#a78bfa`) — AI-generated artworks

Toggle behavior: click active chip to deselect (show all). Filter calls API with `artwork_type` query param.

## View Modes

- **List** (default) — sortable list with inspection deck
- **Race** — animated bar race showing market cap ranking over time

## Search

- 2+ chars → backend search via `GET /artworks/search?q=...`
- 1 char → client-side filter on title/ticker
- Debounced 400ms

## Price Simulation (Demo)

When no real WebSocket data, prices simulate with:
- Micro-ticks every 2s (±5%)
- Spike events every 9s (+20% to +130%)
- Mean-reversion every 4s (drift toward base)

## Data Source

```typescript
const { artworks, artworkType, setArtworkType } = useMarketplace({ initialLimit: 20 })
```

Falls back to `ARTWORKS_MOCK` when API unreachable.
