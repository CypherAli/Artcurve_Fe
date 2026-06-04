'use client'

import { useEffect, useRef, useState } from 'react'
import { useAccount, useBalance }      from 'wagmi'
import { useAuthStore }                from '@/store/authStore'
import { gsap }                        from '@/lib/gsap'

const GOLD = '#C9A96E'

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,169,110,0.1)', color: GOLD }}>{icon}</div>
      </div>
      <p className="text-[26px] font-semibold text-white/90 leading-none"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}>{value}</p>
      {sub && <p className="text-[12px] mt-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{sub}</p>}
    </div>
  )
}

export function WalletPage() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance }               = useBalance({ address })
  const { user, isAuthenticated }       = useAuthStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const displayAddress = address ?? user?.wallet_address ?? '—'
  const shortAddress   = displayAddress !== '—'
    ? `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`
    : '—'
  const ethRaw     = balance ? Number(balance.value) / 1e18 : null
  const ethBalance = ethRaw !== null ? `${ethRaw.toFixed(4)} ETH` : '—'

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.stat-card',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.2 },
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  function copy() {
    if (displayAddress === '—') return
    navigator.clipboard.writeText(displayAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={rootRef} className="min-h-screen pt-28 pb-16 px-6 md:px-16 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-mono tracking-[0.2em] uppercase mb-2" style={{ color: GOLD }}>Wallet</p>
        <h1 className="text-[2.2rem] text-white/90 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
          Your Wallet
        </h1>
        <p className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Manage your connected wallet, balance, and on-chain activity.
        </p>
      </div>

      {/* Address card */}
      <div className="mb-8 rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 100%)', border: '1px solid rgba(201,169,110,0.2)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-mono tracking-[0.15em] uppercase mb-1.5" style={{ color: 'rgba(201,169,110,0.6)' }}>
              {isConnected ? 'Connected Wallet' : 'Account Address'}
            </p>
            <p className="text-[15px] font-mono text-white/80">{displayAddress}</p>
            {chain && (
              <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {chain.name} · Chain ID {chain.id}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={copy} type="button"
              className="flex items-center gap-2 px-4 h-9 rounded-xl text-[12px] font-mono tracking-widest uppercase transition-all duration-200"
              style={{ border: `1px solid rgba(201,169,110,0.3)`, color: copied ? '#4ade80' : GOLD, background: 'transparent' }}>
              {copied ? (
                <><svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied</>
              ) : (
                <><svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round"/></svg>Copy</>
              )}
            </button>
            {displayAddress !== '—' && (
              <a href={`https://sepolia.basescan.org/address/${displayAddress}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 h-9 rounded-xl text-[12px] font-mono tracking-widest uppercase transition-all duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', background: 'transparent' }}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Explorer
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="ETH Balance"
          value={ethBalance}
          sub={ethRaw !== null ? `≈ $${(ethRaw * 3420).toLocaleString('en', { maximumFractionDigits: 0 })}` : undefined}
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2L2 12l10 10 10-10L12 2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 6v12M6 12h12" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Network"
          value={chain?.name ?? (isAuthenticated ? 'Base Sepolia' : 'Not connected')}
          sub="Testnet"
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round"/></svg>}
        />
        <StatCard
          label="Auth Method"
          value={isConnected ? 'MetaMask' : 'GitHub OAuth'}
          sub={isConnected ? 'SIWE (EIP-4361)' : 'Social login'}
          icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
      </div>

      {/* Connect wallet prompt if not connected */}
      {!isConnected && (
        <div className="rounded-2xl p-6 text-center"
          style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p className="text-[14px] mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Connect a wallet to see your on-chain balance
          </p>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Use the Connect Wallet button in the top right
          </p>
        </div>
      )}
    </div>
  )
}
