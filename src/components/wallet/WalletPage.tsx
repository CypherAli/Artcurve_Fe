'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useBalance, useConnect, useConnectors } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAuthStore }    from '@/store/authStore'
import { usePortfolio }    from '@/hooks/usePortfolio'
import { gsap }            from '@/lib/gsap'
import type { PortfolioHolding } from '@/types/api'

const GOLD = '#C9A96E'

// ── Helpers ──────────────────────────────────────────────────────────

function fmt(n: number | null, decimals = 4) {
  if (n === null) return '—'
  return n.toFixed(decimals)
}

function fmtPct(n: number | null) {
  if (n === null) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)      return `${Math.floor(diff)}s ago`
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function useDetectedAuthMethod(): { label: string; sub: string } {
  const [method, setMethod] = useState({ label: 'Social login', sub: 'OAuth' })
  useEffect(() => {
    try {
      if (localStorage.getItem('artcurve_github_account'))  setMethod({ label: 'GitHub OAuth',    sub: 'Social login' })
      if (localStorage.getItem('artcurve_twitter_account')) setMethod({ label: 'X / Twitter',     sub: 'Social login' })
    } catch { /* SSR */ }
  }, [])
  return method
}

// ── Sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, highlight = false }: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; highlight?: boolean
}) {
  return (
    <div className="stat-card rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: highlight
          ? 'linear-gradient(135deg,rgba(201,169,110,0.1) 0%,rgba(201,169,110,0.03) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${highlight ? 'rgba(201,169,110,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}>
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-mono tracking-[0.14em] uppercase"
          style={{ color: highlight ? 'rgba(201,169,110,0.7)' : 'rgba(255,255,255,0.3)' }}>
          {label}
        </span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,169,110,0.1)', color: GOLD }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[1.45rem] font-semibold leading-none"
          style={{ fontFamily: "'Cormorant Garamond',serif", color: highlight ? GOLD : 'rgba(255,255,255,0.9)' }}>
          {value}
        </p>
        {sub && (
          <p className="text-[11.5px] mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

function PnLBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const pos = pct >= 0
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full"
      style={{
        background: pos ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
        color:      pos ? '#4ade80'                 : '#f87171',
        border:     `1px solid ${pos ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
      }}>
      {pos ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
    </span>
  )
}

function HoldingRow({ h }: { h: PortfolioHolding }) {
  const pnl    = parseFloat(h.unrealized_pnl_eth)
  const pnlPct = parseFloat(h.unrealized_pnl_pct)
  const pos    = pnl >= 0
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-150"
      style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>

      {/* Title + ticker */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-white/85 truncate">{h.artwork_title}</p>
        <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {parseFloat(h.share_balance).toFixed(2)} shares
          {' · '}avg {parseFloat(h.avg_buy_price).toFixed(6)} ETH
        </p>
      </div>

      {/* Current value */}
      <div className="text-right shrink-0">
        <p className="text-[13.5px] font-mono text-white/80">
          {parseFloat(h.current_value_eth).toFixed(4)} ETH
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-0.5">
          <span className="text-[11px] font-mono" style={{ color: pos ? '#4ade80' : '#f87171' }}>
            {pos ? '+' : ''}{pnl.toFixed(4)} ETH
          </span>
          <PnLBadge pct={pnlPct} />
        </div>
      </div>
    </div>
  )
}

function WalletConnectorIcon({ name, icon }: { name: string; icon?: string }) {
  if (icon) return (
    <img src={icon} alt={name}
      className="w-7 h-7 rounded-lg object-contain shrink-0"
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  )
  const n = name.toLowerCase()
  if (n.includes('metamask')) return (
    <svg viewBox="0 0 35 33" className="w-7 h-7 shrink-0" fill="none">
      <path d="M32.958.5 19.338 10.702l2.47-5.826L32.958.5z" fill="#E17726" stroke="#E17726" strokeWidth=".25"/>
      <path d="M2.042.5l13.504 10.29-2.35-5.914L2.042.5z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M28.13 23.533l-3.623 5.545 7.755 2.134 2.224-7.56-6.356-.119z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M.527 23.652l2.21 7.56 7.74-2.134-3.608-5.545-6.342.119z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M10.065 14.513l-2.165 3.271 7.711.352-.264-8.29-5.282 4.667zM24.935 14.513l-5.37-4.754-.176 8.377 7.71-.352-2.164-3.271z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
      <path d="M10.477 29.078l4.64-2.251-4.006-3.124-.634 5.375zM19.883 26.827l4.655 2.251-.648-5.375-4.007 3.124z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
    </svg>
  )
  if (n.includes('coinbase')) return (
    <svg viewBox="0 0 96 96" className="w-7 h-7 shrink-0">
      <rect width="96" height="96" rx="20" fill="#0052FF"/>
      <path d="M48 20c15.464 0 28 12.536 28 28S63.464 76 48 76 20 63.464 20 48s12.536-28 28-28zm-7 19v18h14V39H41z" fill="white"/>
    </svg>
  )
  if (n.includes('walletconnect') || n.includes('wallet connect')) return (
    <svg viewBox="0 0 96 96" className="w-7 h-7 shrink-0">
      <rect width="96" height="96" rx="20" fill="#3B99FC"/>
      <path d="M26.6 36.1c11.8-11.6 31-11.6 42.8 0l1.4 1.4c.6.6.6 1.5 0 2.1l-4.9 4.8c-.3.3-.7.3-1 0l-1.9-1.9c-8.2-8.1-21.6-8.1-29.8 0L31 44c-.3.3-.7.3-1 0l-4.9-4.8c-.6-.6-.6-1.5 0-2.1l1.5-1zm52.8 9.9 4.4 4.3c.6.6.6 1.5 0 2.1L65.8 70.1c-.6.6-1.5.6-2.1 0L49.9 56.5c-.1-.1-.4-.1-.5 0L35.6 70.1c-.6.6-1.5.6-2.1 0L15.3 52.3c-.6-.6-.6-1.5 0-2.1l4.4-4.3c.6-.6 1.5-.6 2.1 0L35.6 59.5c.1.1.4.1.5 0L49.9 45.9c.6-.6 1.5-.6 2.1 0L65.8 59.5c.1.1.4.1.5 0l13.8-13.5c.6-.6 1.5-.6 2.1 0l-2.8-.1z" fill="white"/>
    </svg>
  )
  if (n.includes('phantom')) return (
    <svg viewBox="0 0 128 128" className="w-7 h-7 shrink-0">
      <rect width="128" height="128" rx="28" fill="#AB9FF2"/>
      <path d="M110.584 64.945c0 27.953-17.797 47.5-43.637 47.5-11.817 0-21.18-3.652-27.856-10.684L22.855 87.28a3.75 3.75 0 0 1 2.652-6.39h5.516c-1.406-4.277-2.09-8.86-2.09-13.628 0-27.941 17.785-47.512 43.625-47.512 25.84 0 38.026 17.25 38.026 45.195zm-55.12 3.664c0 7.03 4.336 11.71 10.828 11.71 6.48 0 10.816-4.68 10.816-11.71 0-7.043-4.336-11.723-10.816-11.723-6.492 0-10.829 4.68-10.829 11.723zm27.942 0c0 7.03 4.336 11.71 10.828 11.71 6.48 0 10.816-4.68 10.816-11.71 0-7.043-4.336-11.723-10.816-11.723-6.492 0-10.828 4.68-10.828 11.723z" fill="white"/>
    </svg>
  )
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/10">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" strokeLinecap="round"/>
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export function WalletPage() {
  const { address, isConnected, chain }  = useAccount()
  const { data: balance }                = useBalance({ address })
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { connect }                      = useConnect()
  const { openConnectModal }             = useConnectModal()
  const connectors                       = useConnectors()
  const { holdings, totalValue, pnlEth, pnlPct, isLoading: pfLoading } = usePortfolio()
  const authMethod                       = useDetectedAuthMethod()

  const rootRef    = useRef<HTMLDivElement>(null)
  const [copied, setCopied]   = useState(false)
  const [showAll, setShowAll] = useState(false)

  // De-duplicate connectors
  const unique = useMemo(() => {
    const seen = new Set<string>()
    return connectors.filter(c => {
      const key = c.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [connectors])

  const visibleConnectors = showAll ? unique : unique.slice(0, 3)

  // Address to display: prefer connected wallet, fallback to backend address
  const displayAddress = address ?? user?.wallet_address ?? null
  const ethRaw         = balance ? Number(balance.value) / 1e18 : null

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.wpage-item',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.07, delay: 0.1 },
      )
    }, rootRef)
    return () => ctx.revert()
  }, [isAuthenticated])

  function copy() {
    if (!displayAddress) return
    navigator.clipboard.writeText(displayAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Not authenticated ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke={GOLD} strokeWidth="1.5">
              <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" strokeLinecap="round"/>
              <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-[1.4rem] text-white/85 mb-2"
            style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>
            Sign in to view your wallet
          </h2>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Connect with GitHub, X, or a crypto wallet to access your portfolio and on-chain activity.
          </p>
        </div>
      </div>
    )
  }

  // ── Authenticated ──────────────────────────────────────────────────
  return (
    <div ref={rootRef} className="min-h-screen pt-28 pb-20 px-5 md:px-12 max-w-4xl mx-auto">

      {/* ── Page header ── */}
      <div className="wpage-item mb-10 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] font-mono tracking-[0.22em] uppercase mb-2" style={{ color: GOLD }}>
            Wallet
          </p>
          <h1 className="text-[2.1rem] text-white/90 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>
            Your Wallet
          </h1>
          <p className="text-[13.5px] mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Manage your identity, balance, and on-chain activity.
          </p>
        </div>
        {/* Verified badge */}
        {user?.is_verified && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={GOLD}>
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z"/>
            </svg>
            <span className="text-[10.5px] font-mono tracking-[0.1em]" style={{ color: GOLD }}>VERIFIED</span>
          </div>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="wpage-item mb-6 rounded-2xl p-5 flex items-center gap-5 flex-wrap"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Avatar */}
        <div className="shrink-0">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username ?? 'User'}
              className="w-14 h-14 rounded-2xl object-cover"
              style={{ border: '2px solid rgba(201,169,110,0.3)' }}/>
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[20px] font-bold"
              style={{ background: 'linear-gradient(135deg,rgba(201,169,110,0.3),rgba(201,169,110,0.08))', color: GOLD, border: '2px solid rgba(201,169,110,0.25)' }}>
              {(user?.username ?? '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[1.05rem] font-semibold text-white/90">
              {user?.username ?? 'Anonymous'}
            </p>
            <span className="text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {user?.role ?? 'user'}
            </span>
          </div>
          {displayAddress && (
            <p className="text-[11.5px] mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {shortAddr(displayAddress)}
            </p>
          )}
        </div>

        {/* Sign out */}
        <button type="button" onClick={clearAuth}
          className="shrink-0 flex items-center gap-2 px-3.5 h-8 rounded-xl text-[11.5px] font-mono tracking-widest uppercase transition-all duration-200"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.8)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>

      {/* ── Address card ── */}
      {displayAddress && (
        <div className="wpage-item mb-6 rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg,rgba(201,169,110,0.07) 0%,rgba(201,169,110,0.02) 100%)', border: '1px solid rgba(201,169,110,0.18)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase mb-1.5" style={{ color: 'rgba(201,169,110,0.6)' }}>
                {isConnected ? 'Connected Wallet' : 'Account Address'}
              </p>
              <p className="text-[13.5px] font-mono text-white/80 break-all leading-relaxed">
                {displayAddress}
              </p>
              {chain && (
                <p className="text-[11.5px] mt-1.5 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {chain.name} · Chain ID {chain.id}
                </p>
              )}
              {!isConnected && user?.wallet_address && (
                <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Smart account · managed by platform
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={copy} type="button"
                className="flex items-center gap-2 px-3.5 h-9 rounded-xl text-[11.5px] font-mono tracking-widest uppercase transition-all duration-150"
                style={{ border: `1px solid rgba(201,169,110,0.3)`, color: copied ? '#4ade80' : GOLD, background: 'transparent' }}>
                {copied ? (
                  <><svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
                ) : (
                  <><svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round"/></svg>Copy</>
                )}
              </button>
              <a href={`https://basescan.org/address/${displayAddress}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 h-9 rounded-xl text-[11.5px] font-mono tracking-widest uppercase transition-all duration-150"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Explorer
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="wpage-item grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="ETH Balance"
          value={ethRaw !== null ? `${fmt(ethRaw, 4)} ETH` : '—'}
          sub={ethRaw !== null && ethRaw > 0 ? `≈ $${(ethRaw * 3420).toLocaleString('en', { maximumFractionDigits: 0 })}` : isConnected ? 'Empty wallet' : 'Wallet not connected'}
          highlight={ethRaw !== null && ethRaw > 0}
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2L2 12l10 10 10-10L12 2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 6v12M6 12h12" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Portfolio"
          value={totalValue !== null ? `${fmt(totalValue, 4)} ETH` : pfLoading ? '...' : '—'}
          sub={holdings.length > 0 ? `${holdings.length} holding${holdings.length > 1 ? 's' : ''}` : 'No positions'}
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Network"
          value={chain?.name ?? (isAuthenticated ? 'Base Sepolia' : '—')}
          sub={chain ? `Chain ID ${chain.id}` : 'Testnet'}
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Auth Method"
          value={isConnected ? 'On-Chain' : authMethod.label}
          sub={isConnected ? 'SIWE · EIP-4361' : authMethod.sub}
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
      </div>

      {/* ── Portfolio holdings ── */}
      {(holdings.length > 0 || pfLoading) && (
        <div className="wpage-item mb-6 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={GOLD} strokeWidth="1.7">
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[12.5px] font-semibold text-white/75 tracking-[0.02em]">
                Portfolio Holdings
              </span>
            </div>
            {pnlEth !== null && (
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Total P&amp;L:
                </span>
                <span className="text-[12px] font-mono font-semibold"
                  style={{ color: pnlEth >= 0 ? '#4ade80' : '#f87171' }}>
                  {pnlEth >= 0 ? '+' : ''}{fmt(pnlEth, 4)} ETH
                </span>
                <PnLBadge pct={pnlPct} />
              </div>
            )}
          </div>

          {/* Holdings list */}
          <div className="p-4 flex flex-col gap-2">
            {pfLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[62px] rounded-xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)' }}/>
              ))
            ) : (
              holdings.map(h => <HoldingRow key={h.artwork_id} h={h} />)
            )}
          </div>
        </div>
      )}

      {/* ── Link external wallet ── */}
      {!isConnected && (
        <div className="wpage-item mb-6 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(201,169,110,0.18)', background: 'rgba(201,169,110,0.02)' }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex items-start gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={GOLD} strokeWidth="1.7">
                <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" strokeLinecap="round"/>
                <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10.5px] font-mono tracking-[0.14em] uppercase" style={{ color: 'rgba(201,169,110,0.7)' }}>
                  Optional
                </p>
              </div>
              <h3 className="text-[1.05rem] font-semibold text-white/90"
                style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                Link an External Wallet
              </h3>
              <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Connect MetaMask or another wallet to trade directly on-chain, sign transactions, and verify ownership via SIWE.
              </p>
            </div>
          </div>

          {/* Connector list */}
          <div className="p-4 flex flex-col gap-2">
            {unique.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" strokeLinecap="round"/>
                    <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[13px] text-white/35 mb-1">No wallets detected</p>
                <p className="text-[11.5px] text-white/20 mb-5">Install MetaMask or another browser extension wallet</p>
                <a href="https://metamask.io/download" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 h-9 rounded-xl text-[11.5px] font-mono tracking-widest uppercase transition-opacity duration-150 hover:opacity-80"
                  style={{ border: `1px solid rgba(201,169,110,0.35)`, color: GOLD }}>
                  Get MetaMask
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            ) : (
              <>
                {visibleConnectors.map(connector => (
                  <button key={connector.uid} type="button"
                    onClick={() => {
                      // Injected wallets (MetaMask etc.) can connect directly.
                      // All others (WalletConnect, Safe, Coinbase Smart Wallet…)
                      // need the RainbowKit modal to handle QR / deep-link flow.
                      if (connector.type === 'injected') {
                        connect({ connector })
                      } else {
                        openConnectModal?.()
                      }
                    }}
                    className="group flex items-center gap-3.5 w-full h-[58px] px-4 rounded-xl transition-all duration-150"
                    style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)'
                      e.currentTarget.style.background  = 'rgba(255,255,255,0.055)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                      e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
                    }}>
                    <WalletConnectorIcon name={connector.name} icon={(connector as any).icon ?? undefined} />
                    <span className="flex-1 text-left text-[13.5px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {connector.name}
                    </span>
                    {connector.type === 'injected' && (
                      <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.12em] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                        DETECTED
                      </span>
                    )}
                    <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-0 group-hover:opacity-35 transition-opacity duration-150"
                      fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}

                {unique.length > 3 && (
                  <button type="button" onClick={() => setShowAll(v => !v)}
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[11.5px] font-mono tracking-[0.1em] uppercase transition-colors duration-150"
                    style={{ border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
                    {showAll ? 'Show less' : `Show ${unique.length - 3} more wallets`}
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 transition-transform duration-200"
                      style={{ transform: showAll ? 'rotate(180deg)' : 'none' }}
                      fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-5 pb-5 flex items-start gap-2">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
            </svg>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Linking a wallet lets you sign transactions and own NFTs directly.
              Your ArtCurve account ({user?.username ?? 'profile'}) stays connected regardless.
            </p>
          </div>
        </div>
      )}

      {/* ── Security & session info ── */}
      <div className="wpage-item rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={GOLD} strokeWidth="1.7">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12.5px] font-semibold text-white/75 tracking-[0.02em]">Security</span>
        </div>

        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {[
            {
              label: 'Sign-in method',
              value: isConnected ? 'On-Chain Wallet (SIWE)' : authMethod.label,
              ok: true,
            },
            {
              label: 'Wallet verification',
              value: isConnected ? 'Verified via EIP-4361 signature' : 'Not verified — no wallet connected',
              ok: isConnected,
            },
            {
              label: 'Account role',
              value: user?.role === 'artist' ? 'Artist — can mint artworks' : user?.role === 'admin' ? 'Admin' : 'Collector',
              ok: true,
            },
            {
              label: 'User ID',
              value: user?.id ?? '—',
              mono: true,
              ok: true,
            },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <span className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[12.5px] ${row.mono ? 'font-mono' : ''}`}
                  style={{ color: row.ok ? 'rgba(255,255,255,0.75)' : 'rgba(248,113,113,0.8)' }}>
                  {row.value}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.ok ? 'bg-emerald-400' : 'bg-red-400'}`}/>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
