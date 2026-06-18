'use client'
// ─────────────────────────────────────────────────────────────────
//  GuildPage — finder (Guild Foundation + Recommended) & hall.
//  i18n theo locale, list cuộn, reward có nghĩa, nút bấm được.
//  Tông Neo-Luxury dark (#0F0E0C + vàng #C9A96E).
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconDiamond, IconCoin, IconTrendingUp, IconAward, IconGift, IconShieldChevron,
  IconMail, IconHash, IconSearch, IconRefresh, IconChevronLeft, IconBell,
  IconMessageCircle, IconChecklist, IconWand, IconTrophy, IconPhoto, IconGavel,
  IconUsers, IconMessage2, IconBuildingBank, IconBuildingCastle, IconCrown,
  IconChessRook, IconX, IconCheck,
} from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { guildService, GUILD_FOUNDATION_FEE_ETH, type ApiGuild } from '@/services/guild.service'

const C = {
  bg: '#0F0E0C', panel: '#181613', panel2: '#100E0B',
  line: '#2B2823', lineGold: 'rgba(201,169,110,0.30)',
  ink: '#F0EBE1', muted: '#8E877B', gold: '#C9A96E', goldLight: '#E8D5B0',
}
const SERIF = "'Cormorant Garamond', Georgia, serif"
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const SCENE = `radial-gradient(55% 50% at 50% -6%, rgba(201,169,110,0.18), transparent 60%),`
  + `radial-gradient(70% 32% at 50% 112%, rgba(201,169,110,0.10), transparent 62%),`
  + `radial-gradient(120% 120% at 50% 45%, transparent 52%, rgba(0,0,0,0.6)), ${C.bg}`

// ── i18n ─────────────────────────────────────────────────────────
const STR = {
  vi: {
    recommended: 'Đề xuất', invite: 'Lời mời', copied: 'Đã sao chép link mời', searchPh: 'Tìm guild theo tên…',
    tag: 'Tag', search: 'Tìm', foundDesc: 'Lập hội của riêng bạn hoặc gia nhập một guild sưu tầm. Cùng giao dịch để nhận thưởng tập thể mỗi tuần.',
    found: 'Lập Guild', feeNote: 'Phí một lần · chống spam', weeklyVol: 'Khối lượng tuần', members: 'Thành viên',
    noRank: 'Không giới hạn rank', accept: 'Duyệt', auto: 'Tự động', manual: 'Thủ công', info: 'Thông tin', empty: 'Không tìm thấy guild nào',
    rewards: ['Cổ tức tuần', 'Điểm cống hiến', 'Huy hiệu danh giá', 'Ưu tiên mở bán'],
    rewardDesc: ['Chia sẻ phí & royalty của hội mỗi tuần', 'Tích điểm để lên cấp guild', 'Danh hiệu & vai trò trong hội', 'Mua sớm các tác phẩm hot'],
    createTitle: 'Lập Guild mới', guildName: 'Tên guild', focus: 'Lĩnh vực', create: 'Tạo guild', cancel: 'Hủy', creating: 'Đang tạo…',
    needLogin: 'Bạn cần đăng nhập để lập guild', createFail: 'Tạo guild thất bại, thử lại sau',
    back: 'Guild', checkin: 'Điểm danh', actAct: 'Hoạt động Guild', actDecor: 'Trang trí Gallery', actDiv: 'Cổ tức tuần',
    nVault: 'Kho chung', nVaultSub: 'Đồng sở hữu tác phẩm', nLeague: 'Giải đấu Guild', nLeagueSub: 'Đua khối lượng theo mùa',
    nGallery: 'Phòng tuyển chọn', nGallerySub: 'BST chung của hội', auction: 'Đấu giá Guild', membersBtn: 'Thành viên', chat: 'Chat hội',
    chatMsg: 'gom đủ vốn rồi, vào lệnh thôi',
  },
  en: {
    recommended: 'Recommended', invite: 'Invite', copied: 'Invite link copied', searchPh: 'Search guild by name…',
    tag: 'Tag', search: 'Search', foundDesc: 'Found your own guild or join a collector club. Trade together to earn weekly collective rewards.',
    found: 'Found', feeNote: 'One-time · anti-spam', weeklyVol: 'Weekly volume', members: 'Members',
    noRank: 'No rank limit', accept: 'Acceptance', auto: 'Auto', manual: 'Manual', info: 'Info', empty: 'No guild found',
    rewards: ['Weekly dividends', 'Contribution XP', 'Prestige badge', 'Early access'],
    rewardDesc: ['Share of guild fees & royalties weekly', 'Earn points to level up the guild', 'Titles & roles within the guild', 'Buy hot drops before others'],
    createTitle: 'Found a new guild', guildName: 'Guild name', focus: 'Focus', create: 'Create', cancel: 'Cancel', creating: 'Creating…',
    needLogin: 'Please sign in to found a guild', createFail: 'Could not create guild, try again later',
    back: 'Guild', checkin: 'Check-in', actAct: 'Guild Activities', actDecor: 'Gallery Decor', actDiv: 'Weekly Dividends',
    nVault: 'Collective Vault', nVaultSub: 'Co-own artworks', nLeague: 'Guild League', nLeagueSub: 'Seasonal volume race',
    nGallery: 'Curated Gallery', nGallerySub: 'Shared collection', auction: 'Guild Auction', membersBtn: 'Members', chat: 'Guild chat',
    chatMsg: 'funded up — let’s trade',
  },
}
type S = typeof STR.en

interface GuildView extends ApiGuild {
  level: number; weeklyVolume: number; maxMembers: number; acceptance: 'auto' | 'manual'; tag: string
}

const MOCK: GuildView[] = [
  { id:'g1', name:'BlueChipDAO',   description:null, focus:'Collectors', avatar_color:C.gold,      member_count:22, level:8,  weeklyVolume:1240, maxMembers:30, acceptance:'auto',   tag:'Collectors~' },
  { id:'g2', name:'GenesisCircle', description:null, focus:'Blue chip',  avatar_color:C.goldLight, member_count:14, level:11, weeklyVolume:3580, maxMembers:27, acceptance:'manual', tag:'Recruiting~' },
  { id:'g3', name:'NeoPatrons',    description:null, focus:'Newcomers',  avatar_color:C.gold,      member_count:6,  level:3,  weeklyVolume:210,  maxMembers:16, acceptance:'auto',   tag:'Newbies~' },
  { id:'g4', name:'PixelGuild',    description:null, focus:'Generative', avatar_color:C.gold,      member_count:18, level:6,  weeklyVolume:920,  maxMembers:24, acceptance:'auto',   tag:'Generative~' },
  { id:'g5', name:'OldMasters',    description:null, focus:'Classical',  avatar_color:C.gold,      member_count:11, level:5,  weeklyVolume:640,  maxMembers:20, acceptance:'manual', tag:'Classical~' },
]

function toView(g: ApiGuild): GuildView {
  return {
    ...g,
    level: g.level ?? Math.max(1, Math.round((g.member_count ?? 1) / 3)),
    weeklyVolume: g.weekly_volume_eth ?? 0,
    maxMembers: g.max_members ?? 30,
    acceptance: g.acceptance ?? 'auto',
    tag: g.focus ? `${g.focus}~` : 'New~',
  }
}

function Filigree({ w = '100%' }: { w?: string }) {
  return (
    <div style={{ position: 'relative', height: 1, width: w, margin: '12px auto', background: `linear-gradient(90deg,transparent,${C.lineGold},transparent)` }}>
      <span style={{ position: 'absolute', left: '50%', top: -3, width: 6, height: 6, marginLeft: -3, transform: 'rotate(45deg)', background: C.gold }} />
    </div>
  )
}

// ── Crest: SVG có shading, gradient kim loại, đổ bóng ─────────────
function FoundationCrest({ size = 168 }: { size?: number }) {
  const g = C.gold, gl = C.goldLight, gd = '#7a5a18'
  return (
    <svg width={size} height={size * 1.22} viewBox="0 0 200 244" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cf-blue" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#3a608f" /><stop offset="0.5" stopColor="#274b75" /><stop offset="1" stopColor="#142944" />
        </linearGradient>
        <linearGradient id="cf-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF1DA" /><stop offset="0.45" stopColor={gl} /><stop offset="1" stopColor={gd} />
        </linearGradient>
        <linearGradient id="cf-cream" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FBF3E3" /><stop offset="0.6" stopColor="#E4CFA4" /><stop offset="1" stopColor="#BE9E68" />
        </linearGradient>
        <filter id="cf-sh" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter="url(#cf-sh)">
        {/* Banner */}
        <path d="M56 30 H144 V196 L100 222 L56 196 Z" fill="url(#cf-blue)" stroke={g} strokeWidth="1.4" />
        <rect x="74" y="30" width="8" height="180" fill="#fff" opacity="0.06" />
        <rect x="118" y="30" width="8" height="180" fill="#000" opacity="0.12" />
        <path d="M62 36 H138 V192 L100 214 L62 192 Z" fill="none" stroke={C.lineGold} strokeWidth="0.7" />

        {/* Rod */}
        <rect x="38" y="16" width="124" height="9" rx="4.5" fill="url(#cf-gold)" stroke={gd} strokeWidth="0.5" />
        <rect x="40" y="18" width="120" height="2.4" fill="#fff" opacity="0.3" />
        <circle cx="34" cy="20.5" r="6.5" fill="url(#cf-gold)" /><circle cx="166" cy="20.5" r="6.5" fill="url(#cf-gold)" />

        {/* Cung trên + kiếm */}
        <path d="M78 58 Q100 42 122 58" fill="none" stroke="url(#cf-gold)" strokeWidth="2.6" strokeLinecap="round" />
        <polygon points="76,58 82,55 82,61" fill={g} /><polygon points="124,58 118,55 118,61" fill={g} />
        <polygon points="100,50 103.5,126 100,133 96.5,126" fill="url(#cf-cream)" stroke={gd} strokeWidth="0.6" />
        <line x1="82" y1="118" x2="118" y2="118" stroke="url(#cf-gold)" strokeWidth="3.4" strokeLinecap="round" />
        <rect x="96.5" y="133" width="7" height="18" rx="2.5" fill="url(#cf-gold)" />
        <circle cx="100" cy="153" r="4.6" fill="none" stroke={g} strokeWidth="2.2" />

        {/* Cánh cuộn — đối xứng 2 tầng */}
        <path d="M96 150 C62 156 40 132 44 96 C66 120 84 128 94 142 Z" fill="url(#cf-cream)" stroke={gd} strokeWidth="0.8" />
        <path d="M104 150 C138 156 160 132 156 96 C134 120 116 128 106 142 Z" fill="url(#cf-cream)" stroke={gd} strokeWidth="0.8" />
        <path d="M98 100 C80 96 70 82 73 64 C88 78 95 86 100 98 Z" fill="url(#cf-cream)" stroke={gd} strokeWidth="0.7" />
        <path d="M102 100 C120 96 130 82 127 64 C112 78 105 86 100 98 Z" fill="url(#cf-cream)" stroke={gd} strokeWidth="0.7" />

        {/* Vương miện trung tâm */}
        <path d="M89 150 L93 138 L96.5 145 L100 134 L103.5 145 L107 138 L111 150 Z" fill="url(#cf-gold)" stroke={gd} strokeWidth="0.5" />
        <rect x="89" y="150" width="22" height="5" rx="1.5" fill="url(#cf-gold)" />

        {/* Gem */}
        <rect x="93.5" y="170.5" width="13" height="13" rx="2" transform="rotate(45 100 177)" fill="#6fd0e8" stroke={gl} strokeWidth="1" />
        <rect x="96" y="173" width="4" height="4" rx="1" transform="rotate(45 100 175)" fill="#bfeefb" opacity="0.8" />

        {/* Tua rua */}
        {[83, 91.5, 100, 108.5, 117].map((x, i) => (
          <g key={i}>
            <rect x={x - 2.6} y="195" width="5.2" height="6" rx="2" fill="url(#cf-gold)" />
            <path d={`M${x - 1.6} 201 V211 M${x} 201 V213 M${x + 1.6} 201 V211`} stroke={g} strokeWidth="1.1" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  )
}

// Mặc định render fallback; nâng cấp sang ảnh thật khi /public load thành công.
function ImgFallback({ src, alt, w, h, fallback }: { src: string; alt: string; w: number; h: number; fallback: React.ReactNode }) {
  const [ok, setOk] = useState(false)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {!ok && fallback}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={w} height={h} onLoad={() => setOk(true)} style={{ objectFit: 'contain', display: ok ? 'block' : 'none' }} />
    </span>
  )
}

const ROW_EMBLEMS = [IconChessRook, IconCrown, IconBuildingCastle, IconShieldChevron, IconBuildingBank]
function RowEmblem({ seed, idx, featured }: { seed: string; idx: number; featured?: boolean }) {
  const Icon = ROW_EMBLEMS[idx % ROW_EMBLEMS.length]
  const url = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&radius=50`
  return <ImgFallback src={url} alt="" w={44} h={44} fallback={<Icon size={26} color={featured ? C.goldLight : C.gold} />} />
}

// ── Finder row ───────────────────────────────────────────────────
function GuildRow({ g, idx, featured, s, onInfo }: { g: GuildView; idx: number; featured?: boolean; s: S; onInfo: () => void }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ borderColor: C.gold, y: -2 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 18, marginBottom: 12, borderRadius: 12,
        background: featured ? 'linear-gradient(180deg,#1a160e,#121009)' : C.panel,
        border: `${featured ? 2 : 1}px solid ${featured ? C.gold : C.line}`,
        boxShadow: featured ? '0 0 22px rgba(201,169,110,0.14)' : 'none',
      }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${featured ? C.gold : C.lineGold}`, background: `radial-gradient(circle, rgba(201,169,110,0.12), ${C.panel2} 72%)` }}>
        <RowEmblem seed={g.name} idx={idx} featured={featured} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.ink }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: featured ? C.goldLight : C.gold }}>Lv.{g.level}</span>{' '}{g.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.weeklyVol}: {g.weeklyVolume.toLocaleString()} ETH</div>
        <span style={{ display: 'inline-block', marginTop: 5, border: `1px solid ${C.lineGold}`, borderRadius: 20, padding: '1px 10px', fontSize: 10, color: C.gold }}>{g.tag}</span>
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
        {s.members} {g.member_count}/{g.maxMembers}<br />{s.noRank}<br />{s.accept}: {g.acceptance === 'auto' ? s.auto : s.manual}
      </div>
      <motion.button type="button" onClick={onInfo} aria-label={`${s.info} ${g.name}`} whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}
        style={{ fontFamily: featured ? SERIF : undefined, borderRadius: 9, padding: featured ? '10px 20px' : '9px 16px',
          fontSize: featured ? 14 : 12, fontWeight: featured ? 600 : 400, cursor: 'pointer',
          color: featured ? '#221905' : C.ink, background: featured ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : 'transparent',
          border: `1px solid ${featured ? C.gold : C.lineGold}` }}>{s.info}</motion.button>
    </motion.div>
  )
}

// ── Create guild modal ───────────────────────────────────────────
const FOCUS_OPTS = ['Collectors', 'Blue chip', 'Generative', 'Classical', 'Experimental', 'Newcomers']
function CreateGuildModal({ s, onClose, onCreated }: { s: S; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [focus, setFocus] = useState(FOCUS_OPTS[0])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true); setErr(null)
    try {
      await guildService.create({ name: name.trim(), focus })
      onCreated()
    } catch (e) {
      const unauth = (e as { isUnauthorized?: boolean })?.isUnauthorized
      setErr(unauth ? s.needLogin : s.createFail)
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ width: 420, maxWidth: '100%', background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
          <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.goldLight }}>{s.createTitle}</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 11, color: C.muted }}>{s.guildName}
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              style={{ marginTop: 6, width: '100%', background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: '10px 12px', color: C.ink, fontSize: 14, outline: 'none' }} />
          </label>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{s.focus}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FOCUS_OPTS.map((f) => (
                <button key={f} type="button" onClick={() => setFocus(f)}
                  style={{ borderRadius: 20, padding: '5px 12px', fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${focus === f ? C.gold : C.line}`, color: focus === f ? '#221905' : C.muted,
                    background: focus === f ? C.gold : 'transparent' }}>{f}</button>
              ))}
            </div>
          </div>
          {err && <div style={{ fontSize: 12, color: '#e87a7a' }}>{err}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted }}>
            <IconCoin size={15} color={C.gold} /> {GUILD_FOUNDATION_FEE_ETH} ETH · {s.feeNote}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ borderRadius: 9, padding: '10px 18px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.line}`, color: C.ink }}>{s.cancel}</button>
            <button type="button" onClick={submit} disabled={!name.trim() || busy}
              style={{ fontFamily: SERIF, borderRadius: 9, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: name.trim() && !busy ? 'pointer' : 'default',
                color: '#221905', background: name.trim() ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : C.line, border: 'none', opacity: busy ? 0.7 : 1 }}>
              {busy ? s.creating : s.create}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Finder view ──────────────────────────────────────────────────
function FinderView({ guilds, s, onEnter, onRefresh, onCreate }: { guilds: GuildView[]; s: S; onEnter: (g: GuildView) => void; onRefresh: () => void; onCreate: () => void }) {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const REWARD_ICONS = [IconCoin, IconTrendingUp, IconAward, IconGift]

  const filtered = useMemo(
    () => guilds.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase())),
    [guilds, query],
  )

  const invite = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/guild` : '/guild'
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, padding: '26px 20px', maxWidth: 1180, margin: '0 auto', alignItems: 'stretch' }}>
      {/* Foundation — banner flag full-height, crest nổi bật */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16, textAlign: 'center', background: C.bg,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px 20px',
      }}>
        <motion.div
          animate={{ boxShadow: ['inset 0 0 30px rgba(100,160,220,0.0)', 'inset 0 0 50px rgba(100,160,220,0.25)', 'inset 0 0 30px rgba(100,160,220,0.0)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/guild/banner.png)', backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.9, pointerEvents: 'none', imageRendering: 'auto' }}
        />
        <motion.div
          animate={{ boxShadow: [`-3px 0 10px ${C.gold}, 3px 0 10px ${C.gold}`, `-3px 0 30px ${C.gold}, 3px 0 30px ${C.gold}, -3px 0 60px rgba(201,169,110,0.3), 3px 0 60px rgba(201,169,110,0.3)`, `-3px 0 10px ${C.gold}, 3px 0 10px ${C.gold}`] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, borderLeft: `2px solid ${C.gold}`, borderRight: `2px solid ${C.gold}`, pointerEvents: 'none', zIndex: 2 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(15,14,12,0.7) 100%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, letterSpacing: 2, color: C.goldLight, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>Guild Foundation</div>
          <div style={{ width: '70%', height: 1, margin: '10px auto 0', background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />

          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px auto 8px' }}>
            <motion.img src="/guild/crest.png" alt="Guild crest"
              animate={{ filter: ['drop-shadow(0 0 16px rgba(201,169,110,0.4))', 'drop-shadow(0 0 28px rgba(201,169,110,0.7))', 'drop-shadow(0 0 16px rgba(201,169,110,0.4))'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ height: 300, objectFit: 'contain' }}
            />
          </div>

          <p style={{ fontSize: 13, color: '#d1cdc5', lineHeight: 1.7, margin: '0 0 14px', padding: '0 10px' }}>{s.foundDesc}</p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 14 }}>
            {s.rewards.map((label, i) => {
              const Icon = REWARD_ICONS[i]
              return (
                <div key={i} title={s.rewardDesc[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.lineGold}`, background: 'rgba(15,14,12,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <ImgFallback src={`/guild/reward-${i + 1}.png`} alt={label} w={38} h={38} fallback={<Icon size={20} color={C.gold} />} />
                  </div>
                  <span style={{ fontSize: 9, color: C.muted, lineHeight: 1.2, textAlign: 'center', textTransform: 'uppercase' as const }}>{label}</span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.lineGold}`, borderRadius: 11, overflow: 'hidden', background: 'rgba(15,14,12,0.6)', maxWidth: 280, margin: '0 auto' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
              <IconCoin size={16} color={C.gold} /><span style={{ fontSize: 14, color: C.ink }}>{GUILD_FOUNDATION_FEE_ETH} ETH</span>
            </div>
            <motion.button type="button" onClick={onCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ fontFamily: SERIF, background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, color: '#221905', fontSize: 14, fontWeight: 600, padding: '12px 20px', cursor: 'pointer', border: 'none' }}>{s.found}</motion.button>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 9 }}>{s.feeNote}</div>
        </div>
      </div>

      {/* Recommended */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: 1, color: C.goldLight }}>{s.recommended}</span>
          <motion.button type="button" onClick={invite} whileTap={{ scale: 0.96 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${C.lineGold}`, borderRadius: 9, padding: '7px 13px', fontSize: 12, color: C.ink, background: 'transparent', cursor: 'pointer' }}>
            {copied ? <IconCheck size={15} color="#8fce9f" /> : <IconMail size={15} color={C.gold} />}{copied ? s.copied : s.invite}
          </motion.button>
        </div>
        <Filigree />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.line}`, borderRadius: 9, padding: '0 12px' }}>
            <IconSearch size={15} color={C.gold} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={s.searchPh}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.ink, fontSize: 12, padding: '9px 0' }} />
          </div>
          <button type="button" aria-label={s.tag} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 11, color: C.muted, background: 'transparent', cursor: 'pointer' }}><IconHash size={14} color={C.gold} />{s.tag}</button>
          <button type="button" onClick={onRefresh} aria-label="Refresh" style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 11px', color: C.muted, background: 'transparent', cursor: 'pointer' }}><IconRefresh size={14} color={C.gold} /></button>
        </div>

        {/* List cuộn — ~4 hàng hiển thị, còn lại cuộn xuống */}
        <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show"
          style={{ maxHeight: 540, overflowY: 'auto', paddingRight: 6 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '30px 0' }}>{s.empty}</div>
            : filtered.map((g, i) => <GuildRow key={g.id} g={g} idx={i} featured={false} s={s} onInfo={() => onEnter(g)} />)}
        </motion.div>
      </div>
    </div>
  )
}

// ── Hall ─────────────────────────────────────────────────────────
function FeatureNode({ icon, title, sub, featured }: { icon: React.ReactNode; title: string; sub: string; featured?: boolean }) {
  const d = featured ? 120 : 98
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }} style={{ textAlign: 'center', cursor: 'pointer', position: 'relative', zIndex: 2 }}>
      <div style={{ position: 'relative', width: d, height: d, margin: '0 auto 12px' }}>
        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `radial-gradient(circle, rgba(201,169,110,${featured ? 0.28 : 0.16}), transparent 70%)` }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${featured ? 2 : 1}px solid ${featured ? C.gold : C.lineGold}`, background: C.panel2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: featured ? '0 0 30px rgba(201,169,110,0.3), inset 0 0 22px rgba(201,169,110,0.12)' : 'inset 0 0 16px rgba(201,169,110,0.08)' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: featured ? 18 : 15, fontWeight: 600, color: featured ? C.goldLight : C.ink }}>{title}</div>
      <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>{sub}</div>
    </motion.div>
  )
}

function HallView({ guild, s, onLeave }: { guild: GuildView; s: S; onLeave: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: EASE }}
      style={{ border: `1px solid ${C.lineGold}`, borderRadius: 16, overflow: 'hidden', maxWidth: 1180, margin: '22px auto', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${C.line}`, background: C.panel2 }}>
        <button type="button" onClick={onLeave} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>
          <IconChevronLeft size={18} color={C.gold} />{s.back}
        </button>
        <div style={{ display: 'flex', gap: 18, fontSize: 12, color: C.ink }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconCoin size={15} color={C.gold} />152,884,354</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconDiamond size={15} color="#9ec5e3" />1,047</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconShieldChevron size={15} color="#8fce9f" />6,070</span>
        </div>
        <div style={{ display: 'flex', gap: 12, color: C.gold }}><IconBell size={18} /><IconMail size={18} /><IconMessageCircle size={18} /></div>
      </div>

      <div style={{ display: 'flex', minHeight: 420 }}>
        <div style={{ width: 128, borderRight: `1px solid ${C.line}`, padding: '18px 8px', display: 'flex', flexDirection: 'column', gap: 20, background: C.panel2 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, margin: '0 auto 6px', borderRadius: '50%', border: `1px solid ${C.gold}`, background: `radial-gradient(circle, rgba(201,169,110,0.16), ${C.panel} 72%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconDiamond size={24} color={C.goldLight} /></div>
            <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.goldLight }}>Lv.{guild.level} {guild.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{s.checkin} {guild.member_count}/{guild.maxMembers}</div>
          </div>
          <Filigree w="70%" />
          <div style={{ textAlign: 'center', color: C.muted, cursor: 'pointer' }}><IconChecklist size={24} color={C.gold} /><div style={{ fontSize: 10, marginTop: 3 }}>{s.actAct}</div></div>
          <div style={{ textAlign: 'center', color: C.muted, cursor: 'pointer' }}><IconWand size={24} color={C.gold} /><div style={{ fontSize: 10, marginTop: 3 }}>{s.actDecor}</div></div>
          <div style={{ textAlign: 'center', color: C.muted, cursor: 'pointer' }}><IconGift size={24} color={C.gold} /><div style={{ fontSize: 10, marginTop: 3 }}>{s.actDiv}</div></div>
        </div>

        <div style={{ flex: 1, position: 'relative', background: SCENE, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '28px 28px 56px' }}>
          <div style={{ position: 'absolute', inset: 14, border: `1px solid ${C.lineGold}`, borderRadius: 8, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-58%)', opacity: 0.05 }}><IconShieldChevron size={210} color={C.gold} /></div>
          <div style={{ position: 'absolute', left: 60, right: 60, bottom: 44, height: 1, background: `linear-gradient(90deg,transparent,${C.lineGold},transparent)` }} />
          <div style={{ position: 'absolute', top: 22, right: 22, background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 10, padding: '8px 12px', maxWidth: 210, zIndex: 3 }}>
            <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: C.gold }}>Mina</div>
            <div style={{ fontSize: 11, color: C.ink }}>{s.chatMsg}</div>
          </div>
          <FeatureNode icon={<IconBuildingBank size={40} color={C.gold} />} title={s.nVault} sub={s.nVaultSub} />
          <FeatureNode icon={<IconTrophy size={54} color={C.goldLight} />} title={s.nLeague} sub={s.nLeagueSub} featured />
          <FeatureNode icon={<IconPhoto size={40} color={C.gold} />} title={s.nGallery} sub={s.nGallerySub} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: 12, borderTop: `1px solid ${C.line}`, background: C.panel2 }}>
        {[[<IconGavel key="g" size={15} color={C.gold} />, s.auction], [<IconUsers key="u" size={15} color={C.gold} />, s.membersBtn], [<IconMessage2 key="m" size={15} color={C.gold} />, s.chat]].map(([ic, label], i) => (
          <motion.button type="button" key={i} whileHover={{ y: -2 }} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.lineGold}`, borderRadius: 10, padding: '8px 18px', fontSize: 12, color: C.ink, cursor: 'pointer', background: 'transparent' }}>{ic}{label as string}</motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function GuildPage() {
  const { locale } = useLanguage()
  const s = STR[locale === 'vi' ? 'vi' : 'en']
  const [guilds, setGuilds] = useState<GuildView[]>(MOCK)
  const [view, setView] = useState<'finder' | 'hall'>('finder')
  const [active, setActive] = useState<GuildView>(MOCK[1])
  const [createOpen, setCreateOpen] = useState(false)

  const load = () => {
    guildService.list()
      .then((rows) => { if (Array.isArray(rows) && rows.length) setGuilds(rows.map(toView)) })
      .catch(() => { /* giữ MOCK */ })
  }
  useEffect(load, [])

  const enter = (g: GuildView) => { setActive(g); setView('hall') }

  return (
    <div style={{ background: `radial-gradient(80% 50% at 50% 0%, rgba(201,169,110,0.05), transparent 60%), ${C.bg}`, minHeight: 'calc(100vh - 68px)', marginTop: 68, color: C.ink }}>
      <AnimatePresence>
        {createOpen && <CreateGuildModal key="cm" s={s} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load() }} />}
      </AnimatePresence>
      {view === 'finder'
        ? <FinderView guilds={guilds} s={s} onEnter={enter} onRefresh={load} onCreate={() => setCreateOpen(true)} />
        : <HallView guild={active} s={s} onLeave={() => setView('finder')} />}
    </div>
  )
}
