'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore }                from '@/store/authStore'
import { useUpdateProfile }            from '@/hooks/useProfile'
import { gsap }                        from '@/lib/gsap'
import { useLanguage }                 from '@/context/LanguageContext'

const GOLD  = '#C9A96E'
const DARK  = 'rgba(255,255,255,0.03)'
const BORD  = '1px solid rgba(255,255,255,0.07)'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="settings-section mb-8">
      <h2 className="text-[11px] font-mono tracking-[0.18em] uppercase mb-4" style={{ color: GOLD }}>
        {title}
      </h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: BORD }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-[14px] text-white/80 font-medium">{label}</p>
        {desc && <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{desc}</p>}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { t } = useLanguage()
  const { user }        = useAuthStore()
  const { mutate, isPending } = useUpdateProfile()
  const rootRef         = useRef<HTMLDivElement>(null)

  const [username, setUsername] = useState(user?.username ?? '')
  const [bio,      setBio]      = useState('')
  const [saved,    setSaved]    = useState(false)
  const [notifTrade, setNotifTrade]   = useState(true)
  const [notifFollow, setNotifFollow] = useState(true)
  const [notifPrice,  setNotifPrice]  = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.settings-section',
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.1, delay: 0.15 },
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  function handleSave() {
    mutate({ username: username || undefined })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button type="button" onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-colors duration-250"
        style={{ background: value ? GOLD : 'rgba(255,255,255,0.12)' }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-[var(--ac-paper)] transition-all duration-250"
          style={{ left: value ? '24px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}/>
      </button>
    )
  }

  return (
    <div ref={rootRef} className="min-h-screen pt-28 pb-16 px-6 md:px-16 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-mono tracking-[0.2em] uppercase mb-2" style={{ color: GOLD }}>{t.settings.title}</p>
        <h1 className="text-[2.2rem] text-white/90 leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
          {t.settings.accountSettings}
        </h1>
        <p className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {t.settings.accountSettingsDesc}
        </p>
      </div>

      {/* Profile */}
      <Section title={t.settings.profileSection}>
        <div className="px-5 py-5" style={{ background: DARK }}>
          <div className="flex items-center gap-4 mb-5">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-14 h-14 rounded-full object-cover"
                style={{ boxShadow: `0 0 0 2px ${GOLD}44` }}/>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #7A5A1E)`, color: 'var(--ac-ink)' }}>
                {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[15px] font-semibold text-white/85">{user?.username ?? 'Anonymous'}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {user?.wallet_address?.slice(0, 10)}…
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono tracking-widest uppercase block mb-1.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}>{t.settings.usernameLabel}</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t.settings.usernamePlaceholder}
                className="w-full h-10 rounded-xl px-4 text-[14px] text-white/80 outline-none transition-colors duration-200"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => (e.target.style.borderColor = `${GOLD}66`)}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono tracking-widest uppercase block mb-1.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}>{t.settings.bioLabel}</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t.settings.bioPlaceholder}
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-[14px] text-white/80 outline-none resize-none transition-colors duration-200"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => (e.target.style.borderColor = `${GOLD}66`)}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <button onClick={handleSave} disabled={isPending} type="button"
              className="px-6 h-10 rounded-xl text-[13px] font-mono tracking-widest uppercase transition-all duration-200"
              style={{ background: saved ? 'rgba(74,222,128,0.15)' : `${GOLD}22`,
                       border: `1px solid ${saved ? 'rgba(74,222,128,0.4)' : `${GOLD}55`}`,
                       color: saved ? '#4ade80' : GOLD }}>
              {isPending ? t.settings.saving : saved ? t.settings.saved : t.settings.saveChanges}
            </button>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title={t.settings.notificationsSection}>
        <Row label={t.settings.tradeAlerts} desc={t.settings.tradeAlertsDesc}>
          <Toggle value={notifTrade} onChange={setNotifTrade} />
        </Row>
        <Row label={t.settings.newFollowers} desc={t.settings.newFollowersDesc}>
          <Toggle value={notifFollow} onChange={setNotifFollow} />
        </Row>
        <Row label={t.settings.priceMilestones} desc={t.settings.priceMilestonesDesc}>
          <Toggle value={notifPrice} onChange={setNotifPrice} />
        </Row>
      </Section>

      {/* Security */}
      <Section title={t.settings.securitySection}>
        <Row label={t.settings.authMethod} desc={t.settings.authMethodDesc}>
          <span className="text-[12px] font-mono px-3 py-1 rounded-full"
            style={{ background: 'rgba(201,169,110,0.1)', color: GOLD, border: `1px solid ${GOLD}33` }}>
            GitHub OAuth
          </span>
        </Row>
        <Row label={t.settings.session} desc={t.settings.sessionDesc}>
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: '#4ade80' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"/>{t.settings.active}
          </span>
        </Row>
      </Section>

      {/* Danger zone */}
      <Section title={t.settings.dangerZone}>
        <Row label={t.settings.signOut} desc={t.settings.signOutDesc}>
          <button type="button"
            className="px-4 h-9 rounded-xl text-[12px] font-mono tracking-widest uppercase transition-all duration-200"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.7)', background: 'transparent' }}
            onClick={() => { useAuthStore.getState().clearAuth(); window.location.href = '/' }}>
            {t.settings.signOut}
          </button>
        </Row>
      </Section>
    </div>
  )
}
