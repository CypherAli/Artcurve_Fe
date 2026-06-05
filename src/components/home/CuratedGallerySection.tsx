'use client'

// ─────────────────────────────────────────────────────────────────
//  CuratedGallerySection.tsx  —  Hot Artworks Gallery
//
//  Skill patterns (cinematic-gsap-lenis):
//    • Eyebrow + heading: masked word reveal
//    • Cards: stagger fade-up on scroll
//    • Horizontal scroll carousel with drag
//    • Each card: sparkline SVG + price + artist info
//    • Hover: image scale + gold border reveal
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { useRouter }                    from 'next/navigation'
import { gsap }                         from '@/lib/gsap'
import { artworkService }               from '@/services/artwork.service'
import type { Artwork }                 from '@/types/api'

// Phase badge mapping dựa trên % target_cap đã đạt
function getPhase(art: Artwork): { label: string; color: string } {
  const supply = parseFloat(art.current_supply)
  const cap    = parseFloat(art.target_cap)
  const pct    = cap > 0 ? supply / cap : 0
  if (pct >= 0.9) return { label: 'Migration', color: '#f87171' }
  if (pct >= 0.6) return { label: 'FOMO',      color: '#C9A96E' }
  if (pct >= 0.3) return { label: 'Growth',    color: '#60a5fa' }
  return { label: 'Accumulation', color: '#4ade80' }
}

// Placeholder sparkline (5 points) khi chưa có OHLCV
const PLACEHOLDER_SPARK = [5, 6, 5.5, 7, 8]

// ── Sparkline helpers ──────────────────────────────────────────────
function buildSparkPath(data: number[], w: number, h: number, pad: number) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const d     = `M${pts.join(' L')}`
  const areaD = `${d} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`
  return { d, areaD, lastPt: pts[pts.length - 1] }
}

// Mini: shown in card info area by default, hides on hover
function SparklineMini({ data, color, id }: { data: number[]; color: string; id: number }) {
  const w = 80, h = 32, pad = 2
  const { d, areaD } = buildSparkPath(data, w, h, pad)
  const gid = `sgmini-${id}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Large: overlays on artwork image on hover — trading-chart style
function SparklineLarge({ data, color, id, price, change }: {
  data: number[]; color: string; id: number; price: string; change: string
}) {
  const w = 240, h = 90, pad = { t: 10, r: 8, b: 20, l: 8 }
  const pw = w - pad.l - pad.r
  const ph = h - pad.t - pad.b
  const { d, areaD, lastPt } = buildSparkPath(data, pw, ph, 0)
  // offset path into padded space
  const offsetD     = d.replace(/(M|L)([\d.]+),([\d.]+)/g,
    (_m, cmd, x, y) => `${cmd}${(+x + pad.l).toFixed(1)},${(+y + pad.t).toFixed(1)}`)
  const offsetAreaD = areaD.replace(/(M|L)([\d.]+),([\d.]+)/g,
    (_m, cmd, x, y) => `${cmd}${(+x + pad.l).toFixed(1)},${(+y + pad.t).toFixed(1)}`)
  const [lx, ly]    = lastPt.split(',').map(Number)
  const dotX = lx + pad.l, dotY = ly + pad.t
  const gid  = `sglarge-${id}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
        <filter id={`glowlg-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t}
          x1={pad.l} x2={w - pad.r}
          y1={pad.t + ph * t} y2={pad.t + ph * t}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={offsetAreaD} fill={`url(#${gid})`} />

      {/* Main line */}
      <path d={offsetD} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" filter={`url(#glowlg-${id})`} />

      {/* Last point dot */}
      <circle cx={dotX} cy={dotY} r="3.5" fill={color} filter={`url(#glowlg-${id})`} />
      <circle cx={dotX} cy={dotY} r="2"   fill="white" />

      {/* Price label */}
      <text x={dotX + 5} y={dotY + 4}
        fill="white" fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="600">
        {price} ETH
      </text>
      <text x={dotX + 5} y={dotY + 14}
        fill={color} fontSize="8" fontFamily="system-ui,sans-serif">
        {change}
      </text>
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────
export function CuratedGallerySection() {
  const router      = useRouter()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const sectionRef  = useRef<HTMLElement>(null)
  const labelRef    = useRef<HTMLParagraphElement>(null)
  const titleRef    = useRef<HTMLHeadingElement>(null)
  const lineRef     = useRef<HTMLDivElement>(null)
  const viewAllRef  = useRef<HTMLAnchorElement>(null)
  const cardsRef    = useRef<(HTMLDivElement | null)[]>([])
  const trackRef    = useRef<HTMLDivElement>(null)

  // ── Fetch artworks from API ────────────────────────────────────
  useEffect(() => {
    artworkService.list({ sortBy: 'view_count', limit: 8 })
      .then(res => { if (res.data?.length) setArtworks(res.data) })
      .catch(() => { /* keep empty, section hides gracefully */ })
  }, [])

  // ── Drag-to-scroll on carousel ─────────────────────────────────
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let isDown = false, startX = 0, scrollLeft = 0

    const onDown  = (e: MouseEvent) => { isDown = true; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; track.style.cursor = 'grabbing' }
    const onLeave = () => { isDown = false; track.style.cursor = 'grab' }
    const onUp    = () => { isDown = false; track.style.cursor = 'grab' }
    const onMove  = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const x    = e.pageX - track.offsetLeft
      const walk = (x - startX) * 1.4
      track.scrollLeft = scrollLeft - walk
    }

    track.addEventListener('mousedown',  onDown)
    track.addEventListener('mouseleave', onLeave)
    track.addEventListener('mouseup',    onUp)
    track.addEventListener('mousemove',  onMove)
    return () => {
      track.removeEventListener('mousedown',  onDown)
      track.removeEventListener('mouseleave', onLeave)
      track.removeEventListener('mouseup',    onUp)
      track.removeEventListener('mousemove',  onMove)
    }
  }, [])

  // ── GSAP scroll animations ─────────────────────────────────────
  useEffect(() => {
    const titleWords = Array.from(
      titleRef.current?.querySelectorAll<HTMLElement>('.cg-word') ?? []
    )

    // ── Initial states ────────────────────────────────────────────
    gsap.set(labelRef.current,  { autoAlpha: 0, x: -20 })
    gsap.set(titleWords,        { yPercent: 115, opacity: 0, scale: 1.04 })
    gsap.set(lineRef.current,   { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(viewAllRef.current,{ autoAlpha: 0, x: 16 })
    gsap.set(cardsRef.current.filter(Boolean), {
      y: 28, autoAlpha: 0,
    })

    const ctx = gsap.context(() => {

      // ── Header: cinematic multi-layer reveal ──────────────────
      gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true, invalidateOnRefresh: true },
      })
      // 1. Label slides in from left
      .to(labelRef.current,
        { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' }, 0)
      // 2. Words: scale + blur + rise — stagger 0.14s
      .to(titleWords,
        { yPercent: 0, opacity: 1, scale: 1,
          duration: 1.1, ease: 'expo.out', stagger: 0.14 }, 0.15)
      // 3. Gold divider draws left→right
      .to(lineRef.current,
        { scaleX: 1, duration: 0.8, ease: 'power3.inOut' }, 0.55)
      // 4. "View All" slides in from right
      .to(viewAllRef.current,
        { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0.7)

      // ── Cards: fast fade+rise, pure transform — no clip-path repaint
      gsap.to(cardsRef.current.filter(Boolean), {
        y: 0,
        autoAlpha: 1,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.055,
        scrollTrigger: {
          trigger: trackRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative bg-white pt-6 pb-16 overflow-hidden"
      aria-label="Curated Gallery"
    >
      {/* Grid overlay — consistent with other sections */}
      <div className="grid-overlay" aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 md:px-16 lg:px-24 mb-10">
        <p
          ref={labelRef}
          className="mb-4 text-[11px] tracking-[0.35em] uppercase text-[#C9A96E]"
        >
          Featured Works
        </p>

        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <h2
            ref={titleRef}
            className="font-light text-[#1A1A1A] flex flex-wrap gap-x-[0.22em]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            aria-label="Curated Gallery"
          >
            {['Curated', 'Gallery'].map(word => (
              <span key={word} className="overflow-hidden inline-block" aria-hidden="true">
                <span className="cg-word inline-block" style={{ willChange: 'transform, opacity' }}>
                  {word}
                </span>
              </span>
            ))}
          </h2>
          <a
            ref={viewAllRef}
            href="/marketplace"
            className="text-[11px] tracking-[0.2em] uppercase text-[#C9A96E] border-b border-[#C9A96E]/40 pb-0.5 hover:border-[#C9A96E] transition-colors duration-300 shrink-0"
          >
            View All →
          </a>
        </div>

        {/* Gold divider — draws in after heading */}
        <div
          ref={lineRef}
          className="h-px bg-gradient-to-r from-[#C9A96E] via-[#E8D5B0] to-transparent"
          style={{ transformOrigin: 'left center' }}
          aria-hidden="true"
        />
      </div>

      {/* ── Carousel ───────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto pb-4 select-none"
        style={{
          cursor: 'grab',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Left spacer — mirrors right spacer for equal padding */}
        <div className="shrink-0 w-0 md:w-0 lg:w-0" aria-hidden="true" />

        {artworks.map((art, i) => {
          const phase = getPhase(art)
          const artistName = art.creator?.username ?? art.creator?.wallet_address?.slice(0, 8) ?? 'Unknown'
          // Resolve image: try IPFS gateway, fallback to placeholder
          const imgSrc = art.ipfs_metadata_uri
            ? `https://ipfs.io/ipfs/${art.ipfs_metadata_uri.replace('ipfs://', '')}`
            : `/images/artworks/art${(i % 5) + 1}.jpg`

          return (
          <div
            key={art.id}
            ref={el => { cardsRef.current[i] = el }}
            className="group relative flex-none w-[260px] md:w-[280px] bg-white border border-[#E4DDD3] hover:border-[#C9A96E] transition-[border-color] duration-300 cursor-pointer"
            style={{ opacity: 0 }}
            onClick={() => router.push(`/trade?id=${art.id}`)}
          >
            {/* Artwork image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={art.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                draggable={false}
              />

              {/* Phase badge */}
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 text-[9px] tracking-[0.25em] uppercase font-medium text-white"
                style={{ background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <span
                  className="shrink-0 size-[5px] rounded-full"
                  style={{ background: phase.color }}
                />
                {phase.label}
              </div>

              {/* ── Mini sparkline ── */}
              <div className="absolute bottom-3 right-3 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                <SparklineMini data={PLACEHOLDER_SPARK} color="#4ade80" id={i} />
              </div>

              {/* ── Large chart overlay on hover ── */}
              <div
                className="absolute inset-x-0 bottom-0 h-[46%] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none"
                style={{ background: 'none' }}
              >
                <SparklineLarge
                  data={PLACEHOLDER_SPARK}
                  color="#4ade80"
                  id={i}
                  price={parseFloat(art.current_price).toFixed(4)}
                  change=""
                />
              </div>
            </div>

            {/* Card info */}
            <div className="p-4">
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#7A7570] mb-1">
                {artistName}
              </p>
              <h3
                className="text-[1.05rem] font-light text-[#1A1A1A] mb-3 leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {art.title}
              </h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#7A7570] mb-0.5">
                    Current Price
                  </p>
                  <p
                    className="text-[1.25rem] font-light text-[#1A1A1A] leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {parseFloat(art.current_price).toFixed(4)}
                    <span className="text-[#C9A96E] text-xs ml-1">ETH</span>
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: phase.color }}>
                    {art.ticker ?? ''}
                  </p>
                </div>
              </div>

              {/* Collect button */}
              <div className="mt-3 overflow-hidden h-0 group-hover:h-9 transition-all duration-400">
                <a
                  href={`/trade?id=${art.id}`}
                  className="w-full h-9 text-[10px] tracking-[0.2em] uppercase bg-[#1A1A1A] text-white hover:bg-[#C9A96E] hover:text-[#1A1A1A] transition-colors duration-300 flex items-center justify-center"
                  onClick={e => e.stopPropagation()}
                >
                  Collect Now
                </a>
              </div>
            </div>
          </div>
          )
        })}

        {/* Right spacer — makes last card fully visible when scrolled to end */}
        <div className="shrink-0 w-6 md:w-16 lg:w-24" aria-hidden="true" />
      </div>

      {/* Scroll hint */}
      <div className="flex justify-center mt-6 gap-1.5" aria-hidden="true">
        {artworks.map((_, i) => (
          <div
            key={i}
            className="h-px w-6 bg-[#C9A96E] opacity-30 first:opacity-80"
          />
        ))}
      </div>
    </section>
  )
}
