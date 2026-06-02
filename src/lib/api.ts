// lib/api.ts — backwards compat shim, delegates to typed services
import { authService }      from '@/services/auth.service'
import { userService }      from '@/services/user.service'
import { artworkService }   from '@/services/artwork.service'
import { tradeService }     from '@/services/trade.service'
import { portfolioService } from '@/services/portfolio.service'

export { ApiError } from '@/lib/http'

export const api = {
  auth:      authService,
  users:     userService,
  artworks:  artworkService,
  trades:    tradeService,
  portfolio: portfolioService,
}
