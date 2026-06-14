'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import { motion, AnimatePresence }           from 'framer-motion'
import Link                                  from 'next/link'
import { reviewService }                     from '@/services/review.service'
import { artworkService }                    from '@/services/artwork.service'
import { portfolioService }                  from '@/services/portfolio.service'
import { authStore }                         from '@/lib/auth-store'
import { useLanguage }                       from '@/context/LanguageContext'
import type { Review, Artwork, TopHolder }   from '@/types/api'

// ── Stored artwork shape (set in sessionStorage by MarketplacePage) ──
export interface StoredArtwork {
  id:             number
  artworkId:      string
  title:          string
  ticker:         string
  artist:         string
  phase:          string
  phaseColor:     string
  marketCap:      number
  marketCapLabel: string
  change24h:      string
  changePositive: boolean
  progress:       number
  image:          string
  description:    string
  volume24h:      string
  holders:        number
}

// ── Mock reviews (shown when API unavailable or artworkId = mock) ──
const MOCK_REVIEWS: Review[] = [
  {
    id: 'mock-1', artwork_id: 'mock', user_id: 'u1',
    interaction_type: 'COMMENT', rating: 5,
    content: 'The interplay of light and shadow is extraordinary. This piece commands a presence that photographs cannot fully capture. An essential hold for any serious collector.',
    created_at: new Date(Date.now() - 2 * 864e5).toISOString(),
    user: { wallet_address: '0x4f2a91b3c7d8e9f0', username: 'Elena V.', avatar_url: null },
  },
  {
    id: 'mock-2', artwork_id: 'mock', user_id: 'u2',
    interaction_type: 'COMMENT', rating: 4,
    content: "Strong fundamentals. The bonding curve trajectory suggests this is still in early price discovery. I've added significantly to my position.",
    created_at: new Date(Date.now() - 5 * 864e5).toISOString(),
    user: { wallet_address: '0x8d3f44a1b2c3d4e5', username: null, avatar_url: null },
  },
  {
    id: 'mock-3', artwork_id: 'mock', user_id: 'u3',
    interaction_type: 'COMMENT', rating: 3,
    content: 'Technically accomplished but I question the long-term narrative. This particular work feels rushed compared to earlier pieces in the series.',
    created_at: new Date(Date.now() - 8 * 864e5).toISOString(),
    user: { wallet_address: '0x1a9c33d7e8f90a1b', username: 'Marcus C.', avatar_url: null },
  },
  {
    id: 'mock-4', artwork_id: 'mock', user_id: 'u4',
    interaction_type: 'COMMENT', rating: 5,
    content: 'Bought in accumulation phase. The visual language is unlike anything on-chain right now, completely sui generis. Patient money wins.',
    created_at: new Date(Date.now() - 12 * 864e5).toISOString(),
    user: { wallet_address: '0x7e1b22c3d4e5f6a7', username: 'Aiko T.', avatar_url: null },
  },
  {
    id: 'mock-5', artwork_id: 'mock', user_id: 'u5',
    interaction_type: 'COMMENT', rating: 4,
    content: 'Solid piece. The composition holds at any scale. Four stars rather than five because IPFS load time is inconsistent, which affects presentation.',
    created_at: new Date(Date.now() - 18 * 864e5).toISOString(),
    user: { wallet_address: '0x2b5d81f0a1b2c3d4', username: null, avatar_url: null },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 864e5)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 30)  return `${diff}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function shortAddr(wallet: string) {
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`
}

// ── Sub-components ────────────────────────────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(i => (
        <motion.button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          whileHover={{ scale: 1.28 }}
          whileTap={{ scale: 0.82 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="leading-none select-none"
          style={{
            fontSize:   32,
            color:      i <= (hovered || value) ? '#D4AF37' : 'rgba(255,255,255,0.14)',
            filter:     i <= (hovered || value) ? 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' : 'none',
            transition: 'color 0.12s ease, filter 0.12s ease',
          }}
        >
          ★
        </motion.button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value)
  return (
    <span aria-label={`${value.toFixed(1)} stars`} style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= filled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}>★</span>
      ))}
    </span>
  )
}

function RatingBar({ star, count, maxCount }: { star: number; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] shrink-0 w-5 text-right" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {star}★
      </span>
      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: (5 - star) * 0.06 }}
          style={{ background: pct > 0 ? 'linear-gradient(90deg, #B8960C, #D4AF37)' : 'transparent' }}
        />
      </div>
      <span className="font-mono text-[10px] shrink-0 w-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {count}
      </span>
    </div>
  )
}

function ReviewCard({
  review,
  isOwn,
  onDelete,
}: {
  review:    Review
  isOwn:     boolean
  onDelete?: () => void
}) {
  const name = review.user?.username ?? shortAddr(review.user?.wallet_address ?? review.user_id)

  return (
    <motion.div
      layout
      className="relative overflow-hidden"
      style={{
        background:   '#141414',
        border:       '1px solid rgba(255,255,255,0.15)',
        borderLeft:   '3px solid rgba(212,175,55,0.6)',
        borderRadius: 2,
        padding:      '20px 24px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar initials */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold"
            style={{
              background: 'rgba(212,175,55,0.18)',
              border:     '1.5px solid rgba(212,175,55,0.55)',
              color:      '#D4AF37',
            }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-mono text-xs font-semibold leading-tight" style={{ color: 'var(--ac-paper)' }}>
              {name}
            </p>
            <div className="mt-1">
              <StarDisplay value={review.rating ?? 0} size={14} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {fmtDate(review.created_at)}
          </span>
          {isOwn && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="font-mono text-[9px] px-2 py-0.5 transition-colors duration-150"
              style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              delete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p
        className="leading-relaxed"
        style={{
          fontSize:   '1.05rem',
          color:      'rgba(255,255,255,0.88)',
          fontFamily: "'Cormorant Garamond', serif",
          lineHeight: 1.8,
        }}
      >
        "{review.content}"
      </p>
    </motion.div>
  )
}

// ── Bonding Curve SVG ────────────────────────────────────────────────
function BondingCurveViz({ initPrice, currentPrice, currentSupply }: {
  initPrice:     number
  currentPrice:  number
  currentSupply: number
}) {
  const { t } = useLanguage()
  const W = 400, H = 120, PAD = { t: 12, r: 16, b: 28, l: 36 }
  const pw = W - PAD.l - PAD.r
  const ph = H - PAD.t - PAD.b

  const totalSupply = Math.max(currentSupply * 1.2, 1)
  const k = currentSupply > 0
    ? (currentPrice - initPrice) / (currentSupply * currentSupply)
    : 0

  const pts = Array.from({ length: 60 }, (_, i) => {
    const x = (i / 59) * totalSupply
    const p = initPrice + k * x * x
    return { x, p }
  })
  const maxP = Math.max(...pts.map(pt => pt.p), currentPrice)
  const minP = initPrice * 0.9

  const toSvg = (x: number, p: number) => ({
    svgX: PAD.l + (x / totalSupply) * pw,
    svgY: PAD.t + ph - ((p - minP) / (maxP - minP || 1)) * ph,
  })

  const pathD = pts.map((pt, i) => {
    const { svgX, svgY } = toSvg(pt.x, pt.p)
    return `${i === 0 ? 'M' : 'L'}${svgX.toFixed(1)},${svgY.toFixed(1)}`
  }).join(' ')

  const { svgX: dotX, svgY: dotY } = toSvg(currentSupply, currentPrice)

  return (
    <div className="mb-8">
      <p className="font-mono text-[8px] uppercase tracking-[0.22em] mb-2"
        style={{ color: 'rgba(255,255,255,0.22)' }}>
        {t.artwork.bondingCurve}
      </p>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} aria-hidden>
          <defs>
            <linearGradient id="bcg-detail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {pathD && (
            <path
              d={`${pathD} L${(PAD.l + (currentSupply / totalSupply) * pw).toFixed(1)},${(PAD.t + ph).toFixed(1)} L${PAD.l},${(PAD.t + ph).toFixed(1)} Z`}
              fill="url(#bcg-detail)"
            />
          )}
          <path d={pathD} fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
          <line
            x1={dotX.toFixed(1)} x2={dotX.toFixed(1)}
            y1={PAD.t} y2={PAD.t + ph}
            stroke="rgba(212,175,55,0.25)" strokeWidth="1" strokeDasharray="3 4"
          />
          <circle cx={dotX} cy={dotY} r="5" fill="#D4AF37" opacity="0.25"/>
          <circle cx={dotX} cy={dotY} r="3" fill="#D4AF37"/>
          <circle cx={dotX} cy={dotY} r="1.5" fill="white"/>
          <text x={PAD.l - 4} y={PAD.t + ph} fill="rgba(255,255,255,0.2)" fontSize="7" textAnchor="end" dominantBaseline="auto">0</text>
          <text x={PAD.l - 4} y={PAD.t + 4} fill="rgba(255,255,255,0.2)" fontSize="7" textAnchor="end">{maxP.toFixed(4)}</text>
          <text x={dotX} y={PAD.t + ph + 14} fill="#D4AF37" fontSize="7" textAnchor="middle">{t.artwork.now}</text>
        </svg>
      </div>
    </div>
  )
}

// ── Top Holders Table ────────────────────────────────────────────────
function TopHoldersSection({ artworkId }: { artworkId: string }) {
  const { t } = useLanguage()
  const [holders, setHolders] = useState<TopHolder[] | null>(null)

  useEffect(() => {
    if (!artworkId || artworkId.startsWith('mock-')) return
    portfolioService.topHolders(artworkId, 10)
      .then(data => setHolders(Array.isArray(data) ? data : []))
      .catch(() => setHolders([]))
  }, [artworkId])

  if (!holders || holders.length === 0) return null

  return (
    <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="font-mono text-[8px] uppercase tracking-[0.32em] mb-5"
        style={{ color: 'rgba(255,255,255,0.22)' }}>
        {t.artwork.topHolders}
      </p>
      <div className="flex flex-col gap-0">
        {holders.map((h, i) => {
          const wallet = h.username ?? `${h.wallet_address.slice(0, 6)}…${h.wallet_address.slice(-4)}`
          const pct    = parseFloat(h.ownership_pct || '0')
          return (
            <div key={h.wallet_address}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] w-5 text-right"
                  style={{ color: i < 3 ? '#D4AF37' : 'rgba(255,255,255,0.22)' }}>
                  #{h.rank}
                </span>
                <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {wallet}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-[3px] rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg,#B8960C,#D4AF37)' }}/>
                </div>
                <span className="font-mono text-[9px] w-10 text-right"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {pct.toFixed(1)}%
                </span>
                <span className="font-mono text-[9px] w-16 text-right"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {parseFloat(h.share_balance).toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────

export function ArtworkDetailPage({ artworkId }: { artworkId: string }) {
  const router = useRouter()
  const { t } = useLanguage()

  // FIX 1: sessionStorage as instant cache; always fetch live data
  const [artwork, setArtwork] = useState<StoredArtwork | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('artcurve_detail') || 'null')
    } catch { return null }
  })
  const [liveArtwork,  setLiveArtwork]  = useState<Artwork | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [fetchError,   setFetchError]   = useState(false)

  const [reviews,    setReviews]    = useState<Review[]>(MOCK_REVIEWS)
  const [rating,     setRating]     = useState(0)
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState('')
  const [success,    setSuccess]    = useState(false)

  // FIX 4: Like button state
  const [liked,   setLiked]   = useState(false)
  const [liking,  setLiking]  = useState(false)

  const currentUser = authStore.getUser()
  const isMock      = !artworkId || artworkId.startsWith('mock-')

  // FIX 1: Always fetch live data from API
  useEffect(() => {
    if (isMock) return
    if (!artwork) setLoading(true)
    artworkService.getById(artworkId)
      .then(data => {
        setLiveArtwork(data)
        setLoading(false)
        setFetchError(false)
      })
      .catch(() => {
        setLoading(false)
        if (!artwork) setFetchError(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId, isMock])

  // Load live reviews from API
  const loadReviews = useCallback(async () => {
    if (isMock) return
    try {
      const data = await reviewService.getComments(artworkId)
      if (Array.isArray(data) && data.length > 0) setReviews(data)
    } catch { /* keep mock */ }
  }, [artworkId, isMock])

  useEffect(() => { loadReviews() }, [loadReviews])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating || !comment.trim()) return
    if (!currentUser) { setSubmitErr('Connect your wallet to leave a review.'); return }
    if (isMock) {
      // Local-only preview for mock artworks
      const fake: Review = {
        id:               `local-${Date.now()}`,
        artwork_id:       artworkId,
        user_id:          currentUser.id,
        interaction_type: 'COMMENT',
        content:          comment.trim(),
        rating,
        created_at:       new Date().toISOString(),
        user: {
          wallet_address: currentUser.wallet_address,
          username:       currentUser.username,
          avatar_url:     currentUser.avatar_url,
        },
      }
      setReviews(prev => [fake, ...prev])
      setComment(''); setRating(0); setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      return
    }
    setSubmitting(true); setSubmitErr('')
    try {
      const r = await reviewService.createComment(artworkId, comment.trim(), rating)
      setReviews(prev => [r, ...prev])
      setComment(''); setRating(0); setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setSubmitErr((err as Error).message ?? 'Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!isMock) {
      try { await reviewService.deleteComment(id) } catch { return }
    }
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  // ── Derived stats ─────────────────────────────────────────────────
  const totalReviews = reviews.length
  const avgRating    = totalReviews > 0
    ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / totalReviews
    : 0
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))
  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  // FIX 4: Like handler
  const handleLike = useCallback(async () => {
    if (!currentUser || isMock || liking) return
    setLiking(true)
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '')
      const jwt = authStore.getJwt()
      if (liked) {
        await fetch(`${API_URL}/social/like/${artworkId}`, {
          method: 'DELETE',
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        })
        setLiked(false)
      } else {
        await fetch(`${API_URL}/social/like/${artworkId}`, {
          method: 'POST',
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        })
        setLiked(true)
      }
    } catch { /* ignore */ } finally {
      setLiking(false)
    }
  }, [currentUser, isMock, liking, liked, artworkId])

  // ── Loading skeleton ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh" style={{ background: '#0A0A0A' }}>
        <div className="px-8 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }}/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="animate-pulse" style={{ height: '100dvh', background: 'rgba(255,255,255,0.04)' }}/>
          <div className="px-10 pt-12 flex flex-col gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: `${90 - i * 8}%` }}/>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error / not-found state ────────────────────────────────────────
  if (fetchError && !artwork) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4" style={{ background: '#0A0A0A' }}>
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {t.artwork.artworkNotFound}
        </p>
        <Link
          href="/marketplace"
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2 transition-colors duration-150"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
        >
          {t.artwork.backToMarketplace}
        </Link>
      </div>
    )
  }

  if (!artwork) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: '#0A0A0A' }}
      >
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {t.artwork.artworkNotFound}
        </p>
        <Link
          href="/marketplace"
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2 transition-colors duration-150"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
        >
          {t.artwork.backToMarketplace}
        </Link>
      </div>
    )
  }

  // Merge live API data over cached sessionStorage data where available
  const initPrice     = liveArtwork ? parseFloat(liveArtwork.init_price) || 0 : 0
  const currentPrice  = liveArtwork ? parseFloat(liveArtwork.current_price) || 0 : 0
  const currentSupply = liveArtwork ? parseFloat(liveArtwork.current_supply) || 0 : 0
  // Use live data for display fields when available
  const displayArtwork = liveArtwork ? {
    ...artwork,
    description: liveArtwork.description ?? artwork.description,
  } : artwork

  const graduated = displayArtwork.progress >= 100

  return (
    <div className="min-h-dvh" style={{ background: '#0A0A0A', color: 'var(--ac-paper)' }}>

      {/* ── Back nav ─────────────────────────────────────────────── */}
      <div
        className="px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}
      >
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] uppercase transition-colors duration-150"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#D4AF37')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t.artwork.backToMarketplace}
        </Link>
      </div>

      {/* ── HERO — 2-column ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left: artwork image — sticky, fills full viewport */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="sticky top-0 w-full overflow-hidden" style={{ height: '100dvh' }}>
            {/* Phase left accent */}
            <span
              className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
              style={{ background: displayArtwork.phaseColor }}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayArtwork.image}
              alt={displayArtwork.title}
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Phase badge */}
            <div
              className="absolute top-4 left-5 z-10 flex items-center gap-1.5 px-2.5 py-1
                         font-mono text-[9px] tracking-[0.24em] uppercase"
              style={{
                background: 'rgba(0,0,0,0.72)',
                border:     `1px solid ${displayArtwork.phaseColor}45`,
                color:      displayArtwork.phaseColor,
              }}
            >
              <span className="size-[5px] rounded-full" style={{ background: displayArtwork.phaseColor }}/>
              {displayArtwork.phase}
            </div>

            {/* 24h badge */}
            <div
              className="absolute top-4 right-4 z-10 px-2.5 py-1 font-mono text-[10px] font-semibold"
              style={{
                background: displayArtwork.changePositive ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)',
                border:     `1px solid ${displayArtwork.changePositive ? 'rgba(74,222,128,0.32)' : 'rgba(248,113,113,0.32)'}`,
                color:      displayArtwork.changePositive ? '#4ade80' : '#f87171',
              }}
            >
              {displayArtwork.change24h}
            </div>
          </div>
        </motion.div>

        {/* Right: info panel */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.07 }}
          className="flex flex-col px-10 pt-12 pb-10"
        >
          {/* Ticker + artist */}
          <p
            className="font-mono text-[9px] tracking-[0.28em] uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            {displayArtwork.ticker} · {displayArtwork.artist}
          </p>

          {/* Title */}
          <h1
            className="font-light leading-tight mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(2rem, 3.5vw, 3rem)',
              color:      'var(--ac-paper)',
            }}
          >
            {displayArtwork.title}
          </h1>

          {/* Stats grid 3×2 */}
          <div
            className="grid grid-cols-3 gap-px mb-8"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {[
              { label: t.artwork.marketCap,  value: displayArtwork.marketCapLabel,             color: '' },
              { label: t.artwork.change24h,  value: displayArtwork.change24h,                  color: displayArtwork.changePositive ? '#4ade80' : '#f87171' },
              { label: t.artwork.holders,    value: String(displayArtwork.holders),            color: '' },
              { label: t.artwork.volume24h,  value: displayArtwork.volume24h,                  color: '' },
              { label: t.artwork.completion, value: `${displayArtwork.progress}%`,             color: graduated ? '#4ade80' : '#D4AF37' },
              { label: t.artwork.phase,      value: displayArtwork.phase,                      color: displayArtwork.phaseColor },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col gap-1.5 px-4 py-4"
                style={{ background: '#0A0A0A' }}
              >
                <p
                  className="font-mono text-[8px] uppercase tracking-[0.22em]"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {stat.label}
                </p>
                <p
                  className="font-mono leading-none"
                  style={{ fontSize: '0.95rem', color: stat.color || 'rgba(255,255,255,0.82)' }}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bonding curve progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.18em]"
                style={{ color: graduated ? '#4ade80' : '#D4AF37' }}
              >
                {graduated ? t.artwork.graduated : `${displayArtwork.progress}% TO GRADUATION`}
              </span>
            </div>
            <div
              className="h-[5px] w-full rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(displayArtwork.progress, 100)}%` }}
                transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
                style={{
                  background: graduated
                    ? '#4ade80'
                    : 'linear-gradient(90deg, #D4AF37, #F3E5AB)',
                }}
              />
            </div>
          </div>

          {/* FIX 3: Bonding Curve visualization */}
          {liveArtwork && currentSupply > 0 && (
            <BondingCurveViz
              initPrice={initPrice}
              currentPrice={currentPrice}
              currentSupply={currentSupply}
            />
          )}

          {/* BUY CTA + Like button */}
          <div className="flex gap-3 mb-8">
            <motion.button
              type="button"
              onClick={() => router.push('/trade')}
              whileHover={{ scale: 1.01, filter: 'brightness(1.08)' }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex-1 py-4 font-mono text-[10px] tracking-[0.32em] uppercase font-bold"
              style={{
                background: 'linear-gradient(90deg, #D4AF37 0%, #B8960C 100%)',
                color:      '#0A0A0A',
              }}
            >
              {t.artwork.buy.replace('{ticker}', displayArtwork.ticker)}
            </motion.button>

            {/* FIX 4: Like button */}
            {currentUser && !isMock && (
              <motion.button
                type="button"
                onClick={handleLike}
                disabled={liking}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-14 py-4 flex items-center justify-center font-mono text-[14px]"
                style={{
                  background: liked ? 'rgba(248,113,113,0.14)' : 'rgba(255,255,255,0.04)',
                  border:     `1px solid ${liked ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.12)'}`,
                  color:      liked ? '#f87171' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.2s ease',
                }}
                title={liked ? 'Unlike' : 'Like'}
              >
                {liked ? '♥' : '♡'}
              </motion.button>
            )}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize:   '1.05rem',
              lineHeight: 1.75,
              color:      'rgba(255,255,255,0.4)',
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            {displayArtwork.description}
          </p>

          {/* ── COLLECTOR VOICES ───────────────────────────────────── */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-mono text-[8px] uppercase tracking-[0.32em]"
                style={{ color: 'rgba(255,255,255,0.22)' }}>
                {t.artwork.collectorVoices}
              </p>
              {totalReviews > 0 && (
                <span className="font-mono text-[10px] flex items-center gap-2"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <StarDisplay value={avgRating} size={11} />
                  {avgRating.toFixed(1)} · {totalReviews}
                </span>
              )}
            </div>

            {/* Write form */}
            {currentUser ? (
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <StarSelector value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: '#D4AF37' }}>
                      {['', t.artwork.poor, t.artwork.fair, t.artwork.good, t.artwork.great, t.artwork.exceptional][rating]}
                    </span>
                  )}
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={t.artwork.sharePerspective}
                  maxLength={1000}
                  rows={3}
                  className="w-full bg-transparent resize-none outline-none pb-3"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    color:        'rgba(255,255,255,0.75)',
                    fontFamily:   "'Cormorant Garamond', serif",
                    fontSize:     '1.05rem',
                    lineHeight:   1.65,
                    transition:   'border-color 0.15s ease',
                  }}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = 'rgba(212,175,55,0.5)')}
                  onBlur={e  => (e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.12)')}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                    {comment.length} / 1000
                  </span>
                  <div className="flex items-center gap-3">
                    {submitErr && <span className="font-mono text-[9px]" style={{ color: '#f87171' }}>{submitErr}</span>}
                    <AnimatePresence>
                      {success && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="font-mono text-[9px]" style={{ color: '#4ade80' }}>
                          ✦ Submitted
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <button
                      type="submit"
                      disabled={!rating || !comment.trim() || submitting}
                      className="font-mono text-[9px] tracking-[0.28em] uppercase px-4 py-1.5 transition-all duration-150"
                      style={{
                        background: (rating && comment.trim()) ? 'rgba(212,175,55,0.1)' : 'transparent',
                        border:     `1px solid ${(rating && comment.trim()) ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.1)'}`,
                        color:      (rating && comment.trim()) ? '#D4AF37' : 'rgba(255,255,255,0.2)',
                        cursor:     (rating && comment.trim()) ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {submitting ? t.artwork.posting : t.artwork.post}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-4 mb-8 pb-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', color: 'rgba(255,255,255,0.3)' }}>
                  {t.artwork.connectToShare}
                </p>
                <Link href="/"
                  className="shrink-0 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 transition-colors"
                  style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                  {t.artwork.connect}
                </Link>
              </div>
            )}

            {/* Reviews */}
            {reviews.length === 0 ? (
              <p className="font-mono text-[9px] tracking-widest uppercase py-4"
                style={{ color: 'rgba(255,255,255,0.15)' }}>
                {t.artwork.noPerspectives}
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {reviews.map((review, i) => {
                  const name = review.user?.username ?? shortAddr(review.user?.wallet_address ?? review.user_id)
                  const isOwn = currentUser?.id === review.user_id
                  return (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                      className="py-6"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p style={{
                        fontFamily:   "'Cormorant Garamond', serif",
                        fontSize:     '1.05rem',
                        lineHeight:   1.75,
                        color:        'rgba(255,255,255,0.78)',
                        fontStyle:    'italic',
                        marginBottom: '0.75rem',
                      }}>
                        "{review.content}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StarDisplay value={review.rating ?? 0} size={11} />
                          <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            {name}
                          </span>
                          <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                            {fmtDate(review.created_at)}
                          </span>
                        </div>
                        {isOwn && (
                          <button type="button" onClick={() => handleDelete(review.id)}
                            className="font-mono text-[8px] px-1.5 py-0.5 transition-colors"
                            style={{ color: 'rgba(248,113,113,0.45)', border: '1px solid rgba(248,113,113,0.15)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.45)')}>
                            delete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* FIX 2: Top Holders */}
          <TopHoldersSection artworkId={artworkId} />

        </motion.div>
      </div>
    </div>
  )
}
