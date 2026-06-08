'use client'
// ─────────────────────────────────────────────────────────────────
//  GuildPage.tsx  —  Art community groups & collector clubs
//  Added: Chat tab, Members tab, Holdings tab, Create Guild modal
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────
interface Guild {
  id:       string
  name:     string
  tagline:  string
  members:  number
  focus:    string
  tier:     'Founding' | 'Active' | 'Growing'
  color:    string
  cover:    string
  joined:   boolean
  holdings: string
  tags:     string[]
}

interface GuildPost {
  id:          string
  guildName:   string
  author:      string
  authorColor: string
  content:     string
  likes:       number
  ts:          string
  type:        'post' | 'collect' | 'tip' | 'milestone'
}

interface GuildMember {
  rank:   number
  name:   string
  addr:   string
  tier:   'Founder' | 'Patron' | 'Collector'
  tokens: number
  joined: string
  color:  string
}

interface CollectiveHolding {
  ticker:  string
  title:   string
  members: number
  qty:     number
  value:   string
  color:   string
}

interface ChatMsg {
  id:    string
  user:  string
  msg:   string
  color: string
}

type DetailTab = 'activity' | 'chat' | 'members' | 'holdings'

// ── Data ──────────────────────────────────────────────────────────
const GUILDS: Guild[] = [
  { id:'g1', name:'The Pale Archive',   tagline:'Collectors of muted tones and negative space', members:84,  focus:'Minimalist', tier:'Founding', color:'#a78bfa', cover:'linear-gradient(145deg,#1a1a2e 0%,#2d2d4a 100%)', joined:true,  holdings:'42.3 ETH', tags:['Minimalist','Monochrome','Architecture'] },
  { id:'g2', name:'After Midnight',     tagline:'Nocturnal art — darkness as medium',           members:156, focus:'Dark Art',   tier:'Founding', color:'#60a5fa', cover:'linear-gradient(145deg,#0d1520 0%,#1a2a40 100%)', joined:true,  holdings:'88.7 ETH', tags:['Nocturnal','Atmospheric','Blue Hour']   },
  { id:'g3', name:'Bloom Collective',   tagline:'Generative & digital art enthusiasts',         members:203, focus:'Generative', tier:'Active',   color:'#4ade80', cover:'linear-gradient(145deg,#0a2818 0%,#163d24 100%)', joined:false, holdings:'31.1 ETH', tags:['Generative','p5.js','Digital']         },
  { id:'g4', name:'Old Masters Reborn', tagline:'Classical technique in the Web3 era',          members:67,  focus:'Classical',  tier:'Active',   color:'#D4AF37', cover:'linear-gradient(145deg,#1c1410 0%,#2e1f10 100%)', joined:false, holdings:'19.4 ETH', tags:['Classical','Oil','Masters']            },
  { id:'g5', name:'Signal / Noise',     tagline:'Experimental, glitch, and new media art',     members:91,  focus:'Experimental',tier:'Growing', color:'#f87171', cover:'linear-gradient(145deg,#200a0a 0%,#3d1515 100%)', joined:false, holdings:'8.2 ETH',  tags:['Glitch','Experimental','New Media']    },
  { id:'g6', name:'Convergence',        tagline:'Multi-disciplinary artists and collectors',    members:118, focus:'Mixed Media', tier:'Growing', color:'#38bdf8', cover:'linear-gradient(145deg,#061520 0%,#0c2030 100%)', joined:false, holdings:'15.6 ETH', tags:['Mixed Media','Collaborative','Cross-genre'] },
]

const FEED: GuildPost[] = [
  { id:'p1', guildName:'The Pale Archive',   author:'soo_ah.eth',       authorColor:'#a78bfa', content:'finishing the third panel of Pale Architecture tonight — come watch the stream',          likes:18, ts:'3m',  type:'post'      },
  { id:'p2', guildName:'After Midnight',     author:'ivan_sorokin.eth', authorColor:'#60a5fa', content:'the nocturne series feels different at night. the way light disappears in this piece',    likes:34, ts:'11m', type:'post'      },
  { id:'p3', guildName:'The Pale Archive',   author:'markus.eth',       authorColor:'#D4AF37', content:'collected 0.8 $PALE today. accumulation phase is almost done',                           likes:9,  ts:'19m', type:'collect'   },
  { id:'p4', guildName:'Bloom Collective',   author:'aiko.base',        authorColor:'#4ade80', content:'dropped a new generative series. 500 unique variations, each one seeds differently',     likes:41, ts:'26m', type:'post'      },
  { id:'p5', guildName:'Old Masters Reborn', author:'böcklin.eth',      authorColor:'#D4AF37', content:'Self-Portrait with Death is now 60% through the bonding curve 🎓',                       likes:27, ts:'39m', type:'milestone' },
  { id:'p6', guildName:'After Midnight',     author:'yui_n.base',       authorColor:'#f9a8d4', content:'just tipped 0.2 ETH to the Nocturne stream. this work deserves more eyes',              likes:11, ts:'51m', type:'tip'       },
  { id:'p7', guildName:'The Pale Archive',   author:'lena_v.base',      authorColor:'#60a5fa', content:'anyone want to do a group stream watch this Friday evening?',                            likes:23, ts:'1h',  type:'post'      },
  { id:'p8', guildName:'Signal / Noise',     author:'paulo_r.base',     authorColor:'#f87171', content:'new glitch series drops next week. chaos as composition. nothing is an accident',        likes:15, ts:'1h',  type:'post'      },
]

const MEMBERS_BY_GUILD: Record<string, GuildMember[]> = {
  g1: [
    { rank:1, name:'soo_ah.eth',     addr:'0x4f2…a91', tier:'Founder',   tokens:12, joined:'Mar 2024', color:'#a78bfa' },
    { rank:2, name:'markus.eth',     addr:'0x8d3…f44', tier:'Founder',   tokens:9,  joined:'Mar 2024', color:'#D4AF37' },
    { rank:3, name:'lena_v.base',    addr:'0x1a9…c33', tier:'Patron',    tokens:6,  joined:'Apr 2024', color:'#60a5fa' },
    { rank:4, name:'böcklin.eth',    addr:'0x7e1…b22', tier:'Collector', tokens:4,  joined:'May 2024', color:'#D4AF37' },
    { rank:5, name:'yui_n.base',     addr:'0x2b5…d81', tier:'Collector', tokens:3,  joined:'Jun 2024', color:'#f9a8d4' },
  ],
  g2: [
    { rank:1, name:'ivan_sorokin.eth',addr:'0x9c4…e17', tier:'Founder',  tokens:15, joined:'Mar 2024', color:'#60a5fa' },
    { rank:2, name:'yui_n.base',     addr:'0x2b5…d81', tier:'Patron',    tokens:11, joined:'Apr 2024', color:'#f9a8d4' },
    { rank:3, name:'aiko.base',      addr:'0x3f7…a04', tier:'Collector', tokens:8,  joined:'May 2024', color:'#4ade80' },
  ],
}

const HOLDINGS_BY_GUILD: Record<string, CollectiveHolding[]> = {
  g1: [
    { ticker:'$PALE',    title:'Pale Architecture',      members:62, qty:8.42,  value:'22.8 ETH', color:'#a78bfa' },
    { ticker:'$THRESH',  title:'Threshold Fragment',     members:41, qty:3.10,  value:'9.7 ETH',  color:'#D4AF37' },
    { ticker:'$BLOOM',   title:'Bloom & Blade',          members:28, qty:12.50, value:'6.5 ETH',  color:'#4ade80' },
    { ticker:'$DISS',    title:'Dissolution Study',      members:18, qty:5.20,  value:'3.3 ETH',  color:'#60a5fa' },
  ],
  g2: [
    { ticker:'$NOCTURNE',title:'Nocturne at the Bridge', members:88, qty:44.20, value:'54.1 ETH', color:'#38bdf8' },
    { ticker:'$DISS',    title:'Dissolution Study',      members:54, qty:22.30, value:'21.8 ETH', color:'#60a5fa' },
    { ticker:'$GHOST',   title:'Ghost of the Meridian',  members:31, qty:15.60, value:'9.5 ETH',  color:'#94a3b8' },
    { ticker:'$AMBER',   title:'Amber Protocol',         members:20, qty:8.80,  value:'3.3 ETH',  color:'#fb923c' },
  ],
}

const CHAT_SEED: ChatMsg[] = [
  { id:'c1', user:'markus.eth',    msg:'did you see the new soo_ah stream? incredible',         color:'#D4AF37' },
  { id:'c2', user:'lena_v.base',   msg:'$PALE accumulation phase almost done 👀',               color:'#60a5fa' },
  { id:'c3', user:'böcklin.eth',   msg:'I\'ve been saying this piece would go to Migration',    color:'#D4AF37' },
  { id:'c4', user:'soo_ah.eth',    msg:'thank you all 🙏 streaming again tonight',              color:'#a78bfa' },
  { id:'c5', user:'yui_n.base',    msg:'count me in for the group watch Friday',                color:'#f9a8d4' },
]

const CHAT_INCOMING = [
  { user:'markus.eth',    msg:'anyone got the tip link?',              color:'#D4AF37'               },
  { user:'aiko.base',     msg:'just minted a new piece ✨',            color:'#4ade80'               },
  { user:'0x1a9…c33',    msg:'accumulation phase almost done',        color:'rgba(255,255,255,0.38)' },
  { user:'lena_v.base',   msg:'stream starting in 10 min',            color:'#60a5fa'               },
  { user:'böcklin.eth',   msg:'legendary work from soo_ah as always', color:'#D4AF37'               },
]

const TIER_COLOR: Record<string, string> = { Founding:'#D4AF37', Active:'#a78bfa', Growing:'#4ade80' }
const MEMBER_TIER_COLOR: Record<string, string> = { Founder:'#D4AF37', Patron:'#a78bfa', Collector:'rgba(255,255,255,0.45)' }

const POST_ICON: Record<GuildPost['type'], string> = { post:'◎', collect:'◆', tip:'✦', milestone:'⬡' }
const POST_COLOR: Record<GuildPost['type'], string> = { post:'rgba(255,255,255,0.3)', collect:'#D4AF37', tip:'#4ade80', milestone:'#a78bfa' }

const EASE: [number,number,number,number] = [0.215,0.61,0.355,1.0]

const CARD_V = {
  hidden: { opacity:0, y:18 },
  show:   { opacity:1, y:0, transition:{ type:'tween' as const, duration:0.42, ease:EASE } },
}
const LIST_V = {
  hidden: { opacity:0 },
  show:   { opacity:1, transition:{ staggerChildren:0.065, delayChildren:0.05 } },
}

// ─────────────────────────────────────────────────────────────────
//  Guild card
// ─────────────────────────────────────────────────────────────────
function GuildCard({ guild, selected, onClick }: {
  guild: Guild; selected: boolean; onClick: () => void
}) {
  const { t } = useLanguage()
  return (
    <motion.div variants={CARD_V} onClick={onClick}
      className="cursor-pointer overflow-hidden"
      style={{ border: selected ? `1px solid ${guild.color}45` : '1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.42)' }}
      whileHover={{ borderColor:`${guild.color}28` }}>
      <div className="relative" style={{ height:52, background:guild.cover }}>
        {guild.joined && (
          <div className="absolute top-2 right-2 font-mono text-[6.5px] px-1.5 py-0.5"
            style={{ background:`${guild.color}18`, color:guild.color, border:`1px solid ${guild.color}28` }}>
            {t.guild.joined}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-8"
          style={{ background:'linear-gradient(to top,rgba(0,0,0,0.75),transparent)' }}/>
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-sans text-[10px] font-semibold leading-tight"
              style={{ color:'rgba(255,255,255,0.85)', letterSpacing:'-0.01em' }}>{guild.name}</div>
            <div className="font-sans text-[7.5px] mt-0.5 leading-snug"
              style={{ color:'rgba(255,255,255,0.35)' }}>{guild.tagline}</div>
          </div>
          <span className="font-mono text-[6.5px] px-1.5 py-0.5 shrink-0 mt-0.5"
            style={{ color:TIER_COLOR[guild.tier], border:`1px solid ${TIER_COLOR[guild.tier]}28`, background:`${TIER_COLOR[guild.tier]}0d` }}>
            {guild.tier}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background:guild.color }}/>
            <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.32)' }}>
              {guild.members} members
            </span>
          </div>
          <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.22)' }}>
            {guild.holdings}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Activity tab content
// ─────────────────────────────────────────────────────────────────
function ActivityTab() {
  const { t } = useLanguage()
  return (
    <div className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.05) transparent' }}>
      <div className="px-5 py-1">
        {FEED.map(post => (
          <div key={post.id} className="flex items-start gap-3 py-3"
            style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <span className="shrink-0 text-[11px] mt-0.5" style={{ color:POST_COLOR[post.type] }}>
              {POST_ICON[post.type]}
            </span>
            <div className="size-6 rounded-full shrink-0 flex items-center justify-center font-mono text-[8px] font-bold"
              style={{ background:`${post.authorColor}12`, border:`1px solid ${post.authorColor}30`, color:post.authorColor }}>
              {post.author[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[8.5px] font-semibold" style={{ color:'rgba(255,255,255,0.72)' }}>
                  {post.author}
                </span>
                <span className="font-mono text-[7px] px-1.5 py-0.5"
                  style={{ color:'rgba(255,255,255,0.22)', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)' }}>
                  {post.guildName}
                </span>
                <span className="font-mono text-[7px] ml-auto" style={{ color:'rgba(255,255,255,0.2)' }}>{post.ts}</span>
              </div>
              <div className="font-sans text-[8.5px] leading-snug" style={{ color:'rgba(255,255,255,0.52)' }}>
                {post.content}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <button type="button" className="flex items-center gap-1 font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.22)' }}>
                  ♡ {post.likes}
                </button>
                <button type="button" className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.16)' }}>
                  {t.guild.reply}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Chat tab content
// ─────────────────────────────────────────────────────────────────
function ChatTab({ guild }: { guild: Guild }) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<ChatMsg[]>(CHAT_SEED)
  const [input, setInput] = useState('')

  useEffect(() => {
    let idx = 0
    const schedule = () => {
      const delay = 4500 + Math.random() * 4000
      return setTimeout(() => {
        const m = CHAT_INCOMING[idx % CHAT_INCOMING.length]
        setMessages(prev => [...prev.slice(-40), { id:`gc-${Date.now()}-${idx}`, ...m }])
        idx++
        schedule()
      }, delay)
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [guild.id])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2"
        style={{ scrollbarWidth:'none' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
              transition={{ type:'tween', duration:0.18 }}
              className="flex items-start gap-2">
              <div className="size-5 rounded-full shrink-0 flex items-center justify-center font-mono text-[7px] font-bold mt-0.5"
                style={{ background:`${msg.color}15`, border:`1px solid ${msg.color}30`, color:msg.color }}>
                {msg.user[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[7.5px] font-semibold" style={{ color:msg.color }}>
                  {msg.user}
                </span>
                <span className="font-sans text-[8px] ml-1.5" style={{ color:'rgba(255,255,255,0.5)' }}>
                  {msg.msg}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="px-4 py-2.5 shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2"
          style={{ border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', padding:'5px 10px' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder={t.guild.chatPlaceholder.replace('{name}', guild.name)}
            className="flex-1 bg-transparent outline-none font-sans text-[8.5px] placeholder:opacity-25"
            style={{ color:'rgba(255,255,255,0.7)' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim()) {
                setMessages(prev => [...prev.slice(-40), { id:`me-${Date.now()}`, user:'you', msg:input.trim(), color:'#D4AF37' }])
                setInput('')
              }
            }}/>
          <span className="font-mono text-[7px] shrink-0" style={{ color:'rgba(255,255,255,0.18)' }}>↵</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Members tab content
// ─────────────────────────────────────────────────────────────────
function MembersTab({ guild }: { guild: Guild }) {
  const { t } = useLanguage()
  const members = MEMBERS_BY_GUILD[guild.id] ?? []
  const extra = guild.members - members.length

  return (
    <div className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.05) transparent' }}>
      <div className="px-5 py-2">
        {members.map(m => (
          <div key={m.rank} className="flex items-center gap-3 py-2.5"
            style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <span className="font-mono text-[8px] shrink-0" style={{ color:'rgba(255,255,255,0.2)', width:18 }}>
              {m.rank}
            </span>
            <div className="size-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[9px] font-bold"
              style={{ background:`${m.color}15`, border:`1.5px solid ${m.color}35`, color:m.color }}>
              {m.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] font-semibold" style={{ color:'rgba(255,255,255,0.72)' }}>{m.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[7px]" style={{ color:MEMBER_TIER_COLOR[m.tier] }}>{m.tier}</span>
                <span className="font-mono text-[6.5px]" style={{ color:'rgba(255,255,255,0.18)' }}>joined {m.joined}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-[9px] font-semibold" style={{ color:'rgba(255,255,255,0.55)' }}>{m.tokens}</div>
              <div className="font-mono text-[6.5px] mt-0.5" style={{ color:'rgba(255,255,255,0.2)' }}>tokens</div>
            </div>
          </div>
        ))}
        {extra > 0 && (
          <div className="py-3 text-center">
            <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.22)' }}>
              {t.guild.moreMembers.replace('{count}', String(extra))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Holdings tab content
// ─────────────────────────────────────────────────────────────────
function HoldingsTab({ guild }: { guild: Guild }) {
  const { t } = useLanguage()
  const holdings = HOLDINGS_BY_GUILD[guild.id] ?? []
  const totalETH = holdings.reduce((s, h) => s + parseFloat(h.value), 0)

  return (
    <div className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.05) transparent' }}>
      {/* Summary */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)' }}>
        <div>
          <div className="font-mono text-[6.5px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>
            {t.guild.collectiveHoldings}
          </div>
          <div className="font-sans text-[15px] font-semibold mt-0.5"
            style={{ color:'rgba(255,255,255,0.8)', letterSpacing:'-0.02em' }}>
            {guild.holdings}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[6.5px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>
            {t.guild.positions}
          </div>
          <div className="font-sans text-[15px] font-semibold mt-0.5"
            style={{ color:'rgba(255,255,255,0.6)', letterSpacing:'-0.02em' }}>
            {t.guild.tokens.replace('{count}', String(holdings.length))}
          </div>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <span className="font-mono text-[8px]" style={{ color:'rgba(255,255,255,0.2)' }}>
            {t.guild.noHoldingsData}
          </span>
        </div>
      ) : (
        <div className="px-5 py-2">
          {/* Bar chart style breakdown */}
          {holdings.map(h => {
            const valNum = parseFloat(h.value)
            const pct = (valNum / totalETH * 100)
            return (
              <div key={h.ticker} className="py-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold" style={{ color:h.color }}>{h.ticker}</span>
                    <span className="font-sans text-[8.5px]" style={{ color:'rgba(255,255,255,0.38)' }}>{h.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.3)' }}>
                      {h.members} members · {h.qty.toFixed(2)} {t.guild.qty}
                    </span>
                    <span className="font-mono text-[9px] font-semibold" style={{ color:'rgba(255,255,255,0.65)' }}>
                      {h.value}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height:3, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                  <motion.div style={{ height:'100%', background:h.color, opacity:0.7 }}
                    initial={{ width:0 }} animate={{ width:`${pct}%` }}
                    transition={{ duration:0.6, ease:EASE }}/>
                </div>
                <div className="font-mono text-[6.5px] mt-1" style={{ color:'rgba(255,255,255,0.18)' }}>
                  {pct.toFixed(1)}{t.guild.pctCollective}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Guild detail panel
// ─────────────────────────────────────────────────────────────────
function GuildDetail({ guild }: { guild: Guild }) {
  const { t } = useLanguage()
  const [joined, setJoined] = useState(guild.joined)
  const [tab,    setTab]    = useState<DetailTab>('activity')

  useEffect(() => {
    setJoined(guild.joined)
    setTab('activity')
  }, [guild.id, guild.joined])

  const TABS: { id: DetailTab; label: string }[] = [
    { id:'activity', label: t.guild.activity  },
    { id:'chat',     label: t.guild.chat      },
    { id:'members',  label: t.guild.members   },
    { id:'holdings', label: t.guild.holdings  },
  ]

  return (
    <AnimatePresence mode="wait">
      <motion.div key={guild.id} className="flex flex-col h-full"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.22 }}>

        {/* Cover */}
        <div className="relative shrink-0" style={{ height:88, background:guild.cover }}>
          <div className="absolute inset-0 px-5 flex flex-col justify-end pb-3"
            style={{ background:'linear-gradient(to top,rgba(0,0,0,0.75),rgba(0,0,0,0.1))' }}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.02em' }}>
                  {guild.name}
                </div>
                <div className="font-sans text-[8.5px] mt-0.5" style={{ color:'rgba(255,255,255,0.42)' }}>
                  {guild.tagline}
                </div>
              </div>
              <motion.button type="button" onClick={() => setJoined(v => !v)}
                className="px-4 py-1.5 font-mono text-[8px] font-semibold shrink-0"
                style={{
                  background: joined ? 'rgba(255,255,255,0.05)' : `${guild.color}18`,
                  border:     `1px solid ${joined ? 'rgba(255,255,255,0.1)' : `${guild.color}38`}`,
                  color:      joined ? 'rgba(255,255,255,0.45)' : guild.color,
                }}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
                {joined ? t.guild.leave : t.guild.joinGuild}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-5 px-5 shrink-0"
          style={{ height:38, borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.45)' }}>
          {[
            { label:'Members',  value:String(guild.members) },
            { label:'Holdings', value:guild.holdings        },
            { label:'Focus',    value:guild.focus           },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="font-mono text-[6.5px] tracking-wider uppercase" style={{ color:'rgba(255,255,255,0.2)' }}>{s.label}</span>
              <span className="font-sans text-[9px] font-semibold" style={{ color:'rgba(255,255,255,0.58)' }}>{s.value}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            {guild.tags.map(tag => (
              <span key={tag} className="font-mono text-[6.5px] px-1.5 py-0.5"
                style={{ border:`1px solid ${guild.color}20`, color:`${guild.color}88`, background:`${guild.color}08` }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.3)' }}>
          {TABS.map(t => (
            <motion.button key={t.id} type="button" onClick={() => setTab(t.id)}
              className="relative px-4 py-2 font-mono text-[7.5px] tracking-wider uppercase"
              style={{ color: tab===t.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale:0.97 }}>
              {t.label}
              {tab===t.id && (
                <motion.div layoutId="guild-tab" className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background:guild.color }}/>
              )}
            </motion.button>
          ))}
          {/* Live dot for chat */}
          {tab === 'chat' && (
            <div className="flex items-center ml-auto mr-4 gap-1.5">
              <motion.span className="size-1.5 rounded-full"
                style={{ background:'#22c55e', display:'inline-block' }}
                animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.4, repeat:Infinity }}/>
              <span className="font-mono text-[7px]" style={{ color:'rgba(255,255,255,0.28)' }}>{t.common.live}</span>
            </div>
          )}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="flex flex-col flex-1 min-h-0"
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ type:'tween', duration:0.2 }}>
            {tab === 'activity' && <ActivityTab/>}
            {tab === 'chat'     && <ChatTab guild={guild}/>}
            {tab === 'members'  && <MembersTab guild={guild}/>}
            {tab === 'holdings' && <HoldingsTab guild={guild}/>}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Create Guild modal
// ─────────────────────────────────────────────────────────────────
function CreateGuildModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const [name, setName]   = useState('')
  const [desc, setDesc]   = useState('')
  const [focus, setFocus] = useState('Painting')
  const FOCUSES = ['Painting','Drawing','Digital','Sculpture','Mixed Media','Photography','Generative']

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="w-[440px] overflow-hidden"
        style={{ background:'#0c0c0e', border:'1px solid rgba(255,255,255,0.1)' }}
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'tween', duration:0.22 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:16, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>
            {t.guild.createModalTitle}
          </span>
          <button type="button" onClick={onClose}
            className="font-mono text-[11px]" style={{ color:'rgba(255,255,255,0.3)' }}>✕</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3.5">
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.guild.guildNameLabel}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder={t.guild.guildNamePlaceholder}
              className="w-full bg-transparent font-sans text-[11px] px-3 py-2 outline-none"
              style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', caretColor:'#D4AF37' }}/>
          </div>
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.guild.descriptionLabel}</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder={t.guild.descriptionPlaceholder}
              rows={2}
              className="w-full bg-transparent font-sans text-[11px] px-3 py-2 outline-none resize-none"
              style={{ border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', caretColor:'#D4AF37' }}/>
          </div>
          <div>
            <label className="font-mono text-[7px] tracking-wider uppercase block mb-1.5"
              style={{ color:'rgba(255,255,255,0.28)' }}>{t.guild.focusLabel}</label>
            <div className="flex flex-wrap gap-1.5">
              {FOCUSES.map(f => (
                <button key={f} type="button" onClick={() => setFocus(f)}
                  className="px-2.5 py-1 font-mono text-[7px]"
                  style={{
                    border:`1px solid ${focus===f ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    background: focus===f ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color: focus===f ? '#D4AF37' : 'rgba(255,255,255,0.3)',
                  }}>{f}</button>
              ))}
            </div>
          </div>
          <motion.button type="button"
            className="w-full py-2.5 font-mono text-[8.5px] tracking-widest font-semibold"
            style={{
              background: name ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.03)',
              border:     `1px solid ${name ? 'rgba(212,175,55,0.38)' : 'rgba(255,255,255,0.07)'}`,
              color:      name ? '#D4AF37' : 'rgba(255,255,255,0.18)',
              cursor:     name ? 'pointer' : 'default',
            }}
            whileHover={name ? { background:'rgba(212,175,55,0.22)' } : {}}
            whileTap={name ? { scale:0.98 } : {}}>
            {t.guild.createButton}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
//  Main GuildPage
// ─────────────────────────────────────────────────────────────────
export function GuildPage() {
  const { t } = useLanguage()
  const [selected,      setSelected]      = useState<Guild>(GUILDS[0])
  const [filter,        setFilter]        = useState<'discover' | 'joined'>('discover')
  const [createOpen,    setCreateOpen]    = useState(false)

  const displayed = filter === 'joined' ? GUILDS.filter(g => g.joined) : GUILDS
  const totalMembers = GUILDS.reduce((s, g) => s + g.members, 0)

  return (
    <>
      <AnimatePresence>
        {createOpen && <CreateGuildModal key="create" onClose={() => setCreateOpen(false)}/>}
      </AnimatePresence>

      <motion.div className="flex flex-col overflow-hidden"
        style={{ height:'calc(100vh - 68px)', marginTop:68, background:'#070707' }}
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ duration:0.35, ease:EASE }}>

        {/* Filter bar */}
        <div className="flex items-center gap-1 px-4 shrink-0"
          style={{ height:44, borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.3)' }}>
          <span className="font-sans text-[11px] font-semibold mr-2" style={{ color:'rgba(255,255,255,0.3)' }}>
            {t.guild.guilds}
          </span>
          {(['discover', 'joined'] as const).map(f => (
            <motion.button key={f} type="button" onClick={() => setFilter(f)}
              className="px-3 py-1 font-sans text-[9px] capitalize"
              style={{
                color:        filter===f ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.3)',
                borderBottom: filter===f ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
              }}
              whileHover={{ color:'rgba(255,255,255,0.6)' }}>
              {f === 'discover' ? t.guild.discover : t.guild.myGuilds}
            </motion.button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[7.5px]" style={{ color:'rgba(255,255,255,0.2)' }}>
              {t.guild.statsFormat.replace('{count}', String(GUILDS.length)).replace('{members}', String(totalMembers))}
            </span>
            <motion.button type="button" onClick={() => setCreateOpen(true)}
              className="px-3 py-1.5 font-mono text-[8px] font-semibold tracking-wider"
              style={{ background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.28)', color:'#D4AF37' }}
              whileHover={{ background:'rgba(212,175,55,0.18)' }} whileTap={{ scale:0.97 }}>
              {t.guild.createGuild}
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Guild grid */}
          <div className="shrink-0 overflow-y-auto p-3"
            style={{ width:404, borderRight:'1px solid rgba(255,255,255,0.05)', scrollbarWidth:'none' }}>
            <motion.div className="grid grid-cols-2 gap-2.5"
              variants={LIST_V} initial="hidden" animate="show">
              {displayed.map(guild => (
                <GuildCard key={guild.id} guild={guild}
                  selected={selected.id === guild.id}
                  onClick={() => setSelected(guild)}/>
              ))}
            </motion.div>
          </div>

          {/* Guild detail */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <GuildDetail guild={selected}/>
          </div>
        </div>
      </motion.div>
    </>
  )
}
