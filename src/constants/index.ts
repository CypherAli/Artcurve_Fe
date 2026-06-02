// ─────────────────────────────────────────────────────────────────
//  constants/index.ts  —  App-wide constants
// ─────────────────────────────────────────────────────────────────

// ── Artwork ───────────────────────────────────────────────────────

export const ARTWORK_CATEGORIES = [
  'Painting',
  'Drawing',
  'Digital',
  'Photography',
  'Sculpture',
  'Mixed Media',
  'Generative',
] as const

export type ArtworkCategory = typeof ARTWORK_CATEGORIES[number]

export const CURVE_TYPES = ['linear', 'quadratic', 'exponential'] as const
export type CurveType = typeof CURVE_TYPES[number]

// ── Bonding Curve Defaults ────────────────────────────────────────

export const DEFAULT_INIT_PRICE  = '0.00100000'   // 0.001 ETH
export const DEFAULT_ROYALTY_PCT = '5.00'          // 5%
export const DEFAULT_CURVE_TYPE: CurveType = 'quadratic'
export const MAX_ROYALTY_PCT     = 10

// ── Trading ───────────────────────────────────────────────────────

export const MARKETPLACE_DEFAULT_PAGE_SIZE = 20
export const MARKETPLACE_MAX_PAGE_SIZE     = 100

export const OHLCV_INTERVALS = ['1m', '5m', '1h'] as const
export type OhlcvInterval = typeof OHLCV_INTERVALS[number]

// ── Network / Blockchain ──────────────────────────────────────────

/** Base mainnet chain ID */
export const BASE_CHAIN_ID = 8453

/** Base Sepolia (testnet) chain ID */
export const BASE_SEPOLIA_CHAIN_ID = 84532

/** Estimated gas cost range for artwork deployment */
export const GAS_ESTIMATE_ETH = {
  min: 0.0010,   // simple linear curve, small supply
  max: 0.0030,   // exponential curve, large supply
  base: 0.0018,  // typical quadratic
}

// ── UI ────────────────────────────────────────────────────────────

export const TOAST_DURATION_MS     = 4_000
export const ANIMATION_DURATION_MS = 300

export const ROUTES = {
  home:        '/',
  marketplace: '/marketplace',
  trade:       '/trade',
  studio:      '/studio',
  vault:       '/vault',
  live:        '/live',
  guild:       '/guild',
} as const
