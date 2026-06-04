'use client'

import { useEffect, useRef, useState } from 'react'
import { useConnect, useConnectors }    from 'wagmi'
import { gsap }                         from '@/lib/gsap'

interface GithubAccount { username: string; avatar_url: string }

function useLastGithubAccount(): GithubAccount | null {
  const [account, setAccount] = useState<GithubAccount | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('artcurve_github_account')
      if (raw) setAccount(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])
  return account
}

interface Props { onClose: () => void }

type View = 'main' | 'wallets'

// ── Social logins ────────────────────────────────────────────────
const SOCIALS = [
  {
    id: 'google', label: 'Continue with Google',
    bg: '#ffffff', color: '#1A1A1A',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'apple', label: 'Continue with Apple',
    bg: '#000000', color: '#ffffff',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.43c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.54 3.96zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
  {
    id: 'github', label: 'Continue with GitHub',
    bg: '#24292e', color: '#ffffff',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] shrink-0" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
  },
  {
    id: 'x', label: 'Continue with X',
    bg: '#000000', color: '#ffffff',
    icon: (
      <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] shrink-0" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
]

// ── Wallet icon (using connector iconUrl or fallback SVG) ────────
function WalletImg({ connector }: { connector: { name: string; icon?: string } }) {
  const n = connector.name.toLowerCase()

  // Use connector's own icon if provided
  if (connector.icon) {
    return (
      <img src={connector.icon} alt={connector.name}
        className="w-[28px] h-[28px] rounded-lg object-contain"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  // Inline fallbacks for common wallets
  if (n.includes('metamask')) return (
    <svg viewBox="0 0 35 33" className="w-[28px] h-[28px]" fill="none">
      <path d="M32.958.5 19.338 10.702l2.47-5.826L32.958.5z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.042.5l13.504 10.29-2.35-5.914L2.042.5z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.13 23.533l-3.623 5.545 7.755 2.134 2.224-7.56-6.356-.119z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M.527 23.652l2.21 7.56 7.74-2.134-3.608-5.545-6.342.119z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.065 14.513l-2.165 3.271 7.711.352-.264-8.29-5.282 4.667zM24.935 14.513l-5.37-4.754-.176 8.377 7.71-.352-2.164-3.271z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.477 29.078l4.64-2.251-4.006-3.124-.634 5.375zM19.883 26.827l4.655 2.251-.648-5.375-4.007 3.124z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  if (n.includes('coinbase')) return (
    <svg viewBox="0 0 96 96" className="w-[28px] h-[28px]">
      <rect width="96" height="96" rx="20" fill="#0052FF"/>
      <path d="M48 20c15.464 0 28 12.536 28 28S63.464 76 48 76 20 63.464 20 48s12.536-28 28-28zm-7 19v18h14V39H41z" fill="white"/>
    </svg>
  )

  if (n.includes('walletconnect') || n.includes('wallet connect')) return (
    <svg viewBox="0 0 96 96" className="w-[28px] h-[28px]">
      <rect width="96" height="96" rx="20" fill="#3B99FC"/>
      <path d="M26.6 36.1c11.8-11.6 31-11.6 42.8 0l1.4 1.4c.6.6.6 1.5 0 2.1l-4.9 4.8c-.3.3-.7.3-1 0l-1.9-1.9c-8.2-8.1-21.6-8.1-29.8 0L31 44c-.3.3-.7.3-1 0l-4.9-4.8c-.6-.6-.6-1.5 0-2.1l1.5-1zm52.8 9.9 4.4 4.3c.6.6.6 1.5 0 2.1L65.8 70.1c-.6.6-1.5.6-2.1 0L49.9 56.5c-.1-.1-.4-.1-.5 0L35.6 70.1c-.6.6-1.5.6-2.1 0L15.3 52.3c-.6-.6-.6-1.5 0-2.1l4.4-4.3c.6-.6 1.5-.6 2.1 0L35.6 59.5c.1.1.4.1.5 0L49.9 45.9c.6-.6 1.5-.6 2.1 0L65.8 59.5c.1.1.4.1.5 0l13.8-13.5c.6-.6 1.5-.6 2.1 0l-2.8-.1z" fill="white"/>
    </svg>
  )

  if (n.includes('phantom')) return (
    <svg viewBox="0 0 128 128" className="w-[28px] h-[28px]">
      <rect width="128" height="128" rx="28" fill="#AB9FF2"/>
      <path d="M110.584 64.945c0 27.953-17.797 47.5-43.637 47.5-11.817 0-21.18-3.652-27.856-10.684L22.855 87.28a3.75 3.75 0 0 1 2.652-6.39h5.516c-1.406-4.277-2.09-8.86-2.09-13.628 0-27.941 17.785-47.512 43.625-47.512 25.84 0 38.026 17.25 38.026 45.195zm-55.12 3.664c0 7.03 4.336 11.71 10.828 11.71 6.48 0 10.816-4.68 10.816-11.71 0-7.043-4.336-11.723-10.816-11.723-6.492 0-10.829 4.68-10.829 11.723zm27.942 0c0 7.03 4.336 11.71 10.828 11.71 6.48 0 10.816-4.68 10.816-11.71 0-7.043-4.336-11.723-10.816-11.723-6.492 0-10.828 4.68-10.828 11.723z" fill="white"/>
    </svg>
  )

  // Generic
  return (
    <div className="w-[28px] h-[28px] rounded-lg bg-white/10 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" strokeLinecap="round"/>
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// ── Wallet row ───────────────────────────────────────────────────
function WalletRow({
  connector, isDetected, onClick,
}: {
  connector: ReturnType<typeof useConnectors>[0]
  isDetected: boolean
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <button ref={ref} type="button" onClick={onClick}
      onPointerEnter={() => gsap.to(ref.current, { x: 3, duration: 0.28, ease: 'power3.out' })}
      onPointerLeave={() => gsap.to(ref.current, { x: 0, duration: 0.28, ease: 'power3.out' })}
      className="flex items-center gap-3.5 w-full h-[58px] px-4 rounded-xl
                 border border-white/[0.07] bg-white/[0.03]
                 hover:border-[#C9A96E]/35 hover:bg-white/[0.06]
                 transition-colors duration-200"
      style={{ willChange: 'transform' }}
    >
      <WalletImg connector={{ name: connector.name, icon: (connector as any).icon ?? undefined }} />
      <span className="flex-1 text-left text-[13.5px] font-medium text-white/70 group-hover:text-white/90">
        {connector.name}
      </span>
      {isDetected && (
        <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.12em] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          DETECTED
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
export function LoginModal({ onClose }: Props) {
  const connectors      = useConnectors()
  const { connect }     = useConnect()
  const lastGithub      = useLastGithubAccount()
  const [email,    setEmail]         = useState('')
  const [view,     setView]          = useState<View>('main')
  const [toast,    setToast]         = useState<string | null>(null)
  const [showGhPicker, setShowGhPicker] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://artcurve-be.onrender.com'
  function goGithub()          { window.location.href = `${API_BASE}/api/v1/auth/github` }
  function goGithubDifferent() { window.location.href = `https://github.com/logout?return_to=${encodeURIComponent(`${API_BASE}/api/v1/auth/github`)}` }
  function onGithubClick()     { lastGithub ? setShowGhPicker(true) : goGithub() }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const overlayRef  = useRef<HTMLDivElement>(null)
  const cardRef     = useRef<HTMLDivElement>(null)
  const mainRef     = useRef<HTMLDivElement>(null)
  const walletsRef  = useRef<HTMLDivElement>(null)

  // De-duplicate
  const seen   = new Set<string>()
  const unique = connectors.filter(c => {
    const key = c.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const previewWallets = unique.slice(0, 2)

  // ── Entrance ────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: 'power2.out' },
      )
      gsap.fromTo(cardRef.current,
        { autoAlpha: 0, y: 30, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.42, ease: 'power3.out' },
      )
      // Stagger rows — only opacity+y, no blur for perf
      const rows = mainRef.current?.querySelectorAll<HTMLElement>('.lm-row') ?? []
      gsap.fromTo(Array.from(rows),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05, delay: 0.12 },
      )
    })
    return () => ctx.revert()
  }, [])

  // ── Animate view transition ──────────────────────────────────
  function goWallets() {
    gsap.to(mainRef.current,    { autoAlpha: 0, x: -20, duration: 0.22, ease: 'power2.in',
      onComplete: () => setView('wallets') })
  }
  function goMain() {
    setView('main')
    // Re-show main after state update
    requestAnimationFrame(() => {
      gsap.fromTo(mainRef.current,
        { autoAlpha: 0, x: -20 },
        { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power3.out' },
      )
    })
  }

  useEffect(() => {
    if (view === 'wallets' && walletsRef.current) {
      gsap.fromTo(walletsRef.current,
        { autoAlpha: 0, x: 20 },
        { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power3.out' },
      )
    }
  }, [view])

  // ── Close ───────────────────────────────────────────────────
  function close() {
    gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.2 })
    gsap.to(cardRef.current, { autoAlpha: 0, y: 18, scale: 0.97, duration: 0.22,
      ease: 'power3.in', onComplete: onClose })
  }

  function handleConnect(connector: (typeof connectors)[0]) {
    connect({ connector })
    close()
  }

  return (
    <div ref={overlayRef} onClick={close}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(4,4,4,0.8)', backdropFilter: 'blur(6px)',
               WebkitBackdropFilter: 'blur(6px)' }}
    >
      <div ref={cardRef} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[400px] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(170deg,#181818 0%,#101010 100%)',
          border:     '1px solid rgba(255,255,255,0.08)',
          boxShadow:  '0 32px 80px rgba(0,0,0,0.65)',
        }}
      >

        {/* ══════════════════ MAIN VIEW ═══════════════════════ */}
        {view === 'main' && (
          <div ref={mainRef} className="px-8 pt-8 pb-7">

            {/* Close */}
            <button onClick={close}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
                         text-white/25 hover:text-white/65 hover:bg-white/8 transition-all duration-200">
              <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Brand */}
            <div className="lm-row flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'radial-gradient(circle,rgba(201,169,110,0.14) 0%,rgba(201,169,110,0.03) 100%)',
                         border: '1px solid rgba(201,169,110,0.28)' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]"
                  style={{ boxShadow: '0 0 10px rgba(201,169,110,0.5)' }}/>
              </div>
              <h2 className="text-[1.25rem] text-white mb-1"
                style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>
                Welcome back
              </h2>
              <p className="text-[12px] tracking-[0.05em] text-white/30">
                Sign in to start collecting.
              </p>
            </div>

            {/* Toast notification */}
            {toast && (
              <div className="lm-row mb-3 px-3.5 py-2.5 rounded-xl text-[12px] text-center
                              bg-[#C9A96E]/10 border border-[#C9A96E]/25 text-[#C9A96E] tracking-wide">
                {toast}
              </div>
            )}

            {/* Socials */}
            <div className="lm-row flex flex-col gap-2.5 mb-4">
              {SOCIALS.map(({ id, label, bg, color, icon }) => (
                <button key={id} type="button"
                  onClick={() => id === 'github' ? onGithubClick() : showToast('🚧 Coming soon')}
                  className="flex items-center justify-center gap-3 w-full h-11 rounded-xl
                             text-[13px] font-medium tracking-[0.01em]
                             hover:opacity-90 active:scale-[0.99] transition-all duration-150"
                  style={{ background: bg, color }}>
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Email */}
            <div className="lm-row mb-5">
              <div className="flex items-center h-11 rounded-xl px-4 gap-3
                              border border-white/10 bg-white/[0.04]
                              focus-within:border-[#C9A96E]/45 transition-colors duration-200">
                <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] text-white/20 shrink-0"
                  fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" strokeLinecap="round"/>
                </svg>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent text-[13px] text-white/75 placeholder:text-white/18 outline-none"/>
                <button type="button"
                  onClick={() => showToast('🚧 Email login coming soon')}
                  className="w-6 h-6 rounded-full flex items-center justify-center
                             bg-white/6 hover:bg-[#C9A96E]/18 text-white/30 hover:text-[#C9A96E]
                             transition-all duration-200 text-[12px]">
                  →
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="lm-row flex items-center gap-3 mb-3.5">
              <div className="flex-1 h-px bg-white/[0.07]"/>
              <span className="text-[10px] text-white/20 tracking-[0.18em] uppercase font-mono">
                or connect a wallet
              </span>
              <div className="flex-1 h-px bg-white/[0.07]"/>
            </div>

            {/* Preview wallets */}
            <div className="lm-row flex flex-col gap-1.5">
              {previewWallets.map(connector => (
                <WalletRow key={connector.uid} connector={connector}
                  isDetected={connector.type === 'injected'}
                  onClick={() => handleConnect(connector)}
                />
              ))}

              {/* More wallets */}
              <button type="button" onClick={goWallets}
                className="group flex items-center justify-between w-full h-12 px-4 rounded-xl
                           border border-white/[0.06] bg-transparent
                           hover:border-white/12 hover:bg-white/[0.04]
                           transition-all duration-200 mt-0.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-[28px] h-[28px] rounded-lg bg-white/8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/35" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-[13px] text-white/35 group-hover:text-white/55 transition-colors duration-200">
                    More wallets
                  </span>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors duration-200"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════ WALLETS VIEW ════════════════════ */}
        {view === 'wallets' && (
          <div ref={walletsRef}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <button type="button" onClick={goMain}
                className="w-8 h-8 flex items-center justify-center rounded-full
                           text-white/35 hover:text-white/70 hover:bg-white/8 transition-all duration-200">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="text-[14px] font-semibold text-white/80 tracking-[0.02em]">
                Select wallet
              </span>
              <button type="button" onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full
                           text-white/35 hover:text-white/70 hover:bg-white/8 transition-all duration-200">
                <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Scrollable list */}
            <div className="px-4 py-3 flex flex-col gap-1.5 overflow-y-auto"
              style={{ maxHeight: '420px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
              {unique.length > 0 ? unique.map(connector => (
                <WalletRow key={connector.uid} connector={connector}
                  isDetected={connector.type === 'injected'}
                  onClick={() => handleConnect(connector)}
                />
              )) : (
                <p className="text-center text-[12px] text-white/25 py-8 font-mono">
                  No wallets detected.<br/>Install MetaMask to continue.
                </p>
              )}
            </div>

          </div>
        )}

      </div>
    </div>

    {/* ── GitHub account picker popup ─────────────────────────── */}
    {showGhPicker && lastGithub && (
      <div className="fixed inset-0 z-[210] flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={() => setShowGhPicker(false)}>
        <div onClick={e => e.stopPropagation()}
          className="w-full max-w-[340px] rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg,#1a1a1a 0%,#111 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          }}>
          {/* Header */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-0.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/50" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span className="text-[13px] font-semibold text-white/80">Sign in with GitHub</span>
            </div>
            <p className="text-[11px] text-white/30 mt-1">Choose an account to continue to ArtCurve</p>
          </div>

          {/* Saved account */}
          <button type="button" onClick={() => { setShowGhPicker(false); goGithub() }}
            className="flex items-center gap-3.5 w-full px-5 py-4 transition-colors duration-150"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {lastGithub.avatar_url ? (
              <img src={lastGithub.avatar_url} alt={lastGithub.username}
                className="w-10 h-10 rounded-full object-cover shrink-0"
                style={{ boxShadow: '0 0 0 2px rgba(201,169,110,0.3)' }}/>
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg,#C9A96E,#7A5A1E)', color: '#1A1A1A' }}>
                {lastGithub.username.slice(0,1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-[14px] font-medium text-white/90">{lastGithub.username}</p>
              <p className="text-[11.5px] text-white/35 mt-0.5">Continue as this account</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/25 shrink-0"
              fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Divider */}
          <div className="mx-5" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }}/>

          {/* Use different account */}
          <button type="button" onClick={() => { setShowGhPicker(false); goGithubDifferent() }}
            className="flex items-center gap-3.5 w-full px-5 py-4 transition-colors duration-150"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[14px] text-white/55">Use a different account</p>
          </button>

          {/* Cancel */}
          <div className="px-5 pb-4 pt-1">
            <button type="button" onClick={() => setShowGhPicker(false)}
              className="w-full h-9 rounded-xl text-[12px] font-mono tracking-widest uppercase transition-colors duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  )
}
