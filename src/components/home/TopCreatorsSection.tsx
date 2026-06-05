'use client'

// ─────────────────────────────────────────────────────────────────
//  TopCreatorsSection.tsx  —  Featured Artists
//
//  Design: Dark editorial ranking list — charcoal #111 bg contrasts
//  strongly with cream sections. Full-width horizontal rows.
//
//  Animations (cinematic-gsap pattern):
//    • Eyebrow + title: word-mask reveal (yPercent 110 → 0, blur)
//    • Divider lines: scaleX 0 → 1 staggered
//    • Rows: clip-path inset(0 100% 0 0) → inset(0 0% 0 0)
//    • Hover: GSAP quickTo magnetic on name + image parallax
//    • Stats: opacity 0 → 1 on hover via CSS group
//    • Large rank watermark per row for depth
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { gsap }                         from '@/lib/gsap'
import { userService }                  from '@/services/user.service'
import type { UserProfile }             from '@/types/api'

const MOCK_CREATORS: UserProfile[] = [
  { id: 'm1', wallet_address: '0xA1b2C3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0', username: 'aiko_tanaka',   bio: 'Neo-surrealism meets kawaii. Tokyo-based illustrator.',              avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=aiko',   twitter_handle: null, is_verified: true,  role: 'artist', created_at: '' },
  { id: 'm2', wallet_address: '0xE5f6A7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4', username: 'arnold_b',      bio: 'Dark romanticism for the blockchain era.',                           avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=arnold', twitter_handle: null, is_verified: true,  role: 'artist', created_at: '' },
  { id: 'm3', wallet_address: '0xA7b8C9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6', username: 'kai_storm',     bio: 'Cyberpunk visions from Seoul. Neon never sleeps.',                   avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=kai',    twitter_handle: null, is_verified: true,  role: 'artist', created_at: '' },
  { id: 'm4', wallet_address: '0xB2c3D4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0C1', username: 'marcus_chen',   bio: 'Generative art pioneer. Ex-Google engineer.',                        avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=marcus', twitter_handle: null, is_verified: true,  role: 'artist', created_at: '' },
]

// ── ArtistRow ─────────────────────────────────────────────────────
function ArtistRow({ artist, rank }: { artist: UserProfile; rank: number }) {
  const rowRef  = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const imgRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const row  = rowRef.current
    const name = nameRef.current
    const img  = imgRef.current
    if (!row || !name || !img) return

    // Magnetic parallax via GSAP quickTo
    const nameXTo = gsap.quickTo(name, 'x', { duration: 0.55, ease: 'power3.out' })
    const nameYTo = gsap.quickTo(name, 'y', { duration: 0.55, ease: 'power3.out' })
    const imgXTo  = gsap.quickTo(img,  'x', { duration: 0.65, ease: 'power3.out' })
    const imgYTo  = gsap.quickTo(img,  'y', { duration: 0.65, ease: 'power3.out' })

    const onMove = (e: MouseEvent) => {
      const rect = row.getBoundingClientRect()
      const nx = (e.clientX - rect.left  - rect.width  / 2) / rect.width
      const ny = (e.clientY - rect.top   - rect.height / 2) / rect.height
      nameXTo(nx * 14)
      nameYTo(ny * 7)
      imgXTo(nx * 9)
      imgYTo(ny * 7)
    }
    const onLeave = () => {
      nameXTo(0); nameYTo(0)
      imgXTo(0);  imgYTo(0)
    }

    row.addEventListener('mousemove',  onMove  as EventListener)
    row.addEventListener('mouseleave', onLeave as EventListener)
    return () => {
      row.removeEventListener('mousemove',  onMove  as EventListener)
      row.removeEventListener('mouseleave', onLeave as EventListener)
    }
  }, [])

  return (
    <div
      ref={rowRef}
      className="group relative cursor-pointer
                 hover:bg-white/[0.03] transition-colors duration-500"
    >
      {/* Big rank watermark — depth layer */}
      <span
        className="absolute right-6 md:right-16 lg:right-24 top-1/2 -translate-y-1/2
                   font-light pointer-events-none select-none leading-none"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize:   'clamp(5rem, 10vw, 9rem)',
          color:      'rgba(255,255,255,0.035)',
        }}
        aria-hidden="true"
      >
        {String(rank).padStart(2, '0')}
      </span>

      <div className="relative flex items-center gap-5 md:gap-8
                      px-6 md:px-16 lg:px-24 py-7">

        {/* Rank label */}
        <span className="shrink-0 font-mono text-[10px] tracking-[0.25em] text-white/25 w-7">
          {String(rank).padStart(2, '0')}
        </span>

        {/* Avatar */}
        <div ref={imgRef} className="shrink-0" style={{ willChange: 'transform' }}>
          <div className="size-14 rounded-sm overflow-hidden ring-1 ring-white/10 group-hover:ring-[#C9A96E]/50 transition-all duration-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.avatar_url ?? '/images/artworks/art1.jpg'}
              alt={artist.username ?? artist.wallet_address}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              draggable={false}
            />
          </div>
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3
              ref={nameRef}
              className="font-light text-white leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.6rem, 2.8vw, 2.5rem)', willChange: 'transform' }}
            >
              {artist.username ?? artist.wallet_address.slice(0, 10) + '…'}
            </h3>
            {artist.is_verified && (
              <span className="hidden sm:inline-block text-[9px] tracking-[0.3em] uppercase px-2 py-0.5 border border-[#C9A96E]/30 text-[#C9A96E] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-400">
                Verified
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-white/30 mt-1.5">
            {artist.wallet_address.slice(0, 6)}…{artist.wallet_address.slice(-4)}
          </p>
        </div>

        {/* Role badge */}
        <div className="shrink-0 text-right opacity-40 group-hover:opacity-100 transition-opacity duration-400 hidden md:block">
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/30 mt-1">
            {artist.role}
          </p>
        </div>

        {/* Arrow */}
        <span
          className="shrink-0 text-[#C9A96E]/60
                     group-hover:text-[#C9A96E]
                     translate-x-2 group-hover:translate-x-0
                     transition-all duration-400 text-sm"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </div>
  )
}

// ── Main Section ──────────────────────────────────────────────────
export function TopCreatorsSection() {
  const [creators, setCreators] = useState<UserProfile[]>(MOCK_CREATORS)
  const sectionRef  = useRef<HTMLElement>(null)
  const labelRef    = useRef<HTMLParagraphElement>(null)
  const titleRef    = useRef<HTMLHeadingElement>(null)
  const rowsRef     = useRef<(HTMLDivElement | null)[]>([])
  const linesRef    = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    userService.topCreators(4).then(data => {
      if (Array.isArray(data) && data.length) setCreators(data)
    }).catch(() => setCreators(MOCK_CREATORS))
  }, [])

  // ── GSAP header (1 lần) ───────────────────────────────────────
  useEffect(() => {
    const titleWords = Array.from(
      titleRef.current?.querySelectorAll<HTMLElement>('.tc-word') ?? []
    )
    gsap.set(labelRef.current, { autoAlpha: 0, y: 14 })
    gsap.set(titleWords,       { yPercent: 110, opacity: 0 })

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true, invalidateOnRefresh: true },
      })
      .to(labelRef.current, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0)
      .to(titleWords,        { yPercent: 0, opacity: 1, duration: 1.05, ease: 'expo.out', stagger: 0.14 }, 0.1)
    })
    return () => ctx.revert()
  }, [])

  // ── GSAP rows — re-run khi creators thay đổi ─────────────────
  useEffect(() => {
    const rows  = rowsRef.current.filter(Boolean)
    const lines = linesRef.current.filter(Boolean)
    if (!rows.length) return

    // Nếu đã trong viewport → show ngay không cần scroll
    const sectionRect = sectionRef.current?.getBoundingClientRect()
    const alreadyVisible = sectionRect && sectionRect.top < window.innerHeight

    if (alreadyVisible) {
      gsap.set(lines, { scaleX: 1, transformOrigin: 'left center' })
      gsap.to(rows, { clipPath: 'inset(0 0% 0 0)', autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'expo.out' })
      return
    }

    gsap.set(lines, { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(rows,  { clipPath: 'inset(0 100% 0 0)', autoAlpha: 0 })

    const ctx = gsap.context(() => {
      rows.forEach((row, i) => {
        const line = lines[i]
        gsap.timeline({
          scrollTrigger: { trigger: row, start: 'top 90%', once: true, invalidateOnRefresh: true },
          delay: i * 0.07,
        })
        .to(line, { scaleX: 1, duration: 0.55, ease: 'power3.inOut' }, 0)
        .to(row,  { clipPath: 'inset(0 0% 0 0)', autoAlpha: 1, duration: 0.85, ease: 'expo.out' }, 0.12)
      })
    })
    return () => ctx.revert()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creators])

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#111111] py-20 overflow-hidden"
      aria-label="Top Creators"
    >
      {/* Subtle ambient glow — top-left */}
      <div
        className="absolute -top-48 -left-48 size-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #C9A96E 0%, transparent 65%)',
          opacity: 0.04,
        }}
        aria-hidden="true"
      />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-6 md:px-16 lg:px-24 mb-14">
        <p
          ref={labelRef}
          className="mb-4 text-[11px] tracking-[0.35em] uppercase text-[#C9A96E]"
        >
          Featured Artists
        </p>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2
            ref={titleRef}
            className="font-light text-white flex flex-wrap gap-x-[0.22em]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   'clamp(2rem, 4vw, 3.5rem)',
            }}
            aria-label="Top Creators"
          >
            {['Top', 'Creators'].map(word => (
              <span
                key={word}
                className="overflow-hidden inline-block"
                aria-hidden="true"
              >
                <span
                  className="tc-word inline-block"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {word}
                </span>
              </span>
            ))}
          </h2>

          <a
            href="/marketplace"
            className="text-[11px] tracking-[0.2em] uppercase text-[#C9A96E]
                       border-b border-[#C9A96E]/40 pb-0.5
                       hover:border-[#C9A96E] transition-colors duration-300 shrink-0"
          >
            All Artists →
          </a>
        </div>
      </div>

      {/* ── Artist ranking rows ───────────────────────────────────── */}
      <div className="relative">
        {creators.map((artist, i) => (
          <div key={artist.id}>
            <div
              ref={el => { linesRef.current[i] = el }}
              className="mx-6 md:mx-16 lg:mx-24 h-px"
              style={{ background: 'rgba(255,255,255,0.09)' }}
            />
            <div ref={el => { rowsRef.current[i] = el }}>
              <ArtistRow artist={artist} rank={i + 1} />
            </div>
          </div>
        ))}

        {/* Bottom border */}
        <div
          className="mx-6 md:mx-16 lg:mx-24 h-px"
          style={{ background: 'rgba(255,255,255,0.09)' }}
        />
      </div>
    </section>
  )
}
