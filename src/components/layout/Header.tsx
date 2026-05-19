'use client'

// ─────────────────────────────────────────────────────────────────
//  Header.tsx  —  Neo-Luxury navigation bar
//
//  - Fixed at top, starts transparent over hero canvas
//  - Scrolling past 80px → frosted-glass background appears
//  - RainbowKit ConnectButton, styled to match gold palette
//  - Logo uses serif font (Cormorant Garamond)
//  - Magnetic hover on nav links (GSAP quickTo)
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { ConnectButton }               from '@rainbow-me/rainbowkit'
import { gsap }                        from 'gsap'

const NAV_LINKS = [
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Explore',     href: '#explore' },
  { label: 'About',       href: '#about' },
]

export function Header() {
  const [scrolled, setScrolled]  = useState(false)
  const headerRef                = useRef<HTMLElement>(null)

  // Track scroll to toggle frosted background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Magnetic hover effect on nav links
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const links = headerRef.current?.querySelectorAll<HTMLAnchorElement>('[data-magnetic]')
    if (!links) return

    const cleanups: (() => void)[] = []

    links.forEach((link) => {
      const xTo = gsap.quickTo(link, 'x', { duration: 0.45, ease: 'power3.out' })
      const yTo = gsap.quickTo(link, 'y', { duration: 0.45, ease: 'power3.out' })

      const onMove = (e: PointerEvent) => {
        const rect = link.getBoundingClientRect()
        xTo((e.clientX - rect.left - rect.width  / 2) * 0.3)
        yTo((e.clientY - rect.top  - rect.height / 2) * 0.3)
      }
      const onLeave = () => { xTo(0); yTo(0) }

      link.addEventListener('pointermove',  onMove  as EventListener)
      link.addEventListener('pointerleave', onLeave as EventListener)
      cleanups.push(() => {
        link.removeEventListener('pointermove',  onMove  as EventListener)
        link.removeEventListener('pointerleave', onLeave as EventListener)
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return (
    <header
      ref={headerRef}
      className={[
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center justify-between',
        'px-6 md:px-12 py-5',
        'transition-all duration-500',
        scrolled
          ? 'bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E4DDD3]/70 shadow-sm'
          : 'bg-[#FDFBF7]/70 backdrop-blur-sm',
      ].join(' ')}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <a
        href="/"
        className="flex items-center gap-2 group"
        aria-label="ArtCurve home"
      >
        {/* Gold accent mark */}
        <span
          className="size-2 rounded-full bg-[#C9A96E] group-hover:scale-150 transition-transform duration-500"
          aria-hidden="true"
        />
        <span
          className="text-2xl tracking-wider"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
        >
          ArtCurve
        </span>
      </a>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            data-magnetic
            className={[
              'relative text-sm tracking-widest uppercase',
              'text-[#7A7570] hover:text-[#1A1A1A]',
              'transition-colors duration-300',
              // Underline slide-in effect
              'after:content-[\'\'] after:absolute after:bottom-0 after:left-0',
              'after:h-px after:w-0 after:bg-[#C9A96E]',
              'after:transition-[width] after:duration-300 hover:after:w-full',
            ].join(' ')}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── Connect Wallet ─────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* RainbowKit ConnectButton with custom rendering */}
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading'
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus || authenticationStatus === 'authenticated')

            if (!ready) {
              return (
                <div
                  aria-hidden
                  className="h-10 w-32 rounded bg-[#E4DDD3]/40 animate-pulse"
                />
              )
            }

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  type="button"
                  className={[
                    'h-10 px-6 text-sm tracking-widest uppercase',
                    'border border-[#C9A96E] text-[#C9A96E]',
                    'hover:bg-[#C9A96E] hover:text-[#1A1A1A]',
                    'transition-all duration-300',
                  ].join(' ')}
                >
                  Connect
                </button>
              )
            }

            if (chain.unsupported) {
              return (
                <button
                  onClick={openChainModal}
                  type="button"
                  className="h-10 px-4 text-sm border border-red-400 text-red-400 hover:bg-red-400/10 transition-all"
                >
                  Wrong Network
                </button>
              )
            }

            return (
              <div className="flex items-center gap-2">
                {/* Chain indicator */}
                <button
                  onClick={openChainModal}
                  type="button"
                  className="h-10 px-3 border border-[#E4DDD3] text-xs uppercase tracking-wider text-[#7A7570] hover:border-[#C9A96E] transition-colors"
                >
                  {chain.hasIcon && (
                    <span className="inline-flex items-center gap-1.5">
                      {chain.iconUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={chain.iconUrl} alt={chain.name} className="size-3.5 rounded-full" />
                      )}
                      {chain.name}
                    </span>
                  )}
                </button>

                {/* Account button */}
                <button
                  onClick={openAccountModal}
                  type="button"
                  className={[
                    'h-10 px-4 text-sm tracking-wider',
                    'bg-[#C9A96E] text-[#1A1A1A] font-medium',
                    'hover:bg-[#E8D5B0] transition-colors duration-300',
                  ].join(' ')}
                >
                  {account.displayName}
                </button>
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}
