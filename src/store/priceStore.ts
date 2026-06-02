import { create } from 'zustand'

interface PriceState {
  prices:    Record<string, string>   // artworkId → current price ETH string
  volumes:   Record<string, string>   // artworkId → 24h volume ETH string
  setPrice:  (artworkId: string, price: string) => void
  setVolume: (artworkId: string, volume: string) => void
  batchUpdate: (updates: { artwork_id: string; price: string; volume_24h?: string }[]) => void
}

export const usePriceStore = create<PriceState>((set) => ({
  prices:  {},
  volumes: {},
  setPrice: (artworkId, price) =>
    set(s => ({ prices: { ...s.prices, [artworkId]: price } })),
  setVolume: (artworkId, volume) =>
    set(s => ({ volumes: { ...s.volumes, [artworkId]: volume } })),
  batchUpdate: (updates) =>
    set(s => ({
      prices:  { ...s.prices,  ...Object.fromEntries(updates.map(u => [u.artwork_id, u.price])) },
      volumes: { ...s.volumes, ...Object.fromEntries(updates.filter(u => u.volume_24h).map(u => [u.artwork_id, u.volume_24h!])) },
    })),
}))
