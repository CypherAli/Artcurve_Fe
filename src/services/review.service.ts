import { get, post, request } from '@/lib/http'
import type { Review, CreateReviewDto } from '@/types/api'

export const reviewService = {
  getComments(artworkId: string, page = 1, limit = 20) {
    return get<Review[]>(`/social/comments/${artworkId}?page=${page}&limit=${limit}`)
  },

  createComment(artworkId: string, content: string, rating?: number) {
    const dto: CreateReviewDto = { content, ...(rating ? { rating } : {}) }
    return post<Review>(`/social/comment/${artworkId}`, dto, true)
  },

  deleteComment(commentId: string) {
    return request<void>(`/social/comment/${commentId}`, { method: 'DELETE', auth: true })
  },

  getStats(artworkId: string) {
    return get<{ like_count: number; comment_count: number; avg_rating: number | null }>(
      `/social/stats/${artworkId}`,
    )
  },

  getLikeCount(artworkId: string) {
    return get<{ count: number }>(`/social/likes/${artworkId}/count`)
  },

  likeArtwork(artworkId: string) {
    return post<void>(`/social/like/${artworkId}`, {}, true)
  },

  unlikeArtwork(artworkId: string) {
    return request<void>(`/social/like/${artworkId}`, { method: 'DELETE', auth: true })
  },
}
