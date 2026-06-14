import { get, post, postForm, request } from '@/lib/http'
import type { Artwork, ArtworkListResponse, ArtworkSearchParams, CreateArtworkDto, UpdateArtworkStatusDto, TradeHistoryResponse, IpfsUploadResult } from '@/types/api'

export const artworkService = {
  list(params: { page?: number; limit?: number; sortBy?: 'price' | 'created_at' | 'view_count' } = {}) {
    const q = new URLSearchParams()
    if (params.page)   q.set('page',   String(params.page))
    if (params.limit)  q.set('limit',  String(params.limit))
    if (params.sortBy) q.set('sortBy', params.sortBy)
    return get<ArtworkListResponse>(`/artworks${q.toString() ? `?${q}` : ''}`)
  },
  search(params: ArtworkSearchParams = {}) {
    const q = new URLSearchParams()
    if (params.q)          q.set('q',          params.q)
    if (params.category)   q.set('category',   params.category)
    if (params.curve_type) q.set('curve_type', params.curve_type)
    if (params.sortBy)     q.set('sortBy',     params.sortBy)
    if (params.page)       q.set('page',       String(params.page))
    if (params.limit)      q.set('limit',      String(params.limit))
    return get<ArtworkListResponse>(`/artworks/search${q.toString() ? `?${q}` : ''}`)
  },
  myArtworks:   ()                              => get<Artwork[]>('/artworks/my', true),
  getById:      (id: string)                    => get<Artwork>(`/artworks/${id}`),
  history:      (id: string, page=1, limit=20)  => get<TradeHistoryResponse>(`/artworks/${id}/history?page=${page}&limit=${limit}`),
  view:         (id: string)                    => request<void>(`/artworks/${id}/view`, { method: 'POST' }),
  uploadMedia(file: File, title: string, description = '') {
    const fd = new FormData()
    fd.append('file', file); fd.append('title', title); fd.append('description', description)
    return postForm<IpfsUploadResult>('/artworks/upload', fd)
  },
  platformStats: () => get<{ artworkCount: number; totalVolumeEth: string; collectorCount: number }>('/artworks/stats'),
  createDraft:  (dto: CreateArtworkDto)         => post<Artwork>('/artworks', dto, true),
  updateStatus: (id: string, dto: UpdateArtworkStatusDto) =>
    request<Artwork>(`/artworks/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto), auth: true }),
}
