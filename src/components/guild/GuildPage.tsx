'use client'
// ─────────────────────────────────────────────────────────────────
//  GuildPage — game-style guild experience cho ArtCurve.
//  finder → Guild Foundation + Recommended ; hall → sảnh guild.
//  Tông Neo-Luxury dark (#0F0E0C + vàng #C9A96E) — ánh sáng bằng quầng
//  vàng low-alpha trên nền near-black (KHÔNG dùng surface nâu).
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  IconDiamond, IconCoin, IconDroplet, IconTrendingUp, IconShieldChevron,
  IconMail, IconHash, IconSearch, IconRefresh, IconBuildingBank, IconPalette,
  IconChevronLeft, IconChevronDown, IconBell, IconMessageCircle,
  IconChecklist, IconWand, IconGift, IconTrophy, IconPhoto, IconGavel,
  IconUsers, IconMessage2,
} from '@tabler/icons-react'
import { guildService, GUILD_FOUNDATION_FEE_ETH, type ApiGuild } from '@/services/guild.service'

const C = {
  bg: '#0F0E0C', panel: '#181613', panel2: '#100E0B',
  line: '#2B2823', lineGold: 'rgba(201,169,110,0.30)',
  ink: '#F0EBE1', muted: '#8E877B', gold: '#C9A96E', goldLight: '#E8D5B0',
}
const SERIF = "'Cormorant Garamond', Georgia, serif"
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
// Quầng sáng nền (skylight + floor + vignette) — chiều sâu không cần ảnh
const SCENE = `radial-gradient(55% 50% at 50% -6%, rgba(201,169,110,0.18), transparent 60%),`
  + `radial-gradient(70% 32% at 50% 112%, rgba(201,169,110,0.10), transparent 62%),`
  + `radial-gradient(120% 120% at 50% 45%, transparent 52%, rgba(0,0,0,0.6)), ${C.bg}`

interface GuildView extends ApiGuild {
  level: number; weeklyVolume: number; maxMembers: number; acceptance: 'auto' | 'manual'; tag: string
}

const MOCK: GuildView[] = [
  { id:'g1', name:'BlueChipDAO',   description:null, focus:'Collectors', avatar_color:C.gold,      member_count:22, level:8,  weeklyVolume:1240, maxMembers:30, acceptance:'auto',   tag:'Collectors~' },
  { id:'g2', name:'GenesisCircle', description:null, focus:'Blue chip',  avatar_color:C.goldLight, member_count:14, level:11, weeklyVolume:3580, maxMembers:27, acceptance:'manual', tag:'Đang tuyển~' },
  { id:'g3', name:'NeoPatrons',    description:null, focus:'Newcomers',  avatar_color:C.gold,      member_count:6,  level:3,  weeklyVolume:210,  maxMembers:16, acceptance:'auto',   tag:'Người mới~' },
]

function toView(g: ApiGuild): GuildView {
  return {
    ...g,
    level: g.level ?? Math.max(1, Math.round((g.member_count ?? 1) / 3)),
    weeklyVolume: g.weekly_volume_eth ?? 0,
    maxMembers: g.max_members ?? 30,
    acceptance: g.acceptance ?? 'auto',
    tag: g.focus ? `${g.focus}~` : 'Mới~',
  }
}

function Filigree({ w = '100%' }: { w?: string }) {
  return (
    <div style={{ position: 'relative', height: 1, width: w, margin: '12px auto', background: `linear-gradient(90deg,transparent,${C.lineGold},transparent)` }}>
      <span style={{ position: 'absolute', left: '50%', top: -3, width: 6, height: 6, marginLeft: -3, transform: 'rotate(45deg)', background: C.gold }} />
    </div>
  )
}

// 4 góc kim cương cho khung trang trí
function Corners() {
  const dot = { position: 'absolute' as const, width: 7, height: 7, transform: 'rotate(45deg)', background: C.gold, opacity: 0.8 }
  return (
    <>
      <span style={{ ...dot, top: -4, left: -4 }} /><span style={{ ...dot, top: -4, right: -4 }} />
      <span style={{ ...dot, bottom: -4, left: -4 }} /><span style={{ ...dot, bottom: -4, right: -4 }} />
    </>
  )
}

// ── Finder row ───────────────────────────────────────────────────
function GuildRow({ g, featured, onInfo }: { g: GuildView; featured?: boolean; onInfo: () => void }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ borderColor: C.gold, y: -2 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 13, marginBottom: 10, borderRadius: 12,
        background: featured ? 'linear-gradient(180deg,#1a160e,#121009)' : C.panel,
        border: `${featured ? 2 : 1}px solid ${featured ? C.gold : C.line}`,
        boxShadow: featured ? '0 0 22px rgba(201,169,110,0.14)' : 'none',
      }}>
      <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${featured ? C.gold : C.lineGold}`, background: `radial-gradient(circle, rgba(201,169,110,0.10), ${C.panel2} 72%)` }}>
        {featured ? <IconPalette size={25} color={C.goldLight} /> : <IconBuildingBank size={25} color={C.gold} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.ink }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: featured ? C.goldLight : C.gold }}>Lv.{g.level}</span>{' '}{g.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Khối lượng tuần: {g.weeklyVolume.toLocaleString()} ETH</div>
        <span style={{ display: 'inline-block', marginTop: 5, border: `1px solid ${C.lineGold}`, borderRadius: 20, padding: '1px 10px', fontSize: 10, color: C.gold }}>{g.tag}</span>
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
        Thành viên {g.member_count}/{g.maxMembers}<br />Không giới hạn rank<br />Duyệt: {g.acceptance === 'auto' ? 'Tự động' : 'Thủ công'}
      </div>
      <motion.button type="button" onClick={onInfo} whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}
        style={{ fontFamily: featured ? SERIF : undefined, borderRadius: 9, padding: featured ? '10px 20px' : '9px 16px',
          fontSize: featured ? 14 : 12, fontWeight: featured ? 600 : 400, cursor: 'pointer',
          color: featured ? '#221905' : C.ink, background: featured ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : 'transparent',
          border: `1px solid ${featured ? C.gold : C.lineGold}` }}>Info</motion.button>
    </motion.div>
  )
}

// ── Finder view ──────────────────────────────────────────────────
function FinderView({ guilds, onEnter }: { guilds: GuildView[]; onEnter: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, padding: '26px 20px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ border: `1px solid ${C.lineGold}`, borderRadius: 16, padding: '22px 18px', textAlign: 'center',
        background: `radial-gradient(80% 50% at 50% 0%, rgba(201,169,110,0.10), transparent 60%), ${C.panel}` }}>
        <div style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: 2, color: C.goldLight }}>Guild Foundation</div>
        <Filigree w="62%" />
        <div style={{ position: 'relative', width: 132, height: 132, margin: '14px auto' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.22), transparent 68%)' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1px solid ${C.lineGold}` }} />
          <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', border: `1px solid ${C.gold}`, background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 24px rgba(201,169,110,0.18)' }}>
            <IconDiamond size={50} color={C.goldLight} />
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.75, margin: '14px 0 16px' }}>
          Lập hội của riêng bạn hoặc gia nhập một guild sưu tầm. Cùng giao dịch để nhận thưởng tập thể mỗi tuần.
        </p>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginBottom: 16 }}>
          {[<IconCoin key="a" size={20} color={C.gold} />, <IconDroplet key="b" size={20} color="#9ec5e3" />, <IconTrendingUp key="c" size={20} color="#8fce9f" />, <IconShieldChevron key="d" size={20} color={C.goldLight} />].map((ic, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.lineGold}`, background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.lineGold}`, borderRadius: 11, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '11px 12px' }}>
            <IconCoin size={16} color={C.gold} /><span style={{ fontSize: 14, color: C.ink, letterSpacing: 0.3 }}>{GUILD_FOUNDATION_FEE_ETH} ETH</span>
          </div>
          <motion.button type="button" onClick={onEnter} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ fontFamily: SERIF, background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, color: '#221905', fontSize: 15, fontWeight: 600, letterSpacing: 1, padding: '12px 24px', cursor: 'pointer', border: 'none' }}>Lập Guild</motion.button>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 9 }}>Phí một lần · chống spam</div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: 1, color: C.goldLight }}>Đề xuất</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${C.lineGold}`, borderRadius: 9, padding: '7px 13px', fontSize: 12, color: C.ink }}><IconMail size={15} color={C.gold} />Lời mời</span>
        </div>
        <Filigree />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 11, color: C.muted }}>Mở: Tùy ý <IconChevronDown size={14} /></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 11, color: C.muted }}><IconHash size={14} color={C.gold} />Tag</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 11, color: C.muted }}><IconSearch size={14} color={C.gold} />Tìm</span>
          <span style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 11px', color: C.muted }}><IconRefresh size={14} color={C.gold} /></span>
        </div>
        <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show">
          {guilds.map((g, i) => <GuildRow key={g.id} g={g} featured={i === 1} onInfo={onEnter} />)}
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

function RailItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <motion.div whileHover={{ x: 2 }} style={{ textAlign: 'center', color: active ? C.gold : C.muted, cursor: 'pointer', padding: '4px 0' }}>
      {icon}<div style={{ fontSize: 10, marginTop: 3 }}>{label}</div>
    </motion.div>
  )
}

function HallView({ guild, onLeave }: { guild: GuildView; onLeave: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: EASE }}
      style={{ border: `1px solid ${C.lineGold}`, borderRadius: 16, overflow: 'hidden', maxWidth: 1180, margin: '22px auto', background: C.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${C.line}`, background: C.panel2 }}>
        <button type="button" onClick={onLeave} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>
          <IconChevronLeft size={18} color={C.gold} />Guild
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
            <div style={{ fontSize: 10, color: C.muted }}>Điểm danh {guild.member_count}/{guild.maxMembers}</div>
          </div>
          <Filigree w="70%" />
          <RailItem icon={<IconChecklist size={24} color={C.gold} />} label="Hoạt động Guild" />
          <RailItem icon={<IconWand size={24} color={C.gold} />} label="Trang trí Gallery" />
          <RailItem icon={<IconGift size={24} color={C.gold} />} label="Cổ tức tuần" />
        </div>

        <div style={{ flex: 1, position: 'relative', background: SCENE, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '28px 28px 56px' }}>
          {/* khung trang trí */}
          <div style={{ position: 'absolute', inset: 14, border: `1px solid ${C.lineGold}`, borderRadius: 8, pointerEvents: 'none' }}><Corners /></div>
          {/* emblem mờ sau node trung tâm */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-58%)', opacity: 0.05 }}><IconShieldChevron size={210} color={C.gold} /></div>
          {/* sàn */}
          <div style={{ position: 'absolute', left: 60, right: 60, bottom: 44, height: 1, background: `linear-gradient(90deg,transparent,${C.lineGold},transparent)` }} />
          {/* chat bubble */}
          <div style={{ position: 'absolute', top: 22, right: 22, background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 10, padding: '8px 12px', maxWidth: 210, zIndex: 3 }}>
            <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: C.gold }}>Mina</div>
            <div style={{ fontSize: 11, color: C.ink }}>gom đủ vốn rồi, vào lệnh thôi</div>
          </div>

          <FeatureNode icon={<IconBuildingBank size={40} color={C.gold} />} title="Kho chung" sub="Đồng sở hữu tác phẩm" />
          <FeatureNode icon={<IconTrophy size={54} color={C.goldLight} />} title="Giải đấu Guild" sub="Đua khối lượng theo mùa" featured />
          <FeatureNode icon={<IconPhoto size={40} color={C.gold} />} title="Phòng tuyển chọn" sub="BST chung của hội" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: 12, borderTop: `1px solid ${C.line}`, background: C.panel2 }}>
        {[[<IconGavel key="g" size={15} color={C.gold} />, 'Đấu giá Guild'], [<IconUsers key="u" size={15} color={C.gold} />, 'Thành viên'], [<IconMessage2 key="m" size={15} color={C.gold} />, 'Chat hội']].map(([ic, label], i) => (
          <motion.span key={i} whileHover={{ y: -2, borderColor: C.gold }} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.lineGold}`, borderRadius: 10, padding: '8px 18px', fontSize: 12, color: C.ink, cursor: 'pointer' }}>{ic}{label as string}</motion.span>
        ))}
      </div>
    </motion.div>
  )
}

export function GuildPage() {
  const [guilds, setGuilds] = useState<GuildView[]>(MOCK)
  const [view, setView] = useState<'finder' | 'hall'>('finder')
  const [active, setActive] = useState<GuildView>(MOCK[1])

  useEffect(() => {
    guildService.list()
      .then((rows) => { if (Array.isArray(rows) && rows.length) setGuilds(rows.map(toView)) })
      .catch(() => { /* giữ MOCK khi backend chưa bật */ })
  }, [])

  const enter = (g: GuildView) => { setActive(g); setView('hall') }

  return (
    <div style={{ background: `radial-gradient(80% 50% at 50% 0%, rgba(201,169,110,0.05), transparent 60%), ${C.bg}`, minHeight: 'calc(100vh - 68px)', marginTop: 68, color: C.ink }}>
      {view === 'finder'
        ? <FinderView guilds={guilds} onEnter={() => enter(guilds[1] ?? guilds[0])} />
        : <HallView guild={active} onLeave={() => setView('finder')} />}
    </div>
  )
}
