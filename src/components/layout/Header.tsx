'use client'

import { useEffect, useRef, useState } from 'react'
import { ConnectButton }               from '@rainbow-me/rainbowkit'
import { useAccount }                  from 'wagmi'
import { gsap }                        from '@/lib/gsap'
import { LoginModal }                  from './LoginModal'
import { useAuthStore }                from '@/store/authStore'

// ── Notification data ────────────────────────────────────────────
const NOTIF_DATA = [
  { id: 1, type: 'bid',   unread: true,
    title: '"Starry Night #042" received a bid',
    desc: '2.4 ETH from 0x4f2…a91', time: '2m ago' },
  { id: 2, type: 'sale',  unread: true,
    title: '"Blue Horizon" sold',
    desc: 'Sold for 1.8 ETH', time: '15m ago' },
  { id: 3, type: 'price', unread: true,
    title: '"Solitude #007" price up 24%',
    desc: 'New price: 3.2 ETH', time: '1h ago' },
  { id: 4, type: 'follow', unread: true,
    title: '0x8d3…f44 started following you',
    desc: 'View their collection', time: '2h ago' },
  { id: 5, type: 'trade', unread: false,
    title: 'Trade executed',
    desc: 'Bought "Abstract Flow" for 0.5 ETH', time: '3h ago' },
  { id: 6, type: 'bid',   unread: false,
    title: '"Crimson Tide #003" outbid',
    desc: 'You were outbid — new: 4.1 ETH', time: '5h ago' },
  { id: 7, type: 'price', unread: false,
    title: '"Dawn Fragment #11" price down 8%',
    desc: 'New price: 0.95 ETH', time: '8h ago' },
]

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
  return wrap('bg-white/6 border border-white/10',
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/35" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>)
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const panelRef               = useRef<HTMLDivElement>(null)
  const [notifs, setNotifs]    = useState(NOTIF_DATA)
  const [tab, setTab]          = useState<'all' | 'unread'>('all')
  const unread                 = notifs.filter(n => n.unread).length
  const displayed              = tab === 'unread' ? notifs.filter(n => n.unread) : notifs

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

  function dismiss(id: number) {
    setNotifs(n => n.filter(x => x.id !== id))
  }

  return (
    <div ref={panelRef}
      className="absolute right-0 top-[calc(100%+12px)] w-[380px] rounded-2xl overflow-hidden"
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
            Notifications
          </span>
          {unread > 0 && (
            <span className="h-[18px] min-w-[18px] px-1.5 rounded-full bg-[#C9A96E]
                             text-[8.5px] font-bold text-[#1A1A1A] flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button type="button"
            onClick={() => setNotifs(n => n.map(x => ({ ...x, unread: false })))}
            className="text-[10px] font-mono tracking-[0.14em] uppercase text-white/25
                       hover:text-[#C9A96E] transition-colors duration-250">
            Mark all read
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
            {t === 'all' ? 'All' : `Unread${unread > 0 ? ` (${unread})` : ''}`}
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
            <p className="text-[11px] text-white/18 font-mono tracking-widest uppercase">All caught up</p>
          </div>
        ) : displayed.map(n => (
          <div key={n.id}
            className={[
              'ni group relative flex items-start gap-3.5 px-5 py-4 cursor-pointer',
              'transition-colors duration-150',
              n.unread
                ? 'hover:bg-[#C9A96E]/[0.04]'
                : 'hover:bg-white/[0.02]',
            ].join(' ')}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Unread left strip */}
            {n.unread && (
              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full bg-[#C9A96E]"/>
            )}

            <NotifTypeIcon type={n.type} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className={`text-[13px] leading-snug font-medium ${n.unread ? 'text-white/88' : 'text-white/38'}`}>
                  {n.title}
                </p>
                <span className={`text-[10px] font-mono shrink-0 mt-0.5 ${n.unread ? 'text-[#C9A96E]/70' : 'text-white/18'}`}>
                  {n.time}
                </span>
              </div>
              <p className={`text-[11.5px] mt-1 truncate ${n.unread ? 'text-white/32' : 'text-white/18'}`}>
                {n.desc}
              </p>
            </div>

            {/* Dismiss on hover */}
            <button type="button"
              onClick={e => { e.stopPropagation(); dismiss(n.id) }}
              className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full flex items-center justify-center
                         opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70
                         hover:bg-white/8 transition-all duration-150">
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
          View all activity
        </button>
        {notifs.length > 0 && (
          <button type="button" onClick={() => setNotifs([])}
            className="text-[10px] font-mono tracking-[0.12em] uppercase
                       text-white/16 hover:text-red-400/60 transition-colors duration-200">
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

// ── UserMenuDropdown ─────────────────────────────────────────────
function UserMenuDropdown({
  user, onClose, onLogout, T,
}: {
  user: { username?: string | null; wallet_address?: string; avatar_url?: string | null }
  onClose:  () => void
  onLogout: () => void
  T: typeof THEMES.light
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current,
        { autoAlpha: 0, y: -8, scale: 0.97 },
        { autoAlpha: 1, y: 0,  scale: 1, duration: 0.26, ease: 'power3.out' },
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

  const MENU_ITEMS = [
    { icon: '👤', label: 'My Profile',    href: '/vault'       },
    { icon: '🖼️', label: 'My Artworks',   href: '/vault'       },
    { icon: '📊', label: 'Portfolio',      href: '/vault'       },
    { icon: '🎨', label: 'Upload Artwork', href: '/studio'      },
    { icon: '⚙️', label: 'Settings',       href: '/vault'       },
  ]

  return (
    <div ref={panelRef}
      className="absolute right-0 top-[calc(100%+12px)] w-[260px] rounded-2xl overflow-hidden"
      style={{
        background:      '#0E0E0E',
        border:          '1px solid rgba(201,169,110,0.14)',
        boxShadow:       '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
        transformOrigin: 'top right',
        zIndex:          60,
      }}
    >
      {/* Gold line */}
      <div className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg,#C9A96E 0%,rgba(201,169,110,0.2) 60%,transparent 100%)' }}/>

      {/* User info */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={displayName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#C9A96E]/30"/>
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#C9A96E,#8B6914)', color: '#1A1A1A' }}>
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-white/85 truncate"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {displayName}
          </p>
          <p className="text-[10px] font-mono text-[#C9A96E]/70 mt-0.5">
            GitHub Account
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col py-2">
        {MENU_ITEMS.map(({ icon, label, href }) => (
          <a key={label} href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-2.5 text-[13px] text-white/55
                       hover:text-white/88 hover:bg-white/[0.04] transition-colors duration-150">
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </a>
        ))}
      </div>

      {/* Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-2">
        <button type="button" onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                     text-[13px] text-red-400/60 hover:text-red-400
                     hover:bg-red-500/[0.07] transition-all duration-150">
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}

const NAV_LINKS_PUBLIC = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Trade',       href: '/trade' },
  { label: 'Live',        href: '/live' },
  { label: 'Guild',       href: '/guild' },
]

const NAV_LINKS_AUTH = [
  { label: 'Vault',  href: '/vault'  },
  { label: 'Studio', href: '/studio' },
]

// ── Theme tokens for light ↔ dark header ─────────────────────────
const THEMES = {
  light: {
    bg:          '#FDFBF7',
    bgScrolled:  '#FDFBF7',
    border:      'rgba(228,221,211,0.8)',
    shadow:      '0 1px 24px rgba(0,0,0,0.06)',
    logo:        '#1A1A1A',
    nav:         '#7A7570',
    navHover:    '#1A1A1A',
    gold:        '#C9A96E',
    bell:        '#9A9490',
    bellHoverBg: 'rgba(228,221,211,0.5)',
    bellActiveBg:'rgba(228,221,211,0.6)',
    ringColor:   '#FDFBF7',
    chainBorder: '#E4DDD3',
    chainText:   '#7A7570',
    btnBg:       'transparent',
    btnBorder:   '#C9A96E',
    btnText:     '#C9A96E',
    btnHoverBg:  '#C9A96E',
    btnHoverTxt: '#1A1A1A',
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
    ringColor:   '#070707',
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

export function Header({ dark = false }: HeaderProps) {
  const T = dark ? THEMES.dark : THEMES.light

  const [scrolled,    setScrolled]   = useState(false)
  const [showLogin,   setShowLogin]  = useState(false)
  const [showNotifs,  setShowNotifs] = useState(false)
  const [showUserMenu,setShowUserMenu] = useState(false)
  const [hoveredNav,  setHoveredNav] = useState<string | null>(null)
  const headerRef                   = useRef<HTMLElement>(null)
  const unreadCount = NOTIF_DATA.filter(n => n.unread).length
  const { isConnected }              = useAccount()
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const loggedIn   = isConnected || isAuthenticated
  const NAV_LINKS  = loggedIn
    ? [...NAV_LINKS_PUBLIC, ...NAV_LINKS_AUTH]
    : NAV_LINKS_PUBLIC

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-500"
      style={{
        background:   scrolled ? T.bgScrolled : T.bg,
        borderBottom: `1px solid ${T.border}`,
        boxShadow:    scrolled ? T.shadow : 'none',
        backdropFilter: dark ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: dark ? 'blur(16px)' : 'none',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────── */}
      <a href="/" className="flex items-center gap-2 group" aria-label="ArtCurve home">
        <span className="size-2 rounded-full group-hover:scale-150 transition-transform duration-500"
          style={{ background: T.gold }} aria-hidden/>
        <span className="text-2xl tracking-wider transition-colors duration-300"
          style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color: T.logo }}>
          ArtCurve
        </span>
      </a>

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

      {/* ── Right ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">

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
              <span className="absolute top-1 right-1 w-[9px] h-[9px] rounded-full pointer-events-none"
                style={{ background: T.gold, boxShadow: `0 0 0 2px ${T.ringColor}` }}/>
            )}
          </button>
          {showNotifs && <NotificationsDropdown onClose={() => setShowNotifs(false)} />}
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
                  style={{ background: 'linear-gradient(135deg,#C9A96E,#8B6914)', color: '#1A1A1A' }}>
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
                onLogout={() => { clearAuth(); setShowUserMenu(false) }}
                T={T}
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
                Connect Wallet
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
                  style={{ background: T.gold, color: '#1A1A1A' }}>
                  {account.displayName}
                </button>
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>

    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
