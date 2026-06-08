// ─────────────────────────────────────────────────────────────────
//  types/api.ts — TypeScript types matching NestJS backend DTOs
//  Mirrors: Artcurve_database/src/modules/**/dto/*.ts
// ─────────────────────────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────
export type ArtworkStatus =
  | 'DRAFT'
  | 'AI_MODERATING'
  | 'ACTIVE'
  | 'TARGET_REACHED'
  | 'GRADUATED'

export type CurveType = 'linear' | 'quadratic' | 'exponential'

export type ArtworkCategory =
  | 'Painting'
  | 'Drawing'
  | 'Digital'
  | 'Photography'
  | 'Sculpture'
  | 'Mixed Media'
  | 'Generative'

export const ARTWORK_CATEGORIES: ArtworkCategory[] = [
  'Painting', 'Drawing', 'Digital', 'Photography',
  'Sculpture', 'Mixed Media', 'Generative',
]

export type TxType = 'BUY' | 'SELL' | 'MINT' | 'GRADUATE'
export type UserRole = 'user' | 'artist' | 'admin'
export type OhlcvTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

// ── User Profile ──────────────────────────────────────────────────
export interface UserProfile {
  id:             string
  wallet_address: string
  username:       string | null
  bio:            string | null
  avatar_url:     string | null
  twitter_handle: string | null
  is_verified:    boolean
  role:           UserRole
  created_at:     string
}

export interface UpdateProfileDto {
  username?:       string
  bio?:            string
  avatar_url?:     string
  twitter_handle?: string
}

// ── Auth ──────────────────────────────────────────────────────────
export interface NonceRequest  { wallet_address: string }

export interface NonceResponse {
  nonce:   string
  message: string    // EIP-191 SIWE message, ready to sign
}

export interface VerifyRequest {
  wallet_address: string
  signature:      string   // hex sig from wallet
  message:        string   // original SIWE message (for domain verification)
}

export interface AuthUser {
  id:             string
  wallet_address: string
  username:       string | null
  avatar_url:     string | null
  is_verified:    boolean
  role:           UserRole
}

export interface AuthResponse {
  access_token: string
  expires_in:   number        // seconds
  user:         AuthUser
}

// ── Artworks ──────────────────────────────────────────────────────
export interface ArtworkCreator {
  id:             string
  wallet_address: string
  username:       string | null
  avatar_url:     string | null
  is_verified:    boolean
}

export interface Artwork {
  id:                  string
  title:               string
  description:         string | null
  image_uri:           string | null   // direct image URL (IPFS or HTTPS)
  ipfs_metadata_uri:   string | null
  contract_address:    string | null   // null until deployed
  status:              ArtworkStatus
  creator_id:          string
  creator?:            ArtworkCreator
  // ── token metadata (added in migration 007) ──
  ticker:              string | null   // e.g. "$PALE"
  category:            ArtworkCategory | null
  royalty_pct:         string          // DECIMAL(5,2) as string, e.g. "5.00"
  curve_type:          CurveType       // default "quadratic"
  init_price:          string          // ETH, e.g. "0.00100000"
  // ── live stats ──
  target_cap:          string          // DECIMAL as string
  current_supply:      string
  current_price:       string          // ETH per token
  view_count:          number
  created_at:          string          // ISO-8601
  updated_at:          string
}

export interface ArtworkListResponse {
  data:  Artwork[]
  total: number
  page:  number
}

export interface ArtworkSearchParams {
  q?:          string
  category?:   ArtworkCategory
  curve_type?: CurveType
  sortBy?:     'price' | 'created_at' | 'view_count' | 'supply'
  page?:       number
  limit?:      number
}

export interface CreateArtworkDto {
  title:              string
  description?:       string
  image_uri?:         string
  ipfs_metadata_uri?: string
  target_cap:         string
  ticker?:            string   // auto-generated if omitted
  category?:          ArtworkCategory
  royalty_pct?:       string   // default "5.00"
  curve_type?:        CurveType
  init_price?:        string   // default "0.00100000"
}

export interface UpdateArtworkStatusDto {
  status:               ArtworkStatus
  contract_address?:    string    // required when status = ACTIVE
  ipfs_metadata_uri?:   string    // required when status = ACTIVE
}

// ── Trades / OHLCV ────────────────────────────────────────────────
// Raw candle từ BE (ClickHouse bucket = ISO-8601 string)
export interface OhlcvCandleRaw {
  bucket:      string  // ISO-8601, e.g. "2024-01-01T00:00:00.000Z"
  open:        string
  high:        string
  low:         string
  close:       string
  volume:      string
  trade_count: string
}

// Normalized candle cho chart (time = Unix seconds)
export interface OhlcvCandle {
  time:        number  // Unix timestamp (seconds) — converted from bucket
  open:        string
  high:        string
  low:         string
  close:       string
  volume:      string
  trade_count: string
}

// Helper: chuyển OhlcvCandleRaw (BE) → OhlcvCandle (FE chart)
export function normalizeCandle(raw: OhlcvCandleRaw): OhlcvCandle {
  return {
    time:        Math.floor(new Date(raw.bucket).getTime() / 1000),
    open:        raw.open,
    high:        raw.high,
    low:         raw.low,
    close:       raw.close,
    volume:      raw.volume,
    trade_count: raw.trade_count,
  }
}

export interface OhlcvResponse {
  artwork_id: string
  timeframe:  OhlcvTimeframe
  candles:    OhlcvCandle[]
}

export interface TradeRecord {
  id:              string
  tx_hash:         string
  user_id:         string
  wallet_address:  string
  artwork_id:      string
  tx_type:         TxType
  share_amount:    string
  eth_amount:      string
  price_per_share: string
  gas_fee:         string
  block_number:    number
  timestamp:       string
}

export interface TradeHistoryResponse {
  data:  TradeRecord[]
  total: number
}

export interface MyTradeRecord {
  id:              string
  tx_hash:         string
  tx_type:         TxType
  share_amount:    string
  eth_amount:      string
  price_per_share: string
  gas_fee:         string
  block_number:    number
  timestamp:       string
  created_at:      string
  artwork_id:      string
  artwork_title:   string
  artwork_ticker:  string | null
  artwork_image_uri: string | null
}

export interface MyTradeHistoryResponse {
  data:       MyTradeRecord[]
  total:      number
  page:       number
  totalPages: number
}

export interface LeaderboardEntry {
  artwork_id:    string
  artwork_title: string
  volume_eth:    string
  trade_count:   number
}

export interface RecentTrade {
  id:              string
  tx_type:         TxType
  share_amount:    string
  eth_amount:      string
  price_per_share: string
  timestamp:       string
  user: {
    wallet_address: string
    username:       string | null
    avatar_url:     string | null
  }
  artwork: {
    id:                string
    title:             string
    ticker:            string | null
    image_uri:         string | null
    ipfs_metadata_uri: string | null
  }
}

// ── Portfolio ─────────────────────────────────────────────────────
export interface PortfolioHolding {
  artwork_id:          string
  artwork_title:       string
  share_balance:       string
  avg_buy_price:       string
  current_price:       string
  current_value_eth:   string
  cost_basis_eth:      string
  unrealized_pnl_eth:  string
  unrealized_pnl_pct:  string
}

export interface PortfolioPnL {
  user_id:                    string
  total_current_value_eth:    string
  total_cost_basis_eth:       string
  total_unrealized_pnl_eth:   string
  total_unrealized_pnl_pct:   string
  holdings:                   PortfolioHolding[]
}

export interface TopHolder {
  rank:           number
  wallet_address: string
  username:       string | null
  share_balance:  string
  ownership_pct:  string
}

// ── IPFS Upload ───────────────────────────────────────────────────
export interface IpfsUploadResult {
  image_uri:         string   // ipfs://CID
  metadata_uri:      string   // ipfs://CID
  gateway_image_url: string   // https://gateway.pinata.cloud/ipfs/CID
}

// ── WebSocket events ──────────────────────────────────────────────
// Khớp với PriceUpdatedEvent trong BE redis.service.ts + price.gateway.ts
export interface PriceUpdateEvent {
  artwork_id:     string
  current_price:  string
  current_supply: string
  volume_24h:     string
  tx_hash:        string
  timestamp:      number   // unix ms
  // Optional trade metadata (từ events.gateway trade_updated)
  is_buy?:      boolean
  user_wallet?: string
  share_amount?: string
}

// ── Reviews / Comments ───────────────────────────────────────────
export interface ReviewUser {
  wallet_address: string
  username:       string | null
  avatar_url:     string | null
}

export interface Review {
  id:               string
  artwork_id:       string
  user_id:          string
  interaction_type: 'COMMENT'
  content:          string
  rating:           number | null  // 1-5
  created_at:       string
  user?:            ReviewUser
}

export interface CreateReviewDto {
  content: string
  rating?: number
}

// ── Generic API error ─────────────────────────────────────────────
export interface ApiErrorBody {
  statusCode: number
  message:    string | string[]
  error:      string
}
