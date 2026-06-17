'use client'
// ─────────────────────────────────────────────────────────────────
//  GuildPage — game-style guild experience cho ArtCurve.
//  2 trạng thái:
//    finder  → Guild Foundation + Recommended (chưa vào guild)
//    hall    → Sảnh guild với các node chức năng (đã vào guild)
//  Tông: Neo-Luxury dark (near-black #0F0E0C + vàng #C9A96E) — KHÔNG nâu.
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

// ── Brand tokens (dark-locked, khớp html.dark trong globals.css) ──
const C = {
  bg:    '#0F0E0C', panel: '#181613', panel2: '#100E0B',
  line:  '#2B2823', lineGold: 'rgba(201,169,110,0.30)',
  ink:   '#F0EBE1', muted: '#8E877B',
  gold:  '#C9A96E', goldLight: '#E8D5B0',
}
const SERIF = "'Cormorant Garamond', Georgia, serif"
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface GuildView extends ApiGuild {
  level: number; weeklyVolume: number; maxMembers: number; acceptance: 'auto' | 'manual'; tag: string
}

const MOCK: GuildView[] = [
  { id:'g1', name:'BlueChipDAO',   description:null, focus:'Collectors',  avatar_color:'#C9A96E', member_count:22, level:8,  weeklyVolume:1240, maxMembers:30, acceptance:'auto',   tag:'Collectors~' },
  { id:'g2', name:'GenesisCircle', description:null, focus:'Blue chip',   avatar_color:'#E8D5B0', member_count:14, level:11, weeklyVolume:3580, maxMembers:27, acceptance:'manual', tag:'Đang tuyển~' },
  { id:'g3', name:'NeoPatrons',    description:null, focus:'Newcomers',   avatar_color:'#C9A96E', member_count:6,  level:3,  weeklyVolume:210,  maxMembers:16, acceptance:'auto',   tag:'Người mới~' },
]

function toView(g: ApiGuild): GuildView {
  return {
    ...g,
    level:        g.level ?? Math.max(1, Math.round((g.member_count ?? 1) / 3)),
    weeklyVolume: g.weekly_volume_eth ?? 0,
    maxMembers:   g.max_members ?? 30,
    acceptance:   g.acceptance ?? 'auto',
    tag:          g.focus ? `${g.focus}~` : 'Mới~',
  }
}

// ── Reusable bits ────────────────────────────────────────────────
function Medallion({ size = 46, children, featured = false }: { size?: number; children: React.ReactNode; featured?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1px solid ${featured ? C.gold : C.lineGold}`,
      background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{children}</div>
  )
}

function Filigree() {
  return (
    <div style={{ position: 'relative', height: 1, background: `linear-gradient(90deg,transparent,${C.lineGold},transparent)`, margin: '12px 0' }}>
      <span style={{ position: 'absolute', left: '50%', top: -3, width: 6, height: 6, marginLeft: -3, transform: 'rotate(45deg)', background: C.gold }} />
    </div>
  )
}

// ── Finder: 1 hàng guild ─────────────────────────────────────────
function GuildRow({ g, featured, onInfo }: { g: GuildView; featured?: boolean; onInfo: () => void }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ borderColor: C.gold }}
      style={{
        display: 'flex', alignItems: 'center', gap: 13, padding: 12, marginBottom: 9,
        borderRadius: 12, background: featured ? '#15120c' : C.panel,
        border: `${featured ? 2 : 1}px solid ${featured ? C.gold : C.line}`,
      }}>
      <Medallion featured={featured}>
        {featured ? <IconPalette size={24} color={C.goldLight} /> : <IconBuildingBank size={24} color={C.gold} />}
      </Medallion>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.ink }}>
          <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: featured ? C.goldLight : C.gold }}>Lv.{g.level}</span>
          {' '}{g.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Khối lượng tuần: {g.weeklyVolume.toLocaleString()} ETH</div>
        <span style={{ display: 'inline-block', marginTop: 4, border: `1px solid ${C.lineGold}`, borderRadius: 20, padding: '1px 10px', fontSize: 10, color: C.gold }}>{g.tag}</span>
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
        Thành viên {g.member_count}/{g.maxMembers}<br />Không giới hạn rank<br />Duyệt: {g.acceptance === 'auto' ? 'Tự động' : 'Thủ công'}
      </div>
      <motion.button type="button" onClick={onInfo} whileTap={{ scale: 0.97 }}
        style={{
          fontFamily: featured ? SERIF : undefined, borderRadius: 9, padding: featured ? '9px 18px' : '9px 16px',
          fontSize: featured ? 13 : 12, fontWeight: featured ? 600 : 400, cursor: 'pointer',
          color: featured ? '#221905' : C.ink,
          background: featured ? C.gold : 'transparent',
          border: `1px solid ${featured ? C.gold : C.lineGold}`,
        }}>Info</motion.button>
    </motion.div>
  )
}

// ── Finder view ──────────────────────────────────────────────────
function FinderView({ guilds, onEnter }: { guilds: GuildView[]; onEnter: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18, padding: 18, maxWidth: 1180, margin: '0 auto' }}>
      {/* Foundation */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, padding: '20px 18px', textAlign: 'center', background: C.panel }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, letterSpacing: 2, color: C.gold }}>Guild Foundation</div>
        <div style={{ width: 112, height: 112, margin: '16px auto', borderRadius: '50%', border: `1px solid ${C.lineGold}`, background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconDiamond size={52} color={C.gold} />
        </div>
        <Filigree />
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.7, margin: '0 0 16px' }}>
          Lập hội của riêng bạn hoặc gia nhập một guild sưu tầm. Cùng giao dịch để nhận thưởng tập thể mỗi tuần.
        </p>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginBottom: 16 }}>
          {[<IconCoin key="a" size={20} color={C.gold} />, <IconDroplet key="b" size={20} color="#9ec5e3" />, <IconTrendingUp key="c" size={20} color="#8fce9f" />, <IconShieldChevron key="d" size={20} color={C.goldLight} />].map((ic, i) => (
            <div key={i} style={{ width: 42, height: 42, borderRadius: 9, border: `1px solid ${C.lineGold}`, background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.lineGold}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px' }}>
            <IconCoin size={16} color={C.gold} />
            <span style={{ fontSize: 14, color: C.ink, letterSpacing: 0.3 }}>{GUILD_FOUNDATION_FEE_ETH} ETH</span>
          </div>
          <motion.button type="button" onClick={onEnter} whileTap={{ scale: 0.97 }}
            style={{ fontFamily: SERIF, background: C.gold, color: '#221905', fontSize: 15, fontWeight: 600, letterSpacing: 1, padding: '11px 22px', cursor: 'pointer', border: 'none' }}>
            Lập Guild
          </motion.button>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 8 }}>Phí một lần · chống spam</div>
      </div>

      {/* Recommended */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, letterSpacing: 1, color: C.gold }}>Đề xuất</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${C.lineGold}`, borderRadius: 9, padding: '6px 12px', fontSize: 12, color: C.ink }}>
            <IconMail size={15} color={C.gold} />Lời mời
          </span>
        </div>
        <Filigree />
        <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${C.line}`, borderRadius: 9, padding: '7px 11px', fontSize: 11, color: C.muted }}>Mở: Tùy ý <IconChevronDown size={14} /></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${C.line}`, borderRadius: 9, padding: '7px 11px', fontSize: 11, color: C.muted }}><IconHash size={14} color={C.gold} />Tag</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${C.line}`, borderRadius: 9, padding: '7px 11px', fontSize: 11, color: C.muted }}><IconSearch size={14} color={C.gold} />Tìm</span>
          <span style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.line}`, borderRadius: 9, padding: '7px 10px', color: C.muted }}><IconRefresh size={14} color={C.gold} /></span>
        </div>
        <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show">
          {guilds.map((g, i) => (
            <GuildRow key={g.id} g={g} featured={i === 1} onInfo={onEnter} />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ── Hall: node chức năng ─────────────────────────────────────────
function FeatureNode({ icon, title, sub, featured }: { icon: React.ReactNode; title: string; sub: string; featured?: boolean }) {
  return (
    <motion.div whileHover={{ y: -4 }} style={{ textAlign: 'center', cursor: 'pointer' }}>
      <div style={{
        width: featured ? 96 : 82, height: featured ? 96 : 82, margin: '0 auto 8px', borderRadius: '50%',
        border: `${featured ? 2 : 1}px solid ${featured ? C.gold : C.lineGold}`, background: C.panel2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ fontFamily: SERIF, fontSize: featured ? 16 : 14, fontWeight: 600, color: featured ? C.goldLight : C.ink }}>{title}</div>
      <div style={{ fontSize: 10.5, color: C.muted }}>{sub}</div>
    </motion.div>
  )
}

function RailItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ textAlign: 'center', color: C.muted, cursor: 'pointer' }}>
      {icon}<div style={{ fontSize: 10, marginTop: 3 }}>{label}</div>
    </div>
  )
}

function HallView({ guild, onLeave }: { guild: GuildView; onLeave: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: EASE }}
      style={{ border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden', maxWidth: 1180, margin: '18px auto', background: C.bg }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${C.line}`, background: C.panel2 }}>
        <button type="button" onClick={onLeave} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>
          <IconChevronLeft size={18} color={C.gold} />Guild
        </button>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.ink }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconCoin size={15} color={C.gold} />152,884,354</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconDiamond size={15} color="#9ec5e3" />1,047</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconShieldChevron size={15} color="#8fce9f" />6,070</span>
        </div>
        <div style={{ display: 'flex', gap: 11, color: C.gold }}><IconBell size={18} /><IconMail size={18} /><IconMessageCircle size={18} /></div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', minHeight: 320 }}>
        {/* Rail */}
        <div style={{ width: 124, borderRight: `1px solid ${C.line}`, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 18, background: C.panel2 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, margin: '0 auto 4px', borderRadius: '50%', border: `1px solid ${C.lineGold}`, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconDiamond size={23} color={C.gold} /></div>
            <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.gold }}>Lv.{guild.level} {guild.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>Điểm danh {guild.member_count}/{guild.maxMembers}</div>
          </div>
          <RailItem icon={<IconChecklist size={23} color={C.gold} />} label="Hoạt động Guild" />
          <RailItem icon={<IconWand size={23} color={C.gold} />} label="Trang trí Gallery" />
          <RailItem icon={<IconGift size={23} color={C.gold} />} label="Cổ tức tuần" />
        </div>

        {/* Hall floor */}
        <div style={{ flex: 1, position: 'relative', padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          <div style={{ position: 'absolute', top: 14, right: 14, background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 10, padding: '7px 11px', maxWidth: 200 }}>
            <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: C.gold }}>Mina</div>
            <div style={{ fontSize: 11, color: C.ink }}>gom đủ vốn rồi, vào lệnh thôi</div>
          </div>
          <FeatureNode icon={<IconBuildingBank size={38} color={C.gold} />} title="Kho chung" sub="Đồng sở hữu tác phẩm" />
          <FeatureNode icon={<IconTrophy size={46} color={C.goldLight} />} title="Giải đấu Guild" sub="Đua khối lượng theo mùa" featured />
          <FeatureNode icon={<IconPhoto size={38} color={C.gold} />} title="Phòng tuyển chọn" sub="BST chung của hội" />
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 11, padding: 11, borderTop: `1px solid ${C.line}`, background: C.panel2 }}>
        {[[<IconGavel key="g" size={15} color={C.gold} />, 'Đấu giá Guild'], [<IconUsers key="u" size={15} color={C.gold} />, 'Thành viên'], [<IconMessage2 key="m" size={15} color={C.gold} />, 'Chat hội']].map(([ic, label], i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.lineGold}`, borderRadius: 10, padding: '7px 16px', fontSize: 12, color: C.ink, cursor: 'pointer' }}>{ic}{label as string}</span>
        ))}
      </div>
    </motion.div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function GuildPage() {
  const [guilds, setGuilds]   = useState<GuildView[]>(MOCK)
  const [view, setView]       = useState<'finder' | 'hall'>('finder')
  const [active, setActive]   = useState<GuildView>(MOCK[1])

  useEffect(() => {
    guildService.list()
      .then((rows) => { if (Array.isArray(rows) && rows.length) setGuilds(rows.map(toView)) })
      .catch(() => { /* giữ MOCK khi backend chưa bật */ })
  }, [])

  const enter = (g: GuildView) => { setActive(g); setView('hall') }

  return (
    <div style={{ background: C.bg, minHeight: 'calc(100vh - 68px)', marginTop: 68, color: C.ink }}>
      {view === 'finder'
        ? <FinderView guilds={guilds} onEnter={() => enter(guilds[1] ?? guilds[0])} />
        : <HallView guild={active} onLeave={() => setView('finder')} />}
    </div>
  )
}
