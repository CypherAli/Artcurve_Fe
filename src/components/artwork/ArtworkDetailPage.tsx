'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence }           from 'framer-motion'
import Link                                  from 'next/link'
import { reviewService }                     from '@/services/review.service'
import { authStore }                         from '@/lib/auth-store'
import type { Review }                       from '@/types/api'

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
    content: 'The interplay of light and shadow is extraordinary. This piece commands a presence that photographs cannot fully capture — an essential hold for any serious collector.',
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
    content: 'Bought in accumulation phase. The visual language is unlike anything on-chain right now — completely sui generis. Patient money wins.',
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
            <p className="font-mono text-xs font-semibold leading-tight" style={{ color: '#FDFBF7' }}>
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

// ── Main Component ────────────────────────────────────────────────────

export function ArtworkDetailPage({ artworkId }: { artworkId: string }) {
  const [artwork,    setArtwork]    = useState<StoredArtwork | null>(null)
  const [reviews,    setReviews]    = useState<Review[]>(MOCK_REVIEWS)
  const [rating,     setRating]     = useState(0)
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState('')
  const [success,    setSuccess]    = useState(false)

  const currentUser = authStore.getUser()
  const isMock      = !artworkId || artworkId.startsWith('mock-')

  // Read artwork from sessionStorage (set by MarketplacePage on click)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('artcurve_detail')
      if (raw) setArtwork(JSON.parse(raw) as StoredArtwork)
    } catch { /* ignore */ }
  }, [])

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

  // ── Loading / not-found state ─────────────────────────────────────
  if (!artwork) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: '#0A0A0A' }}
      >
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Artwork data not found
        </p>
        <Link
          href="/marketplace"
          className="font-mono text-[9px] tracking-widest uppercase px-4 py-2 transition-colors duration-150"
          style={{ border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37' }}
        >
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const graduated = artwork.progress >= 100

  return (
    <div className="min-h-dvh" style={{ background: '#0A0A0A', color: '#FDFBF7' }}>

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
          Marketplace
        </Link>
      </div>

      {/* ── HERO — 2-column ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: '72vh' }}>

        {/* Left: artwork image */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="sticky top-0 w-full h-[72vh] overflow-hidden">
            {/* Phase left accent */}
            <span
              className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
              style={{ background: artwork.phaseColor }}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Phase badge */}
            <div
              className="absolute top-4 left-5 z-10 flex items-center gap-1.5 px-2.5 py-1
                         font-mono text-[9px] tracking-[0.24em] uppercase"
              style={{
                background: 'rgba(0,0,0,0.72)',
                border:     `1px solid ${artwork.phaseColor}45`,
                color:      artwork.phaseColor,
              }}
            >
              <span className="size-[5px] rounded-full" style={{ background: artwork.phaseColor }}/>
              {artwork.phase}
            </div>

            {/* 24h badge */}
            <div
              className="absolute top-4 right-4 z-10 px-2.5 py-1 font-mono text-[10px] font-semibold"
              style={{
                background: artwork.changePositive ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)',
                border:     `1px solid ${artwork.changePositive ? 'rgba(74,222,128,0.32)' : 'rgba(248,113,113,0.32)'}`,
                color:      artwork.changePositive ? '#4ade80' : '#f87171',
              }}
            >
              {artwork.change24h}
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
            {artwork.ticker} · {artwork.artist}
          </p>

          {/* Title */}
          <h1
            className="font-light leading-tight mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(2rem, 3.5vw, 3rem)',
              color:      '#FDFBF7',
            }}
          >
            {artwork.title}
          </h1>

          {/* Stats grid 3×2 */}
          <div
            className="grid grid-cols-3 gap-px mb-8"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {[
              { label: 'Market Cap',  value: artwork.marketCapLabel,             color: '' },
              { label: '24h Change',  value: artwork.change24h,                  color: artwork.changePositive ? '#4ade80' : '#f87171' },
              { label: 'Holders',     value: String(artwork.holders),            color: '' },
              { label: 'Volume 24h',  value: artwork.volume24h,                  color: '' },
              { label: 'Completion',  value: `${artwork.progress}%`,             color: graduated ? '#4ade80' : '#D4AF37' },
              { label: 'Phase',       value: artwork.phase,                      color: artwork.phaseColor },
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
                {graduated ? '✦ GRADUATED' : `${artwork.progress}% TO GRADUATION`}
              </span>
            </div>
            <div
              className="h-[5px] w-full rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(artwork.progress, 100)}%` }}
                transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
                style={{
                  background: graduated
                    ? '#4ade80'
                    : 'linear-gradient(90deg, #D4AF37, #F3E5AB)',
                }}
              />
            </div>
          </div>

          {/* BUY CTA */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01, filter: 'brightness(1.08)' }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-full py-4 mb-8 font-mono text-[10px] tracking-[0.32em] uppercase font-bold"
            style={{
              background: 'linear-gradient(90deg, #D4AF37 0%, #B8960C 100%)',
              color:      '#0A0A0A',
            }}
          >
            BUY {artwork.ticker}
          </motion.button>

          {/* Description */}
          <p
            style={{
              fontSize:   '1.05rem',
              lineHeight: 1.75,
              color:      'rgba(255,255,255,0.4)',
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            {artwork.description}
          </p>
        </motion.div>
      </div>

      {/* ── REVIEWS SECTION ──────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-8 py-20">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-14"
          >
            <p
              className="font-mono text-[8px] uppercase tracking-[0.32em] mb-3"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              Collector Reviews
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <h2
                className="font-light"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize:   'clamp(1.8rem, 3vw, 2.6rem)',
                  color:      '#FDFBF7',
                }}
              >
                What collectors say
              </h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <StarDisplay value={avgRating} size={15} />
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {avgRating.toFixed(1)} · {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* 2-column: distribution + write form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">

            {/* Rating distribution */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="p-7 rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border:     '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div className="flex items-start gap-8">
                {/* Big number */}
                <div className="text-center shrink-0">
                  <p
                    className="font-mono leading-none mb-1"
                    style={{ fontSize: '3.2rem', color: '#D4AF37' }}
                  >
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </p>
                  <StarDisplay value={avgRating} size={15} />
                  <p
                    className="font-mono text-[8.5px] mt-2"
                    style={{ color: 'rgba(255,255,255,0.28)' }}
                  >
                    {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Distribution bars */}
                <div className="flex-1 flex flex-col gap-2.5 pt-1">
                  {distribution.map(({ star, count }) => (
                    <RatingBar key={star} star={star} count={count} maxCount={maxCount} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Write review form */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.07 }}
              className="p-7 rounded-sm"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border:     '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-[0.22em] mb-5"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                Write a Review
              </p>

              {currentUser ? (
                <form onSubmit={handleSubmit}>
                  {/* Star selector */}
                  <div className="mb-4">
                    <StarSelector value={rating} onChange={setRating} />
                    {rating > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono text-[8.5px] mt-1.5"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional'][rating]}
                      </motion.p>
                    )}
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Your thoughts on this artwork…"
                    maxLength={1000}
                    rows={4}
                    className="w-full bg-transparent resize-none outline-none p-3 rounded-sm"
                    style={{
                      border:     '1px solid rgba(255,255,255,0.09)',
                      color:      'rgba(255,255,255,0.65)',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize:   '1.05rem',
                      lineHeight: 1.65,
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={e  => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.38)')}
                    onBlur={e   => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                  />

                  {/* Char count */}
                  <p className="font-mono text-[8px] text-right mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {comment.length} / 1000
                  </p>

                  {/* Error / success */}
                  {submitErr && (
                    <p className="font-mono text-[9px] mt-2" style={{ color: '#f87171' }}>{submitErr}</p>
                  )}
                  <AnimatePresence>
                    {success && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-mono text-[9px] mt-2"
                        style={{ color: '#4ade80' }}
                      >
                        ✦ Review submitted. Thank you.
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    whileHover={rating && comment.trim() ? { scale: 1.01 } : {}}
                    whileTap={rating && comment.trim()  ? { scale: 0.98 } : {}}
                    disabled={!rating || !comment.trim() || submitting}
                    className="w-full mt-4 py-3 font-mono text-[9px] tracking-[0.28em] uppercase transition-all duration-150"
                    style={{
                      background: (rating && comment.trim())
                        ? 'rgba(212,175,55,0.1)'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${(rating && comment.trim())
                        ? 'rgba(212,175,55,0.38)'
                        : 'rgba(255,255,255,0.07)'}`,
                      color: (rating && comment.trim())
                        ? '#D4AF37'
                        : 'rgba(255,255,255,0.2)',
                      cursor: (rating && comment.trim()) ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </motion.button>
                </form>
              ) : (
                /* Not logged in */
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <p
                    style={{
                      fontSize:   '1rem',
                      color:      'rgba(255,255,255,0.32)',
                      fontFamily: "'Cormorant Garamond', serif",
                      textAlign:  'center',
                    }}
                  >
                    Connect your wallet to leave a review
                  </p>
                  <Link
                    href="/"
                    className="font-mono text-[9px] tracking-widest uppercase px-5 py-2.5 transition-colors duration-150"
                    style={{ border: '1px solid rgba(212,175,55,0.38)', color: '#D4AF37' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    Connect Wallet
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Reviews list ─────────────────────────────────────── */}
          {reviews.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-center py-12"
              style={{ color: 'rgba(255,255,255,0.18)' }}
            >
              No reviews yet — be the first collector to share your thoughts.
            </motion.p>
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {reviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.38, delay: i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <ReviewCard
                      review={review}
                      isOwn={currentUser?.id === review.user_id}
                      onDelete={currentUser?.id === review.user_id
                        ? () => handleDelete(review.id)
                        : undefined}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
