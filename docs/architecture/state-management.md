# State Management

## TanStack Query (Server State)

Used for all data from the API. Provides caching, refetching, pagination.

```typescript
// Marketplace listing with artworkType filter
const { artworks, artworkType, setArtworkType } = useMarketplace({
  initialLimit: 20,
  initialSortBy: 'created_at',
})

// Artwork detail
const { data } = useQuery({
  queryKey: ['artwork', id],
  queryFn: () => artworkService.getById(id),
})
```

### Query Key Convention

```
['artworks', 'list', page, limit, sortBy, artworkType]
['artwork', id]
['portfolio', 'pnl']
['trades', artworkId, 'history', page]
```

## Zustand (Client State)

Used only for client-side state that doesn't come from the API.

### Stores

| Store | Purpose | Persisted? |
|-------|---------|-----------|
| `authStore` | JWT tokens, user info, wallet | Yes (localStorage) |
| `chatStore` | Chat messages, sessions | No |
| `notificationStore` | Toasts, alerts | No |
| `portfolioStore` | Cached holdings | No |
| `priceStore` | OHLCV price cache | No |

### When to Use Which

| Scenario | Use |
|----------|-----|
| Data from API | TanStack Query |
| Auth tokens | Zustand (authStore) |
| UI toggle state | React useState |
| Form state | React useState |
| Real-time prices | React useState (local in component) |
| Theme preference | ThemeContext (localStorage) |
| Language | LanguageContext (localStorage) |
