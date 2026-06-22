'use client'

import { useEffect, useRef, useState } from 'react'
import Link                            from 'next/link'
import Image                           from 'next/image'
import { ConnectButton }               from '@rainbow-me/rainbowkit'
import { useAccount }                  from 'wagmi'
import { gsap }                        from '@/lib/gsap'
import { LoginModal }                  from './LoginModal'
import { useTheme }                    from '@/context/ThemeContext'
import { useAuthStore }                from '@/store/authStore'
import { authStore }                   from '@/lib/auth-store'
import { userService }                 from '@/services/user.service'
import { useNotifications }            from '@/hooks/useNotifications'
import type { AppNotification }        from '@/store/notificationStore'
import { useLanguage }                 from '@/context/LanguageContext'
import { ThemeToggle }                 from '@/components/common/ThemeToggle'
import { LANGUAGES, type LocaleCode }  from '@/i18n'

function NotifTypeIcon({ type }: { type: string }) {
  const wrap = (bg: string, el: React.ReactNode) => (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
      {el}
    </div>
  )
  if (type === 'bid') return wrap('bg-[#C9A96E]/10 border border-[#C9A96E]/20',
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#C9A96E]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round"/>
    </svg>)
  if (type === 'sale') return wrap('bg-emerald-500/10 border border-emerald-500/20',
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>)
  if (type === 'price') return wrap('bg-sky-500/10 border border-sky-500/20',
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>)
  if (type === 'follow') return wrap('bg-violet-500/10 border border-violet-500/20',
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4"/><path d="M19 8v6m3-3h-6" strokeLinecap="round"/>
    </svg>)
  return wrap('bg-[var(--ac-paper)]/6 border border-white/10',
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/35" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>)
}

function NotificationsDropdown({
  onClose, notifs, onMarkAllRead, onMarkRead, onDelete, onClearAll,
}: {
  onClose:      () => void
  notifs:       AppNotification[]
  onMarkAllRead: () => void
  onMarkRead:   (id: string) => void
  onDelete:     (id: string) => void
  onClearAll:   () => void
}) {
  const { t: tl }              = useLanguage()
  const panelRef               = useRef<HTMLDivElement>(null)
  const [tab, setTab]          = useState<'all' | 'unread'>('all')
  const unread                 = notifs.filter(n => !n.is_read).length
  const displayed              = tab === 'unread' ? notifs.filter(n => !n.is_read) : notifs

  // Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: -8, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.28, ease: 'power3.out' },
      )
      const items = panelRef.current?.querySelectorAll<HTMLElement>('.ni')
      if (items?.length)
        gsap.fromTo(Array.from(items),
          { autoAlpha: 0, y: 6 },
          { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power3.out', stagger: 0.04, delay: 0.06 },
        )
    })
    return () => ctx.revert()
  }, [])

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const root = panelRef.current?.closest('[data-notif-root]')
      if (!root?.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const [mountTime] = useState(() => Date.now())
  function relativeTime(dateStr: string): string {
    const diff = mountTime - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'vừa xong'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div ref={panelRef}
      className="absolute right-0 top-[calc(100%+12px)] w-[calc(100vw-2rem)] md:w-[380px] max-w-[380px] rounded-2xl overflow-hidden"
      style={{
        background:      '#0E0E0E',
        border:          '1px solid rgba(201,169,110,0.14)',
        boxShadow:       '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset',
        transformOrigin: 'top right',
        zIndex:          60,
      }}
    >
      {/* ── Gold accent line ──────────────────────────────── */}
      <div className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg, #C9A96E 0%, rgba(201,169,110,0.3) 60%, transparent 100%)' }}
      />

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] text-white/85 tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            {tl.header.notifications}
          </span>
          {unread > 0 && (
            <span className="h-[18px] min-w-[18px] px-1.5 rounded-full bg-[#C9A96E]
                             text-[8.5px] font-bold text-[var(--ac-ink)] flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button type="button"
            onClick={onMarkAllRead}
            className="text-[10px] font-mono tracking-[0.14em] uppercase text-white/25
                       hover:text-[#C9A96E] transition-colors duration-250">
            {tl.header.markAllRead}
          </button>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex px-5 pb-3 gap-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(['all', 'unread'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={[
              'relative px-4 h-8 text-[10.5px] font-mono tracking-[0.14em] uppercase',
              'transition-colors duration-200',
              tab === t ? 'text-[#C9A96E]' : 'text-white/25 hover:text-white/50',
            ].join(' ')}>
            {t === 'all' ? tl.header.all : `${tl.header.unread}${unread > 0 ? ` (${unread})` : ''}`}
            {tab === t && (
              <span className="absolute bottom-0 left-4 right-4 h-px bg-[#C9A96E]" />
            )}
          </button>
        ))}
      </div>

      {/* ── List ──────────────────────────────────────────── */}
      <div className="flex flex-col"
        style={{ maxHeight: '352px', overflowY: 'auto',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(201,169,110,0.12) transparent' }}>
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-white/10" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[11px] text-white/18 font-mono tracking-widest uppercase">{tl.header.allCaughtUp}</p>
          </div>
        ) : displayed.map(n => (
          <div key={n.id}
            onClick={() => !n.is_read && onMarkRead(n.id)}
            className={[
              'ni group relative flex items-start gap-3.5 px-5 py-4 cursor-pointer',
              'transition-colors duration-150',
              !n.is_read ? 'hover:bg-[#C9A96E]/[0.04]' : 'hover:bg-[var(--ac-paper)]/[0.02]',
            ].join(' ')}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Unread left strip */}
            {!n.is_read && (
              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full bg-[#C9A96E]"/>
            )}

            <NotifTypeIcon type={n.type} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className={`text-[13px] leading-snug font-medium ${!n.is_read ? 'text-white/88' : 'text-white/38'}`}>
                  {n.title}
                </p>
                <span className={`text-[10px] font-mono shrink-0 mt-0.5 ${!n.is_read ? 'text-[#C9A96E]/70' : 'text-white/18'}`}>
                  {relativeTime(n.created_at)}
                </span>
              </div>
              {n.description && (
                <p className={`text-[11.5px] mt-1 truncate ${!n.is_read ? 'text-white/32' : 'text-white/18'}`}>
                  {n.description}
                </p>
              )}
            </div>

            {/* Dismiss on hover */}
            <button type="button"
              onClick={e => { e.stopPropagation(); onDelete(n.id) }}
              className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full flex items-center justify-center
                         opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70
                         hover:bg-[var(--ac-paper)]/8 transition-all duration-150">
              <svg viewBox="0 0 24 24" className="w-[10px] h-[10px]" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button type="button"
          className="text-[10px] font-mono tracking-[0.18em] uppercase
                     text-white/22 hover:text-[#C9A96E] transition-colors duration-200">
          {tl.header.viewAllActivity}
        </button>
        {notifs.length > 0 && (
          <button type="button" onClick={onClearAll}
            className="text-[10px] font-mono tracking-[0.12em] uppercase
                       text-white/16 hover:text-red-400/60 transition-colors duration-200">
            {tl.header.clearAll}
          </button>
        )}
      </div>
    </div>
  )
}

// ── UserMenuDropdown ─────────────────────────────────────────────
function UserMenuDropdown({
  user, onClose, onLogout,
}: {
  user: { username?: string | null; wallet_address?: string; avatar_url?: string | null }
  onClose:  () => void
  onLogout: () => void
}) {
  const { t } = useLanguage()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: -10, scale: 0.96 },
        { autoAlpha: 1, y: 0,   scale: 1, duration: 0.28, ease: 'power3.out' },
      )
      const items = panelRef.current?.querySelectorAll<HTMLElement>('.um-item')
      if (items?.length)
        gsap.fromTo(Array.from(items),
          { autoAlpha: 0, x: -6 },
          { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out', stagger: 0.04, delay: 0.08 },
        )
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const root = panelRef.current?.closest('[data-user-menu-root]')
      if (!root?.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const displayName = user?.username ?? user?.wallet_address?.slice(0, 10) ?? 'User'
  const initials    = displayName.slice(0, 2).toUpperCase()

  const SECTIONS = [
    {
      label: t.header.menuAccount,
      items: [
        {
          label: t.header.menuEditProfile,
          desc:  t.header.menuEditProfileDesc,
          href:  '/settings',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ),
        },
        {
          label: t.header.menuPortfolio,
          desc:  t.header.menuPortfolioDesc,
          href:  '/vault',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 16l4-4 4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          label: t.header.menuMyArtworks,
          desc:  t.header.menuMyArtworksDesc,
          href:  '/studio',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeLinecap="round"/>
            </svg>
          ),
        },
        {
          label: t.header.menuAiAgent,
          desc:  t.header.menuAiAgentDesc,
          href:  '/agent',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 2a4 4 0 0 1 4 4v1h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a4 4 0 0 1-8 0v-1H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a4 4 0 0 1 4-4z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>
              <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>
              <path d="M9 14.5s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round"/>
            </svg>
          ),
        },
      ],
    },
    {
      label: t.header.menuPreferences,
      items: [
        {
          label: t.header.menuWallet,
          desc:  t.header.menuWalletDesc,
          href:  '/wallet',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3H8L4 7h16l-4-4z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="17" cy="13" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          ),
        },
        {
          label: t.header.menuSettings,
          desc:  t.header.menuSettingsDesc,
          href:  '/settings',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
      ],
    },
  ]

  return (
    <div ref={panelRef}
      className="absolute right-0 top-[calc(100%+14px)] w-[280px] rounded-2xl overflow-hidden"
      style={{
        background:      'linear-gradient(160deg,#141414 0%,#0D0D0D 100%)',
        border:          '1px solid rgba(201,169,110,0.15)',
        boxShadow:       '0 28px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        transformOrigin: 'top right',
        zIndex:          60,
      }}
    >
      {/* Top gold bar */}
      <div className="h-[2px]"
        style={{ background: 'linear-gradient(90deg,#C9A96E 0%,rgba(201,169,110,0.25) 55%,transparent 100%)' }}/>

      {/* ── User card ───────────────────────────────── */}
      <div className="px-4 py-4 flex items-center gap-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="relative shrink-0">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={displayName}
              className="w-11 h-11 rounded-full object-cover"
              style={{ boxShadow: '0 0 0 2px rgba(201,169,110,0.4)' }}/>
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold"
              style={{ background: 'linear-gradient(135deg,#C9A96E 0%,#7A5A1E 100%)', color: 'var(--ac-ink)', boxShadow: '0 0 0 2px rgba(201,169,110,0.3)' }}>
              {initials}
            </div>
          )}
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0D0D0D]"
            style={{ background: '#22c55e' }}/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white/90 truncate leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-white/30 shrink-0" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span className="text-[10.5px] font-mono text-white/30 truncate">GitHub</span>
          </div>
        </div>
      </div>

      {/* ── Menu sections ───────────────────────────── */}
      <div className="py-1.5">
        {SECTIONS.map((section, si) => (
          <div key={section.label}>
            {si > 0 && (
              <div className="mx-4 my-1.5" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}/>
            )}
            <p className="px-5 pt-2 pb-1 text-[9.5px] font-mono tracking-[0.18em] uppercase"
              style={{ color: 'rgba(201,169,110,0.45)' }}>
              {section.label}
            </p>
            <div className="px-2">
              {section.items.map(({ label, desc, href, icon }) => (
                <Link key={label} href={href} onClick={onClose}
                  className="um-item group flex items-center gap-3 px-3 py-2.5 rounded-xl
                             transition-all duration-150 cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-tight">{label}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>{desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-0 group-hover:opacity-35 transition-opacity shrink-0"
                    fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Sign out ────────────────────────────────── */}
      <div className="px-2 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button type="button" onClick={onLogout}
          className="um-item flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl mt-1
                     transition-all duration-150 text-[13px] font-medium"
          style={{ color: 'rgba(239,68,68,0.55)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.9)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.55)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {t.header.signOut}
        </button>
      </div>
    </div>
  )
}

// ── LangSwitcher ──────────────────────────────────────────────────
function LangSwitcher({ theme }: { theme: typeof THEMES[keyof typeof THEMES] }) {
  const { locale, setLocale, t } = useLanguage()
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const panelRef            = useRef<HTMLDivElement>(null)
  const current             = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0]

  // Animate panel — xPercent: -50 giữ translateX(-50%) centering khi GSAP chạy
  useEffect(() => {
    if (!open || !panelRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: -6, scale: 0.97, xPercent: -50 },
        { autoAlpha: 1, y: 0,  scale: 1,    xPercent: -50, duration: 0.2, ease: 'power3.out' },
      )
    })
    return () => ctx.revert()
  }, [open])

  // Outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const root = panelRef.current?.closest('[data-lang-root]')
      if (!root?.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [open])

  const filtered = LANGUAGES.filter(l =>
    search === '' ||
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.native.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative" data-lang-root>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch('') }}
        className="flex items-center gap-1.5 h-9 px-3 rounded-full transition-all duration-200 select-none"
        style={{
          color:      open ? '#D4AF37' : theme.bell,
          background: open ? 'rgba(212,175,55,0.12)' : 'transparent',
          border:     `1px solid ${open ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
          }
        }}
        aria-label="Switch language"
      >
        <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round"/>
        </svg>
        <span className="font-mono text-[11px] tracking-widest uppercase font-semibold leading-none">
          {current.code}
        </span>
        <svg viewBox="0 0 24 24"
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={panelRef}
          data-lang-panel
          className="absolute top-[calc(100%+8px)] w-[228px] rounded-xl"
          style={{
            left:            '50%',
            background:      'rgba(14,14,14,0.98)',
            border:          '1px solid rgba(212,175,55,0.25)',
            boxShadow:       '0 20px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset',
            transformOrigin: 'top center',
            zIndex:          9999,
            backdropFilter:  'blur(16px)',
            visibility:      'hidden',
          }}
        >
          {/* Gold top bar */}
          <div className="shrink-0 h-[2px] w-full rounded-t-xl"
            style={{ background: 'linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.2) 70%, transparent)' }}
          />

          {/* Header + search — fixed, không scroll */}
          <div className="shrink-0 px-3.5 pt-3 pb-2.5">
            <p className="text-[9px] font-mono tracking-[0.28em] uppercase mb-2"
              style={{ color: 'rgba(212,175,55,0.6)' }}>
              {t.lang.label}
            </p>
            <div className="relative">
              <svg viewBox="0 0 24 24"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.lang.search}
                autoFocus
                className="w-full h-8 pl-8 pr-3 rounded-lg text-[12px] outline-none placeholder:text-white/25"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border:     '1px solid rgba(255,255,255,0.1)',
                  color:      'rgba(255,255,255,0.85)',
                }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="shrink-0 mx-3.5 mb-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          {/* Language list — scrollable */}
          <div
            className="pb-1.5"
            style={{
              overflowY:          'auto',
              maxHeight:          '210px',
              overscrollBehavior: 'contain',
              scrollbarWidth:     'thin',
              scrollbarColor:     'rgba(212,175,55,0.3) rgba(255,255,255,0.04)',
            }}
            onWheel={e => e.stopPropagation()}
          >
            {filtered.map(lang => {
              const active = lang.code === locale
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { setLocale(lang.code as LocaleCode); setOpen(false); setSearch('') }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 transition-all duration-100"
                  style={{
                    background: active ? 'rgba(212,175,55,0.13)' : 'transparent',
                    color:      active ? '#D4AF37' : 'rgba(255,255,255,0.82)',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {/* Flag */}
                  <span className="text-[17px] leading-none shrink-0 w-6 text-center">{lang.flag}</span>

                  {/* Text */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[12px] font-medium leading-tight truncate">{lang.native}</p>
                    <p className="text-[10px] leading-none mt-0.5 truncate"
                      style={{ color: active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.35)' }}>
                      {lang.label}
                    </p>
                  </div>

                  {/* Checkmark */}
                  {active ? (
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                </button>
              )
            })}

            {filtered.length === 0 && (
              <p className="text-center py-5 text-[11px] font-mono"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NAV_HREFS_PUBLIC = [
  { key: 'marketplace' as const, href: '/marketplace' },
  { key: 'trade'       as const, href: '/trade' },
  { key: 'live'        as const, href: '/live' },
  { key: 'guild'       as const, href: '/guild' },
]

const NAV_HREFS_AUTH = [
  { key: 'vault'  as const, href: '/vault'  },
  { key: 'studio' as const, href: '/studio' },
]

// ── Theme tokens for light ↔ dark header ─────────────────────────
const THEMES = {
  light: {
    bg:          'var(--ac-paper)',
    bgScrolled:  'var(--ac-paper)',
    border:      'rgba(228,221,211,0.8)',
    shadow:      '0 1px 24px rgba(0,0,0,0.06)',
    logo:        'var(--ac-ink)',
    nav:         'var(--ac-muted)',
    navHover:    'var(--ac-ink)',
    gold:        '#C9A96E',
    bell:        '#9A9490',
    bellHoverBg: 'rgba(228,221,211,0.5)',
    bellActiveBg:'rgba(228,221,211,0.6)',
    ringColor:   'var(--ac-paper)',
    chainBorder: 'var(--ac-line)',
    chainText:   'var(--ac-muted)',
    btnBg:       'transparent',
    btnBorder:   '#C9A96E',
    btnText:     '#C9A96E',
    btnHoverBg:  '#C9A96E',
    btnHoverTxt: 'var(--ac-ink)',
    skeletonBg:  'rgba(228,221,211,0.4)',
  },
  dark: {
    bg:          'rgba(7,7,7,0.88)',
    bgScrolled:  'rgba(7,7,7,0.96)',
    border:      'rgba(255,255,255,0.07)',
    shadow:      '0 1px 32px rgba(0,0,0,0.5)',
    logo:        'rgba(255,255,255,0.88)',
    nav:         'rgba(255,255,255,0.38)',
    navHover:    'rgba(255,255,255,0.88)',
    gold:        '#D4AF37',
    bell:        'rgba(255,255,255,0.38)',
    bellHoverBg: 'rgba(255,255,255,0.06)',
    bellActiveBg:'rgba(255,255,255,0.08)',
    ringColor:   'var(--ac-paper, #070707)',
    chainBorder: 'rgba(255,255,255,0.1)',
    chainText:   'rgba(255,255,255,0.45)',
    btnBg:       'transparent',
    btnBorder:   'rgba(212,175,55,0.5)',
    btnText:     '#D4AF37',
    btnHoverBg:  'rgba(212,175,55,0.12)',
    btnHoverTxt: '#D4AF37',
    skeletonBg:  'rgba(255,255,255,0.06)',
  },
}

interface HeaderProps { dark?: boolean }

export function Header({ dark }: HeaderProps) {
  const { theme } = useTheme()
  const isDark = dark ?? (theme === 'dark')
  const T = isDark ? THEMES.dark : THEMES.light
  const { t } = useLanguage()

  const [scrolled,    setScrolled]   = useState(false)
  const [showLogin,   setShowLogin]  = useState(false)
  const [showNotifs,  setShowNotifs] = useState(false)
  const [showUserMenu,setShowUserMenu] = useState(false)
  const [hoveredNav,  setHoveredNav] = useState<string | null>(null)
  const [mobileMenu,  setMobileMenu] = useState(false)
  const headerRef                   = useRef<HTMLElement>(null)
  const {
    items: notifData,
    unreadCount,
    markAllRead:  notifMarkAllRead,
    markRead:     notifMarkRead,
    deleteOne:    notifDelete,
    clearAll:     notifClearAll,
  } = useNotifications()
  const { isConnected }                        = useAccount()
  const { isAuthenticated, user, clearAuth, setAuth } = useAuthStore()
  const loggedIn = isConnected || isAuthenticated

  // Chỉ chạy khi user.id vẫn là wallet_address (placeholder sau OAuth login)
  useEffect(() => {
    if (!isAuthenticated || !user || user.id !== user.wallet_address) return
    const jwt = useAuthStore.getState().jwt
    if (!jwt) return
    userService.me()
      .then(profile => {
        const fullUser = {
          ...user,
          id:          profile.id,
          avatar_url:  profile.avatar_url ?? user.avatar_url,
          username:    profile.username   ?? user.username,
          role:        profile.role,
          is_verified: profile.is_verified,
        }
        setAuth(jwt, fullUser)
        authStore.setUser(fullUser)
      })
      .catch(() => {})
  }, [isAuthenticated])
  const NAV_HREFS  = loggedIn
    ? [...NAV_HREFS_PUBLIC, ...NAV_HREFS_AUTH]
    : NAV_HREFS_PUBLIC
  const NAV_LINKS  = NAV_HREFS.map(({ key, href }) => ({ label: t.nav[key], href }))

  useEffect(() => {
    const sentinel = document.createElement('div')
    sentinel.style.cssText = 'position:absolute;top:80px;height:1px;width:1px;pointer-events:none'
    document.body.prepend(sentinel)
    const obs = new IntersectionObserver(
      ([e]) => setScrolled(!e.isIntersecting),
      { threshold: 1 },
    )
    obs.observe(sentinel)
    return () => { obs.disconnect(); sentinel.remove() }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const links = headerRef.current?.querySelectorAll<HTMLAnchorElement>('[data-magnetic]')
    if (!links) return
    const cleanups: (() => void)[] = []
    links.forEach(link => {
      const xTo = gsap.quickTo(link, 'x', { duration: 0.45, ease: 'power3.out' })
      const yTo = gsap.quickTo(link, 'y', { duration: 0.45, ease: 'power3.out' })
      const onMove  = (e: PointerEvent) => {
        const r = link.getBoundingClientRect()
        xTo((e.clientX - r.left - r.width  / 2) * 0.3)
        yTo((e.clientY - r.top  - r.height / 2) * 0.3)
      }
      const onLeave = () => { xTo(0); yTo(0) }
      link.addEventListener('pointermove',  onMove  as EventListener)
      link.addEventListener('pointerleave', onLeave as EventListener)
      cleanups.push(() => {
        link.removeEventListener('pointermove',  onMove  as EventListener)
        link.removeEventListener('pointerleave', onLeave as EventListener)
      })
    })
    return () => cleanups.forEach(fn => fn())
  }, [])

  return (
    <>
    <header ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-12 py-4 md:py-5 transition-all duration-500"
      style={{
        background:   scrolled ? T.bgScrolled : T.bg,
        borderBottom: `1px solid ${T.border}`,
        boxShadow:    scrolled ? T.shadow : 'none',
        backdropFilter: dark ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: dark ? 'blur(16px)' : 'none',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────── */}
      <Link href="/" className="flex items-center group" aria-label="ArtCurve home" style={{ gap: 0 }}>
        <Image
          src={isDark ? '/images/logo_darkmode_nobg.png' : '/images/logo_light_nobg.png'}
          alt="" width={48} height={48}
          className="group-hover:scale-105 transition-transform duration-500"
          style={{ objectFit: 'contain', marginRight: -12 }}
        />
        <span className="transition-colors duration-300"
          style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color: T.logo, fontSize: 24, letterSpacing: '0.06em', lineHeight: 1 }}>
          rtCurve
        </span>
      </Link>

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
        {NAV_LINKS.map(({ label, href }) => (
          <a key={label} href={href} data-magnetic
            onMouseEnter={() => setHoveredNav(label)}
            onMouseLeave={() => setHoveredNav(null)}
            className="relative text-sm tracking-widest uppercase transition-colors duration-300"
            style={{ color: hoveredNav === label ? T.navHover : T.nav }}
          >
            {label}
            {/* Underline */}
            <span className="absolute bottom-0 left-0 h-px transition-all duration-300"
              style={{
                background: T.gold,
                width: hoveredNav === label ? '100%' : '0%',
              }}/>
          </a>
        ))}
      </nav>

      {/* ── Hamburger (mobile only) ────────────────────────────── */}
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200"
        style={{ color: T.nav }}
        onClick={() => setMobileMenu(v => !v)}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          {mobileMenu
            ? <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"/>
          }
        </svg>
      </button>

      {/* ── Right (desktop) ────────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-3">

        {/* Theme toggle — xé màn light ↔ dark */}
        <ThemeToggle />

        {/* Language switcher */}
        <LangSwitcher theme={T} />

        {/* Bell */}
        <div className="relative" data-notif-root>
          <button type="button" aria-label="Notifications"
            onClick={() => setShowNotifs(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              color:      showNotifs ? T.navHover : T.bell,
              background: showNotifs ? T.bellActiveBg : 'transparent',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.bellHoverBg }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = showNotifs ? T.bellActiveBg : 'transparent' }}
          >
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full
                           flex items-center justify-center pointer-events-none
                           text-[9px] font-bold leading-none"
                style={{
                  background: T.gold,
                  color:      'var(--ac-ink)',
                  boxShadow:  `0 0 0 2px ${T.ringColor}`,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationsDropdown
              onClose={() => setShowNotifs(false)}
              notifs={notifData}
              onMarkAllRead={notifMarkAllRead}
              onMarkRead={notifMarkRead}
              onDelete={notifDelete}
              onClearAll={notifClearAll}
            />
          )}
        </div>

        {/* ── GitHub auth user avatar button + dropdown ────────── */}
        {isAuthenticated && !isConnected && (
          <div className="relative" data-user-menu-root>
            <button type="button"
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2.5 h-10 px-3 rounded-xl transition-all duration-200"
              style={{
                border:     `1px solid ${showUserMenu ? 'rgba(201,169,110,0.4)' : T.chainBorder}`,
                background: showUserMenu ? 'rgba(201,169,110,0.06)' : 'transparent',
              }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar"
                  className="w-6 h-6 rounded-full object-cover"/>
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg,#C9A96E,#8B6914)', color: 'var(--ac-ink)' }}>
                  {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-[13px] font-medium max-w-[80px] truncate"
                style={{ color: T.gold }}>
                {user?.username ?? 'Account'}
              </span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0 transition-transform duration-200"
                style={{ color: T.chainText, transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showUserMenu && (
              <UserMenuDropdown
                user={user ?? {}}
                onClose={() => setShowUserMenu(false)}
                onLogout={() => { clearAuth(); authStore.clear(); setShowUserMenu(false) }}
              />
            )}
          </div>
        )}

        {/* ── Login button (hidden when already authenticated) ──── */}
        {!isAuthenticated && (
          <ConnectButton.Custom>
            {({ account, chain, authenticationStatus, mounted }) => {
              const ready     = mounted && authenticationStatus !== 'loading'
              const connected = ready && account && chain &&
                (!authenticationStatus || authenticationStatus === 'authenticated')
              if (connected) return null
              return (
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="h-10 px-4 text-sm tracking-widest uppercase transition-all duration-300 font-medium"
                  style={{ color: T.nav }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.navHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.nav }}
                >
                  Login
                </button>
              )
            }}
          </ConnectButton.Custom>
        )}

        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
            const ready     = mounted && authenticationStatus !== 'loading'
            const connected = ready && account && chain &&
              (!authenticationStatus || authenticationStatus === 'authenticated')

            if (!ready) return (
              <div aria-hidden className="h-10 w-32 rounded animate-pulse"
                style={{ background: T.skeletonBg }}/>
            )

            // Ẩn Connect Wallet khi đã đăng nhập qua OAuth
            if (isAuthenticated && !connected) return null

            if (!connected) return (
              <button onClick={openConnectModal} type="button"
                className="h-10 px-6 text-sm tracking-widest uppercase transition-all duration-300 font-medium"
                style={{
                  background:   T.btnBg,
                  border:       `1px solid ${T.btnBorder}`,
                  color:        T.btnText,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = T.btnHoverBg
                  if (!dark) { el.style.color = T.btnHoverTxt }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = T.btnBg
                  el.style.color = T.btnText
                }}
              >
                {t.header.connectWallet}
              </button>
            )

            if (chain.unsupported) return (
              <button onClick={openChainModal} type="button"
                className="h-10 px-4 text-sm border border-red-400 text-red-400 hover:bg-red-400/10 transition-all">
                Wrong Network
              </button>
            )

            return (
              <div className="flex items-center gap-2">
                <button onClick={openChainModal} type="button"
                  className="h-10 px-3 text-xs uppercase tracking-wider transition-colors duration-200"
                  style={{ border: `1px solid ${T.chainBorder}`, color: T.chainText }}>
                  {chain.hasIcon && (
                    <span className="inline-flex items-center gap-1.5">
                      {chain.iconUrl && <img src={chain.iconUrl} alt={chain.name} className="size-3.5 rounded-full"/>}
                      {chain.name}
                    </span>
                  )}
                </button>
                <button onClick={openAccountModal} type="button"
                  className="h-10 px-4 text-sm tracking-wider font-medium transition-colors duration-300"
                  style={{ background: T.gold, color: 'var(--ac-ink)' }}>
                  {account.displayName}
                </button>
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>

    {/* ── Mobile slide-out menu ──────────────────────────────── */}
    {mobileMenu && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileMenu(false)}
        />
        {/* Panel */}
        <div
          className="fixed top-0 right-0 z-50 h-full w-72 flex flex-col md:hidden"
          style={{
            background: dark ? '#0E0E0E' : 'var(--ac-paper)',
            borderLeft: `1px solid ${T.border}`,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Close */}
          <div className="flex items-center justify-between px-5 py-5">
            <span className="text-lg tracking-wider" style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, color: T.logo }}>
              Menu
            </span>
            <button type="button" onClick={() => setMobileMenu(false)} aria-label="Close menu"
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{ color: T.nav }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {/* Gold line */}
          <div className="h-px mx-5" style={{ background: `linear-gradient(90deg, ${T.gold}, transparent)` }} />
          {/* Links */}
          <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href}
                onClick={() => setMobileMenu(false)}
                className="block px-3 py-3 text-sm tracking-widest uppercase transition-colors duration-200 rounded-lg"
                style={{ color: T.nav }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.navHover; (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.nav; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Divider */}
          <div className="h-px mx-5" style={{ background: `linear-gradient(90deg, ${T.gold}, transparent)` }} />

          {/* Mobile controls */}
          <div className="flex items-center gap-3 px-5 py-4">
            <ThemeToggle />
            <LangSwitcher theme={T} />
            {/* Bell */}
            <div className="relative" data-notif-root>
              <button type="button" aria-label="Notifications"
                onClick={() => { setShowNotifs(v => !v); setMobileMenu(false) }}
                className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
                style={{ color: T.bell }}
              >
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center pointer-events-none text-[9px] font-bold leading-none"
                    style={{ background: T.gold, color: 'var(--ac-ink)', boxShadow: `0 0 0 2px ${T.ringColor}` }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile auth actions */}
          <div className="px-5 mt-auto pb-6">
            {!isAuthenticated && (
              <button type="button"
                onClick={() => { setShowLogin(true); setMobileMenu(false) }}
                className="w-full h-11 text-sm tracking-widest uppercase font-medium rounded-lg transition-all duration-300"
                style={{ background: T.btnBg, border: `1px solid ${T.btnBorder}`, color: T.btnText }}>
                Login
              </button>
            )}
          </div>
        </div>
      </>
    )}

    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
