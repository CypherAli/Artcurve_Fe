# Artwork Type System

## Overview

ArtCurve separates artworks by creation method. Artists self-declare the type when uploading.

| Type | Value | Color | Icon | Description |
|------|-------|-------|------|-------------|
| Original | `ORIGINAL` | Green `#4ade80` | ✦ | Hand-made by human artist |
| AI Generated | `AI_GENERATED` | Purple `#a78bfa` | ⬡ | Fully created by AI tools |
| AI Assisted | `AI_ASSISTED` | Blue `#60a5fa` | ◇ | Human-created with AI assistance |

## Where It Appears

### Marketplace (`MarketplacePage.tsx`)
- Filter chips next to RACE button
- Click to filter, click again to deselect
- Calls `GET /artworks?artwork_type=ORIGINAL`

### Trade (`TradePage.tsx`)
- Filter chips in TokenPickerPanel (sidebar)
- Same toggle behavior as marketplace

### Studio (`StudioPage.tsx`)
- 3-button selector after Category field
- Default: ORIGINAL
- Sent as `artwork_type` in `POST /artworks` body

## API

```typescript
// Types
type ArtworkType = 'ORIGINAL' | 'AI_GENERATED' | 'AI_ASSISTED'

// List with filter
artworkService.list({ artwork_type: 'ORIGINAL' })

// Search with filter
artworkService.search({ artwork_type: 'AI_GENERATED', q: 'landscape' })

// Create with type
artworkService.createDraft({ title: '...', artwork_type: 'AI_ASSISTED' })
```

## Hook

```typescript
const { artworks, artworkType, setArtworkType } = useMarketplace()

// Filter
setArtworkType('ORIGINAL')    // show only originals
setArtworkType(undefined)     // show all
```

## i18n Keys

| Context | Keys |
|---------|------|
| Marketplace | `marketplace.typeOriginal`, `marketplace.typeAiGenerated` |
| Trade | `trade.chipOriginal`, `trade.chipAiArt` |
| Studio | `studio.artworkTypeLabel`, `studio.typeOriginal`, `studio.typeAiGenerated`, `studio.typeAiAssisted` |
