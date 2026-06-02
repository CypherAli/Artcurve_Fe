'use client'
// ─────────────────────────────────────────────────────────────────
//  hooks/useMarketplace.ts  —  Paginated artwork listing
//
//  Wraps GET /artworks with TanStack Query.
//  Falls back to empty list on error so the page renders.
//
//  Usage:
//    const { artworks, total, isLoading, page, setPage, sortBy, setSortBy }
//      = useMarketplace()
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { artworkService } from '@/services/artwork.service'
import type { Artwork } from '@/types/api'

export type MarketplaceSortBy = 'price' | 'created_at' | 'view_count'

interface UseMarketplaceOptions {
  initialPage?:   number
  initialLimit?:  number
  initialSortBy?: MarketplaceSortBy
}

export function useMarketplace({
  initialPage   = 1,
  initialLimit  = 20,
  initialSortBy = 'created_at',
}: UseMarketplaceOptions = {}) {
  const [page,   setPage]   = useState(initialPage)
  const [limit,  setLimit]  = useState(initialLimit)
  const [sortBy, setSortBy] = useState<MarketplaceSortBy>(initialSortBy)

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['artworks', 'list', page, limit, sortBy],
    queryFn:  () => artworkService.list({ page, limit, sortBy }),
    staleTime: 30_000,          // 30 s
    placeholderData: (prev) => prev, // keep previous page visible while loading next
  })

  return {
    artworks:  (data?.data ?? []) as Artwork[],
    total:     data?.total ?? 0,
    page:      data?.page  ?? page,
    pageCount: data ? Math.ceil(data.total / limit) : 0,
    isLoading,
    isFetching,
    error,
    sortBy,
    setSortBy,
    setPage,
    setLimit,
    refetch,
  }
}
