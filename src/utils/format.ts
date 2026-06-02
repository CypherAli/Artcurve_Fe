// ─────────────────────────────────────────────────────────────────
//  utils/format.ts  —  Formatting helpers
//  All functions are pure (no side effects, no imports from state).
// ─────────────────────────────────────────────────────────────────

// ── ETH / Numbers ─────────────────────────────────────────────────

/**
 * Formats an ETH amount string with up to `decimals` significant digits.
 * "0.00100000" → "0.001 ETH"
 */
export function formatEth(value: string | number, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '— ETH'
  return `${num.toFixed(decimals).replace(/\.?0+$/, '')} ETH`
}

/**
 * Formats a price per token in a compact way.
 * "0.00100000" → "0.001"   "12345.678" → "12.3K"
 */
export function formatPrice(value: string | number, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(decimals).replace(/\.?0+$/, '')
}

/**
 * Formats a supply amount.
 * "100000.00000000" → "100K"
 */
export function formatSupply(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`
  return num.toFixed(0)
}

/**
 * Formats a P&L percentage with + / − sign and color class.
 * Returns { text: "+12.34%", isPositive: true }
 */
export function formatPnl(value: string | number): { text: string; isPositive: boolean } {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return { text: '—', isPositive: false }
  const isPositive = num >= 0
  return {
    text: `${isPositive ? '+' : ''}${num.toFixed(2)}%`,
    isPositive,
  }
}

// ── Addresses ─────────────────────────────────────────────────────

/**
 * Truncates an Ethereum address for display.
 * "0xAbCd...1234" (first 6 + last 4 chars)
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

// ── Dates ─────────────────────────────────────────────────────────

/**
 * Formats a date relative to now (e.g., "3 min ago", "2 days ago").
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs  = Math.floor(diff / 1_000)
  const mins  = Math.floor(secs  / 60)
  const hours = Math.floor(mins  / 60)
  const days  = Math.floor(hours / 24)

  if (days  > 0)  return `${days}d ago`
  if (hours > 0)  return `${hours}h ago`
  if (mins  > 0)  return `${mins}m ago`
  return 'just now'
}

/**
 * Formats a date as "Jan 12, 2025".
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Progress ──────────────────────────────────────────────────────

/**
 * Calculates bonding curve fill percentage.
 * supply / target_cap × 100, capped at 100.
 */
export function bondingCurveFill(supply: string, targetCap: string): number {
  const s = parseFloat(supply)
  const t = parseFloat(targetCap)
  if (!t || isNaN(s) || isNaN(t)) return 0
  return Math.min((s / t) * 100, 100)
}
