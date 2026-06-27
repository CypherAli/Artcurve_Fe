'use client'
import { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconCoin, IconTrendingUp, IconAward, IconGift, IconShieldChevron,
  IconMail, IconHash, IconSearch, IconRefresh, IconChevronLeft,
  IconChecklist, IconWand, IconTrophy, IconPhoto, IconGavel,
  IconUsers, IconMessage2, IconBuildingBank,
  IconX, IconCheck, IconChevronDown, IconCalendar, IconStar,
  IconFlame, IconTarget, IconClock, IconSettings,
} from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { guildService, GUILD_FOUNDATION_FEE_ETH, type ApiGuild, type ApiGuildMember, type ApiGuildMessage, type ApiGuildAnnouncement, type ApiGuildAnalytics, type ApiGuildActivity } from '@/services/guild.service'
import { useAuthStore } from '@/store/authStore'
import { io, type Socket } from 'socket.io-client'

const DARK = {
  bg: '#0F0E0C', panel: '#181613', panel2: '#100E0B',
  line: '#2B2823', lineGold: 'rgba(201,169,110,0.30)',
  ink: '#F0EBE1', muted: '#8E877B', gold: '#C9A96E', goldLight: '#E8D5B0',
  accent: '#4A90D9', red: '#e87a7a', green: '#8fce9f',
  banner: '/guild/banner.png', crest: '/guild/crest_lion.png',
  sceneBg: `radial-gradient(80% 50% at 50% 0%, rgba(201,169,110,0.05), transparent 60%), #0F0E0C`,
  bannerFit: '110% auto' as const,
  bannerBg: 'none',
  bannerPos: '36% 50%' as const,
  bannerTint: 'none',
  showFrost: true,
}
const LIGHT = {
  bg: '#FDFBF7', panel: '#F5F0E8', panel2: '#EDE7DC',
  line: '#E4DDD3', lineGold: 'rgba(160,120,60,0.30)',
  ink: '#1A1A1A', muted: '#6B655C', gold: '#8A6B2A', goldLight: '#A47E30',
  accent: '#4A90D9', red: '#d45555', green: '#5aad6a',
  banner: '/guild/banner_light.png', crest: '/guild/crest_wolf.png',
  sceneBg: `radial-gradient(80% 50% at 50% 0%, rgba(160,120,60,0.08), transparent 60%), #FDFBF7`,
  bannerFit: '130% auto' as const,
  bannerPos: '39% 45%' as const,
  bannerBg: '#3D1212',
  showFrost: false,
  bannerTint: 'linear-gradient(180deg, rgba(40,15,10,0.35) 0%, rgba(40,15,10,0.55) 100%)',
}
type Colors = Omit<typeof DARK, 'bannerFit' | 'bannerPos'> & { bannerFit: string; bannerPos: string; bannerBg: string }
const ThemeCtx = createContext<Colors>(DARK as Colors)
function useC() { return useContext(ThemeCtx) }
const SERIF = "'Cormorant Garamond', Georgia, serif"
const _EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const _SCENE = `radial-gradient(55% 50% at 50% -6%, rgba(201,169,110,0.18), transparent 60%),`
  + `radial-gradient(70% 32% at 50% 112%, rgba(201,169,110,0.10), transparent 62%),`
  + `radial-gradient(120% 120% at 50% 45%, transparent 52%, rgba(0,0,0,0.6)), ${DARK.bg}`

const EMBLEMS = [
  'lion','eagle-emblem','wolf-head','wolf-howl','fox-head','owl','raven','swan','bull','octopus',
  'snake','scorpion','butterfly','dragonfly','bee','crab','frog','gecko','monkey','turtle',
  'werewolf','stag-head','sea-serpent','dinosaur-rex','scarab-beetle','shark-jaws','salamander',
  'minotaur','squid','vulture','dolphin','elephant','tiger','penguin','panda','gorilla',
  'kangaroo','flamingo','griffin-symbol','horse-head','eagle-head','bear-head','seahorse',
  'koala','rabbit','pegasus','chess-knight','polar-bear','axolotl','bear-face',
]

function getRankNumber(vol: number, winRate: number) {
  const score = vol + winRate * 500
  if (score >= 100000) return 1
  if (score >= 50000) return Math.floor(Math.random() * 5) + 2
  if (score >= 15000) return Math.floor(Math.random() * 20) + 7
  if (score >= 5000) return Math.floor(Math.random() * 50) + 27
  if (score >= 1000) return Math.floor(Math.random() * 100) + 77
  return Math.floor(Math.random() * 300) + 177
}

// ── i18n ─────────────────────────────────────────────────────────
const EN = {
  recommended: 'Recommended', invite: 'Invite', copied: 'Invite link copied', searchPh: 'Search guild by name…',
  tag: 'Tag Search', search: 'Search', foundDesc: 'Found your own guild or join a collector club. Trade together to earn weekly collective rewards.',
  found: 'Found', feeNote: 'One-time · anti-spam', weeklyVol: 'Weekly volume', members: 'Members',
  noRank: 'No rank limit', accept: 'Acceptance', auto: 'Auto', manual: 'Manual', info: 'Info', empty: 'No guild found',
  rewards: ['Weekly dividends', 'Contribution XP', 'Prestige badge', 'Early access'],
  rewardDesc: ['Share of guild fees & royalties weekly', 'Earn points to level up the guild', 'Titles & roles within the guild', 'Buy hot drops before others'],
  createTitle: 'Found a new guild', guildName: 'Guild name', focus: 'Focus', create: 'Create', cancel: 'Cancel', creating: 'Creating…',
  needLogin: 'Please sign in to found a guild', createFail: 'Could not create guild, try again later',
  back: 'Guild', checkin: 'Check-in', actAct: 'Guild Activities', actDecor: 'Gallery Decor', actDiv: 'Weekly Dividends',
  nVault: 'Collective Vault', nVaultSub: 'Co-own artworks', nLeague: 'Guild League', nLeagueSub: 'Seasonal volume race',
  nGallery: 'Curated Gallery', nGallerySub: 'Shared collection', auction: 'Guild Auction', membersBtn: 'Members', chat: 'Guild chat',
  chatMsg: 'funded up — let\'s trade',
  open: 'Open', noPref: 'No Preference', automatic: 'Automatic', selective: 'Selective',
  weeklyAssist: 'Weekly Assistance', masteryRank: 'Guild Mastery', guildInfo: 'Guild Information',
  basicInfo: 'Basic Information', memberInfo: 'Info',
  introduction: 'Introduction', foundingDate: 'Founding Date', rankings: 'Rankings', activity: 'Activity',
  rank: 'Rank', assistance: 'Assistance', lastLogin: 'Last Login', greeting: 'Greeting',
  attendance: 'Attendance', areasOfExpertise: 'Areas of Expertise',
  tagCheckInDaily: 'Check-In Everyday', tagCheckIn3Days: 'At Least 3 Days a Week', tagFreeAttendance: 'Free Attendance',
  tagNewbie: 'Newbie Friendly', tagTopGuild: 'Wannabe the Top Guild', tagArena: 'Arena Experts',
  tagCasual: 'Casual', tagLastingRandom: 'Lasting Effect Random', tagLasting247: 'Lasting Effect 24/7',
  apply: 'Apply', reset: 'Reset', close: 'Close',
  totalVol: 'Total Volume', auctionWin: 'Auction Win Rate', weeklyActive: 'Weekly Active',
  emblem: 'Emblem', type: 'Type', selectToEnter: 'Select to enter',
  join: 'Join', leave: 'Leave Guild', leaveConfirm: 'Leave this guild? You cannot rejoin for 12 hours.',
  cooldown: 'Cooldown', cooldownMsg: 'You left recently. Rejoin available in',
  hours: 'h', minutes: 'm', joined: 'Joined!', alreadyInGuild: 'Leave your current guild first', loginRequired: 'Please login to join or create a guild',
  charDesigner: 'Character Designer', generateChar: 'Generate Character', generating: 'Generating…',
  charPrompt: 'Describe your character', charResult: 'Your Character',
  guildHall: 'Guild Hall',
  settings: 'Settings', settingsDesc: 'Guild configuration',
  guildDesc: 'Description', acceptance: 'Acceptance', saveSetting: 'Save', settingsSaved: 'Saved',
}
const STR: Record<string, typeof EN> = {
  en: EN,
  vi: {
    recommended: 'Đề xuất', invite: 'Lời mời', copied: 'Đã sao chép link mời', searchPh: 'Tìm guild theo tên…',
    tag: 'Tìm Tag', search: 'Tìm', foundDesc: 'Lập hội của riêng bạn hoặc gia nhập một guild sưu tầm. Cùng giao dịch để nhận thưởng tập thể mỗi tuần.',
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
    open: 'Mở', noPref: 'Không ưu tiên', automatic: 'Tự động', selective: 'Chọn lọc',
    weeklyAssist: 'Hỗ trợ tuần', masteryRank: 'Hạng Guild', guildInfo: 'Thông tin Guild',
    basicInfo: 'Thông tin cơ bản', memberInfo: 'Chi tiết',
    introduction: 'Giới thiệu', foundingDate: 'Ngày thành lập', rankings: 'Xếp hạng', activity: 'Hoạt động',
    rank: 'Hạng', assistance: 'Hỗ trợ', lastLogin: 'Đăng nhập cuối', greeting: 'Lời chào',
    attendance: 'Điểm danh', areasOfExpertise: 'Chuyên môn',
    tagCheckInDaily: 'Điểm danh mỗi ngày', tagCheckIn3Days: 'Ít nhất 3 ngày/tuần', tagFreeAttendance: 'Tự do',
    tagNewbie: 'Thân thiện người mới', tagTopGuild: 'Muốn lên Top Guild', tagArena: 'Chuyên gia đấu giá',
    tagCasual: 'Thoải mái', tagLastingRandom: 'Hiệu ứng ngẫu nhiên', tagLasting247: 'Hiệu ứng 24/7',
    apply: 'Áp dụng', reset: 'Đặt lại', close: 'Đóng',
    totalVol: 'Tổng khối lượng', auctionWin: 'Tỷ lệ thắng đấu giá', weeklyActive: 'Hoạt động tuần',
    emblem: 'Biểu tượng', type: 'Loại', selectToEnter: 'Chọn để nhập',
    join: 'Tham gia', leave: 'Rời Guild', leaveConfirm: 'Rời guild? Bạn không thể tham gia lại trong 12 giờ.',
    cooldown: 'Chờ', cooldownMsg: 'Bạn vừa rời. Có thể tham gia lại sau',
    hours: 'g', minutes: 'p', joined: 'Đã tham gia!', alreadyInGuild: 'Rời guild hiện tại trước', loginRequired: 'Vui lòng đăng nhập để tham gia hoặc tạo guild',
    charDesigner: 'Thiết kế nhân vật', generateChar: 'Tạo nhân vật', generating: 'Đang tạo…',
    charPrompt: 'Mô tả nhân vật của bạn', charResult: 'Nhân vật của bạn',
    guildHall: 'Đại sảnh',
    settings: 'Cài đặt', settingsDesc: 'Cấu hình guild',
    guildDesc: 'Mô tả', acceptance: 'Chấp nhận', saveSetting: 'Lưu', settingsSaved: 'Đã lưu',
  },
  fr: {
    recommended: 'Recommandés', invite: 'Inviter', copied: 'Lien copié', searchPh: 'Rechercher une guilde…',
    tag: 'Recherche Tag', search: 'Chercher', foundDesc: 'Fondez votre propre guilde ou rejoignez un club de collectionneurs. Échangez ensemble pour gagner des récompenses collectives chaque semaine.',
    found: 'Fonder', feeNote: 'Unique · anti-spam', weeklyVol: 'Volume hebdo', members: 'Membres',
    noRank: 'Rang illimité', accept: 'Admission', auto: 'Auto', manual: 'Manuel', info: 'Info', empty: 'Aucune guilde trouvée',
    rewards: ['Dividendes hebdo', 'XP de contribution', 'Badge prestige', 'Accès anticipé'],
    rewardDesc: ['Part des frais & royalties chaque semaine', 'Gagnez des points pour monter la guilde', 'Titres & rôles dans la guilde', 'Achetez les drops avant les autres'],
    createTitle: 'Fonder une guilde', guildName: 'Nom de la guilde', focus: 'Domaine', create: 'Créer', cancel: 'Annuler', creating: 'Création…',
    needLogin: 'Connectez-vous pour fonder une guilde', createFail: 'Échec de création, réessayez',
    back: 'Guilde', checkin: 'Check-in', actAct: 'Activités', actDecor: 'Déco Galerie', actDiv: 'Dividendes hebdo',
    nVault: 'Coffre collectif', nVaultSub: 'Co-propriété d\'œuvres', nLeague: 'Ligue des Guildes', nLeagueSub: 'Course de volume saisonnière',
    nGallery: 'Galerie curatée', nGallerySub: 'Collection partagée', auction: 'Enchères Guilde', membersBtn: 'Membres', chat: 'Chat guilde',
    chatMsg: 'fonds réunis — on trade',
    open: 'Ouvert', noPref: 'Sans préférence', automatic: 'Automatique', selective: 'Sélectif',
    weeklyAssist: 'Aide hebdo', masteryRank: 'Maîtrise Guilde', guildInfo: 'Info Guilde',
    basicInfo: 'Informations de base', memberInfo: 'Info',
    introduction: 'Introduction', foundingDate: 'Date de fondation', rankings: 'Classements', activity: 'Activité',
    rank: 'Rang', assistance: 'Aide', lastLogin: 'Dernière connexion', greeting: 'Message',
    attendance: 'Présence', areasOfExpertise: 'Domaines d\'expertise',
    tagCheckInDaily: 'Check-in quotidien', tagCheckIn3Days: 'Au moins 3 jours/semaine', tagFreeAttendance: 'Libre',
    tagNewbie: 'Accueillant débutants', tagTopGuild: 'Viser le top', tagArena: 'Experts enchères',
    tagCasual: 'Détente', tagLastingRandom: 'Effet aléatoire', tagLasting247: 'Effet 24/7',
    apply: 'Appliquer', reset: 'Réinitialiser', close: 'Fermer',
    totalVol: 'Volume total', auctionWin: 'Taux de victoire', weeklyActive: 'Actifs hebdo',
    emblem: 'Emblème', type: 'Type', selectToEnter: 'Sélectionner pour saisir',
    join: 'Rejoindre', leave: 'Quitter la guilde', leaveConfirm: 'Quitter cette guilde ? Vous ne pourrez pas la rejoindre pendant 12 heures.',
    cooldown: 'Délai', cooldownMsg: 'Vous avez quitté récemment. Rejoindre disponible dans',
    hours: 'h', minutes: 'm', joined: 'Rejoint !', alreadyInGuild: 'Quittez votre guilde actuelle d\'abord', loginRequired: 'Veuillez vous connecter pour rejoindre ou créer une guilde',
    charDesigner: 'Concepteur de personnage', generateChar: 'Générer', generating: 'Génération…',
    charPrompt: 'Décrivez votre personnage', charResult: 'Votre personnage',
    guildHall: 'Salle de guilde',
    settings: 'Paramètres', settingsDesc: 'Configuration de guilde',
    guildDesc: 'Description', acceptance: 'Acceptation', saveSetting: 'Enregistrer', settingsSaved: 'Enregistré',
  },
  ja: {
    recommended: 'おすすめ', invite: '招待', copied: '招待リンクをコピーしました', searchPh: 'ギルド名で検索…',
    tag: 'タグ検索', search: '検索', foundDesc: '自分のギルドを設立するか、コレクタークラブに参加しましょう。一緒に取引して毎週の報酬を獲得。',
    found: '設立', feeNote: '一回限り・スパム防止', weeklyVol: '週間取引量', members: 'メンバー',
    noRank: 'ランク制限なし', accept: '承認', auto: '自動', manual: '手動', info: '詳細', empty: 'ギルドが見つかりません',
    rewards: ['週間配当', '貢献XP', 'プレステージバッジ', '先行アクセス'],
    rewardDesc: ['ギルド手数料＆ロイヤリティの週間シェア', 'ギルドレベルアップのポイント', 'ギルド内の称号＆役割', '人気ドロップを先行購入'],
    createTitle: '新しいギルドを設立', guildName: 'ギルド名', focus: '分野', create: '作成', cancel: 'キャンセル', creating: '作成中…',
    needLogin: 'ギルドを設立するにはログインしてください', createFail: 'ギルド作成に失敗しました',
    back: 'ギルド', checkin: 'チェックイン', actAct: 'ギルド活動', actDecor: 'ギャラリー装飾', actDiv: '週間配当',
    nVault: '共同金庫', nVaultSub: '作品の共同所有', nLeague: 'ギルドリーグ', nLeagueSub: 'シーズン取引量レース',
    nGallery: 'キュレーションギャラリー', nGallerySub: '共有コレクション', auction: 'ギルドオークション', membersBtn: 'メンバー', chat: 'ギルドチャット',
    chatMsg: '資金準備OK — トレードしよう',
    open: 'オープン', noPref: '指定なし', automatic: '自動', selective: '選択制',
    weeklyAssist: '週間支援', masteryRank: 'ギルド熟練度', guildInfo: 'ギルド情報',
    basicInfo: '基本情報', memberInfo: '詳細',
    introduction: '紹介', foundingDate: '設立日', rankings: 'ランキング', activity: '活動',
    rank: 'ランク', assistance: '支援', lastLogin: '最終ログイン', greeting: '挨拶',
    attendance: '出席', areasOfExpertise: '専門分野',
    tagCheckInDaily: '毎日チェックイン', tagCheckIn3Days: '週3日以上', tagFreeAttendance: '自由出席',
    tagNewbie: '初心者歓迎', tagTopGuild: 'トップギルド志向', tagArena: 'オークション専門',
    tagCasual: 'カジュアル', tagLastingRandom: 'ランダム効果', tagLasting247: '24/7効果',
    apply: '適用', reset: 'リセット', close: '閉じる',
    totalVol: '総取引量', auctionWin: 'オークション勝率', weeklyActive: '週間アクティブ',
    emblem: 'エンブレム', type: 'タイプ', selectToEnter: '入力するには選択',
    join: '参加', leave: 'ギルド脱退', leaveConfirm: 'このギルドを脱退しますか？12時間は再参加できません。',
    cooldown: 'クールダウン', cooldownMsg: '最近脱退しました。再参加可能まで',
    hours: '時間', minutes: '分', joined: '参加しました！', alreadyInGuild: '先に現在のギルドを脱退してください', loginRequired: 'ギルドに参加または作成するにはログインしてください',
    charDesigner: 'キャラクターデザイナー', generateChar: '生成', generating: '生成中…',
    charPrompt: 'キャラクターを説明', charResult: 'あなたのキャラクター',
    guildHall: 'ギルドホール',
    settings: '設定', settingsDesc: 'ギルド設定',
    guildDesc: '説明', acceptance: '承認', saveSetting: '保存', settingsSaved: '保存済み',
  },
  es: {
    recommended: 'Recomendados', invite: 'Invitar', copied: 'Enlace copiado', searchPh: 'Buscar gremio por nombre…',
    tag: 'Buscar Tag', search: 'Buscar', foundDesc: 'Funda tu propio gremio o únete a un club de coleccionistas. Comercia junto para ganar recompensas colectivas semanales.',
    found: 'Fundar', feeNote: 'Único · anti-spam', weeklyVol: 'Volumen semanal', members: 'Miembros',
    noRank: 'Sin límite de rango', accept: 'Admisión', auto: 'Auto', manual: 'Manual', info: 'Info', empty: 'No se encontró ningún gremio',
    rewards: ['Dividendos semanales', 'XP de contribución', 'Insignia de prestigio', 'Acceso anticipado'],
    rewardDesc: ['Parte de las tarifas y regalías semanales', 'Gana puntos para subir de nivel', 'Títulos y roles dentro del gremio', 'Compra drops populares antes que otros'],
    createTitle: 'Fundar un gremio', guildName: 'Nombre del gremio', focus: 'Enfoque', create: 'Crear', cancel: 'Cancelar', creating: 'Creando…',
    needLogin: 'Inicia sesión para fundar un gremio', createFail: 'No se pudo crear el gremio, inténtalo de nuevo',
    back: 'Gremio', checkin: 'Check-in', actAct: 'Actividades', actDecor: 'Decoración', actDiv: 'Dividendos semanales',
    nVault: 'Bóveda colectiva', nVaultSub: 'Co-propiedad de obras', nLeague: 'Liga de Gremios', nLeagueSub: 'Carrera de volumen por temporada',
    nGallery: 'Galería curada', nGallerySub: 'Colección compartida', auction: 'Subasta del Gremio', membersBtn: 'Miembros', chat: 'Chat del gremio',
    chatMsg: 'fondos listos — a comerciar',
    open: 'Abierto', noPref: 'Sin preferencia', automatic: 'Automático', selective: 'Selectivo',
    weeklyAssist: 'Ayuda semanal', masteryRank: 'Maestría del Gremio', guildInfo: 'Info del Gremio',
    basicInfo: 'Información básica', memberInfo: 'Info',
    introduction: 'Introducción', foundingDate: 'Fecha de fundación', rankings: 'Rankings', activity: 'Actividad',
    rank: 'Rango', assistance: 'Ayuda', lastLogin: 'Última conexión', greeting: 'Saludo',
    attendance: 'Asistencia', areasOfExpertise: 'Áreas de experiencia',
    tagCheckInDaily: 'Check-in diario', tagCheckIn3Days: 'Mínimo 3 días/semana', tagFreeAttendance: 'Libre',
    tagNewbie: 'Amigable con novatos', tagTopGuild: 'Aspirante a Top', tagArena: 'Expertos en subastas',
    tagCasual: 'Casual', tagLastingRandom: 'Efecto aleatorio', tagLasting247: 'Efecto 24/7',
    apply: 'Aplicar', reset: 'Restablecer', close: 'Cerrar',
    totalVol: 'Volumen total', auctionWin: 'Tasa de victoria', weeklyActive: 'Activos semanales',
    emblem: 'Emblema', type: 'Tipo', selectToEnter: 'Seleccionar para ingresar',
    join: 'Unirse', leave: 'Dejar gremio', leaveConfirm: '¿Dejar este gremio? No podrás unirte de nuevo durante 12 horas.',
    cooldown: 'Espera', cooldownMsg: 'Saliste recientemente. Podrás unirte en',
    hours: 'h', minutes: 'm', joined: '¡Unido!', alreadyInGuild: 'Sal de tu gremio actual primero', loginRequired: 'Inicia sesión para unirte o crear un gremio',
    charDesigner: 'Diseñador de personaje', generateChar: 'Generar', generating: 'Generando…',
    charPrompt: 'Describe tu personaje', charResult: 'Tu personaje',
    guildHall: 'Sala del gremio',
    settings: 'Ajustes', settingsDesc: 'Configuración del gremio',
    guildDesc: 'Descripción', acceptance: 'Aceptación', saveSetting: 'Guardar', settingsSaved: 'Guardado',
  },
  zh: {
    recommended: '推荐', invite: '邀请', copied: '邀请链接已复制', searchPh: '按名称搜索公会…',
    tag: '标签搜索', search: '搜索', foundDesc: '创建你自己的公会或加入收藏俱乐部。一起交易，每周赚取集体奖励。',
    found: '创建', feeNote: '一次性 · 防垃圾', weeklyVol: '周交易量', members: '成员',
    noRank: '无等级限制', accept: '审核', auto: '自动', manual: '手动', info: '详情', empty: '未找到公会',
    rewards: ['每周分红', '贡献经验', '荣誉徽章', '优先访问'],
    rewardDesc: ['每周分享公会费用和版税', '赚取积分升级公会', '公会内的头衔和角色', '优先购买热门作品'],
    createTitle: '创建新公会', guildName: '公会名称', focus: '领域', create: '创建', cancel: '取消', creating: '创建中…',
    needLogin: '请登录以创建公会', createFail: '创建公会失败，请重试',
    back: '公会', checkin: '签到', actAct: '公会活动', actDecor: '画廊装饰', actDiv: '每周分红',
    nVault: '集体金库', nVaultSub: '共同拥有作品', nLeague: '公会联赛', nLeagueSub: '赛季交易量竞赛',
    nGallery: '策展画廊', nGallerySub: '共享收藏', auction: '公会拍卖', membersBtn: '成员', chat: '公会聊天',
    chatMsg: '资金到位——开始交易',
    open: '开放', noPref: '无偏好', automatic: '自动', selective: '筛选',
    weeklyAssist: '周支援', masteryRank: '公会精通', guildInfo: '公会信息',
    basicInfo: '基本信息', memberInfo: '详情',
    introduction: '简介', foundingDate: '成立日期', rankings: '排名', activity: '活跃度',
    rank: '等级', assistance: '支援', lastLogin: '最后登录', greeting: '问候',
    attendance: '出勤', areasOfExpertise: '专长领域',
    tagCheckInDaily: '每日签到', tagCheckIn3Days: '至少每周3天', tagFreeAttendance: '自由出勤',
    tagNewbie: '新手友好', tagTopGuild: '志在顶级公会', tagArena: '拍卖专家',
    tagCasual: '休闲', tagLastingRandom: '随机效果', tagLasting247: '24/7效果',
    apply: '应用', reset: '重置', close: '关闭',
    totalVol: '总交易量', auctionWin: '拍卖胜率', weeklyActive: '周活跃',
    emblem: '徽章', type: '类型', selectToEnter: '选择输入',
    join: '加入', leave: '退出公会', leaveConfirm: '退出公会？12小时内无法重新加入。',
    cooldown: '冷却', cooldownMsg: '您最近退出。可重新加入时间',
    hours: '时', minutes: '分', joined: '已加入！', alreadyInGuild: '请先退出当前公会', loginRequired: '请登录以加入或创建公会',
    charDesigner: '角色设计师', generateChar: '生成', generating: '生成中…',
    charPrompt: '描述你的角色', charResult: '你的角色',
    guildHall: '公会大厅',
    settings: '设置', settingsDesc: '公会配置',
    guildDesc: '描述', acceptance: '接受', saveSetting: '保存', settingsSaved: '已保存',
  },
  ko: {
    recommended: '추천', invite: '초대', copied: '초대 링크 복사됨', searchPh: '길드 이름으로 검색…',
    tag: '태그 검색', search: '검색', foundDesc: '나만의 길드를 설립하거나 수집가 클럽에 가입하세요. 함께 거래하여 매주 보상을 획득하세요.',
    found: '설립', feeNote: '일회성 · 스팸 방지', weeklyVol: '주간 거래량', members: '멤버',
    noRank: '랭크 제한 없음', accept: '승인', auto: '자동', manual: '수동', info: '정보', empty: '길드를 찾을 수 없습니다',
    rewards: ['주간 배당금', '기여 XP', '명예 배지', '조기 액세스'],
    rewardDesc: ['매주 길드 수수료 및 로열티 공유', '길드 레벨업 포인트 획득', '길드 내 칭호 및 역할', '인기 드롭 우선 구매'],
    createTitle: '새 길드 설립', guildName: '길드 이름', focus: '분야', create: '생성', cancel: '취소', creating: '생성 중…',
    needLogin: '길드를 설립하려면 로그인하세요', createFail: '길드 생성 실패, 다시 시도하세요',
    back: '길드', checkin: '체크인', actAct: '길드 활동', actDecor: '갤러리 장식', actDiv: '주간 배당금',
    nVault: '공동 금고', nVaultSub: '작품 공동 소유', nLeague: '길드 리그', nLeagueSub: '시즌 거래량 경쟁',
    nGallery: '큐레이션 갤러리', nGallerySub: '공유 컬렉션', auction: '길드 경매', membersBtn: '멤버', chat: '길드 채팅',
    chatMsg: '자금 준비 완료 — 거래 시작',
    open: '공개', noPref: '선호 없음', automatic: '자동', selective: '선별',
    weeklyAssist: '주간 지원', masteryRank: '길드 숙련도', guildInfo: '길드 정보',
    basicInfo: '기본 정보', memberInfo: '정보',
    introduction: '소개', foundingDate: '설립일', rankings: '순위', activity: '활동',
    rank: '랭크', assistance: '지원', lastLogin: '최근 로그인', greeting: '인사',
    attendance: '출석', areasOfExpertise: '전문 분야',
    tagCheckInDaily: '매일 체크인', tagCheckIn3Days: '주 3일 이상', tagFreeAttendance: '자유 출석',
    tagNewbie: '초보 환영', tagTopGuild: '최고 길드 목표', tagArena: '경매 전문가',
    tagCasual: '캐주얼', tagLastingRandom: '랜덤 효과', tagLasting247: '24/7 효과',
    apply: '적용', reset: '초기화', close: '닫기',
    totalVol: '총 거래량', auctionWin: '경매 승률', weeklyActive: '주간 활성',
    emblem: '엠블럼', type: '유형', selectToEnter: '입력하려면 선택',
    join: '가입', leave: '길드 탈퇴', leaveConfirm: '이 길드를 탈퇴하시겠습니까? 12시간 동안 재가입할 수 없습니다.',
    cooldown: '대기', cooldownMsg: '최근 탈퇴하셨습니다. 재가입 가능 시간',
    hours: '시간', minutes: '분', joined: '가입했습니다!', alreadyInGuild: '현재 길드를 먼저 탈퇴하세요', loginRequired: '길드에 가입하거나 만들려면 로그인하세요',
    charDesigner: '캐릭터 디자이너', generateChar: '생성', generating: '생성 중…',
    charPrompt: '캐릭터를 설명하세요', charResult: '당신의 캐릭터',
    guildHall: '길드 홀',
    settings: '설정', settingsDesc: '길드 설정',
    guildDesc: '설명', acceptance: '수락', saveSetting: '저장', settingsSaved: '저장됨',
  },
  de: {
    recommended: 'Empfohlen', invite: 'Einladen', copied: 'Einladungslink kopiert', searchPh: 'Gilde nach Name suchen…',
    tag: 'Tag-Suche', search: 'Suchen', foundDesc: 'Gründe deine eigene Gilde oder tritt einem Sammlerclub bei. Handelt gemeinsam für wöchentliche Belohnungen.',
    found: 'Gründen', feeNote: 'Einmalig · Anti-Spam', weeklyVol: 'Wochenvolumen', members: 'Mitglieder',
    noRank: 'Kein Ranglimit', accept: 'Aufnahme', auto: 'Auto', manual: 'Manuell', info: 'Info', empty: 'Keine Gilde gefunden',
    rewards: ['Wöchentliche Dividende', 'Beitrags-XP', 'Prestige-Abzeichen', 'Frühzugang'],
    rewardDesc: ['Wöchentlicher Anteil an Gildengebühren', 'Punkte zum Gilden-Levelaufstieg', 'Titel & Rollen in der Gilde', 'Hot Drops vor anderen kaufen'],
    createTitle: 'Neue Gilde gründen', guildName: 'Gildenname', focus: 'Fokus', create: 'Erstellen', cancel: 'Abbrechen', creating: 'Wird erstellt…',
    needLogin: 'Zum Gründen bitte anmelden', createFail: 'Gilde konnte nicht erstellt werden',
    back: 'Gilde', checkin: 'Check-in', actAct: 'Gildenaktivitäten', actDecor: 'Galeriedeko', actDiv: 'Wöchentliche Dividende',
    nVault: 'Gemeinschaftstresor', nVaultSub: 'Werke gemeinsam besitzen', nLeague: 'Gildenliga', nLeagueSub: 'Saisonaler Volumenwettbewerb',
    nGallery: 'Kuratierte Galerie', nGallerySub: 'Geteilte Sammlung', auction: 'Gildenauktion', membersBtn: 'Mitglieder', chat: 'Gildenchat',
    chatMsg: 'Mittel bereit — los geht\'s',
    open: 'Offen', noPref: 'Keine Präferenz', automatic: 'Automatisch', selective: 'Selektiv',
    weeklyAssist: 'Wochenhilfe', masteryRank: 'Gildenmeisterschaft', guildInfo: 'Gildeninfo',
    basicInfo: 'Grundinfos', memberInfo: 'Info',
    introduction: 'Einführung', foundingDate: 'Gründungsdatum', rankings: 'Rankings', activity: 'Aktivität',
    rank: 'Rang', assistance: 'Hilfe', lastLogin: 'Letzter Login', greeting: 'Begrüßung',
    attendance: 'Anwesenheit', areasOfExpertise: 'Fachgebiete',
    tagCheckInDaily: 'Tägliches Check-in', tagCheckIn3Days: 'Mind. 3 Tage/Woche', tagFreeAttendance: 'Freie Anwesenheit',
    tagNewbie: 'Anfängerfreundlich', tagTopGuild: 'Top-Gilde anstreben', tagArena: 'Auktionsexperten',
    tagCasual: 'Casual', tagLastingRandom: 'Zufallseffekt', tagLasting247: '24/7-Effekt',
    apply: 'Anwenden', reset: 'Zurücksetzen', close: 'Schließen',
    totalVol: 'Gesamtvolumen', auctionWin: 'Auktionserfolg', weeklyActive: 'Wöchentlich aktiv',
    emblem: 'Emblem', type: 'Typ', selectToEnter: 'Zum Eingeben auswählen',
    join: 'Beitreten', leave: 'Gilde verlassen', leaveConfirm: 'Diese Gilde verlassen? Sie können 12 Stunden lang nicht wieder beitreten.',
    cooldown: 'Abklingzeit', cooldownMsg: 'Kürzlich verlassen. Wiederbeitritt möglich in',
    hours: 'Std', minutes: 'Min', joined: 'Beigetreten!', alreadyInGuild: 'Verlasse zuerst deine aktuelle Gilde', loginRequired: 'Bitte melden Sie sich an, um einer Gilde beizutreten oder eine zu erstellen',
    charDesigner: 'Charakter-Designer', generateChar: 'Generieren', generating: 'Generierung…',
    charPrompt: 'Beschreibe deinen Charakter', charResult: 'Dein Charakter',
    guildHall: 'Gildenhalle',
    settings: 'Einstellungen', settingsDesc: 'Gildenkonfiguration',
    guildDesc: 'Beschreibung', acceptance: 'Annahme', saveSetting: 'Speichern', settingsSaved: 'Gespeichert',
  },
  ar: {
    recommended: 'موصى به', invite: 'دعوة', copied: 'تم نسخ رابط الدعوة', searchPh: 'البحث عن نقابة…',
    tag: 'بحث الوسوم', search: 'بحث', foundDesc: 'أسس نقابتك الخاصة أو انضم إلى نادي جامعين. تداولوا معاً لكسب مكافآت جماعية أسبوعية.',
    found: 'تأسيس', feeNote: 'مرة واحدة · مضاد للبريد', weeklyVol: 'الحجم الأسبوعي', members: 'الأعضاء',
    noRank: 'بدون حد رتبة', accept: 'القبول', auto: 'تلقائي', manual: 'يدوي', info: 'معلومات', empty: 'لم يتم العثور على نقابة',
    rewards: ['أرباح أسبوعية', 'نقاط مساهمة', 'شارة مرموقة', 'وصول مبكر'],
    rewardDesc: ['حصة من رسوم النقابة أسبوعياً', 'اكسب نقاط لترقية النقابة', 'ألقاب وأدوار داخل النقابة', 'اشتر الإصدارات الساخنة أولاً'],
    createTitle: 'تأسيس نقابة جديدة', guildName: 'اسم النقابة', focus: 'التركيز', create: 'إنشاء', cancel: 'إلغاء', creating: 'جاري الإنشاء…',
    needLogin: 'سجل دخولك لتأسيس نقابة', createFail: 'فشل إنشاء النقابة، حاول مجدداً',
    back: 'النقابة', checkin: 'تسجيل حضور', actAct: 'أنشطة النقابة', actDecor: 'ديكور المعرض', actDiv: 'أرباح أسبوعية',
    nVault: 'خزنة جماعية', nVaultSub: 'ملكية مشتركة للأعمال', nLeague: 'دوري النقابات', nLeagueSub: 'سباق حجم موسمي',
    nGallery: 'معرض منسق', nGallerySub: 'مجموعة مشتركة', auction: 'مزاد النقابة', membersBtn: 'الأعضاء', chat: 'دردشة النقابة',
    chatMsg: 'التمويل جاهز — لنتداول',
    open: 'مفتوح', noPref: 'بدون تفضيل', automatic: 'تلقائي', selective: 'انتقائي',
    weeklyAssist: 'دعم أسبوعي', masteryRank: 'إتقان النقابة', guildInfo: 'معلومات النقابة',
    basicInfo: 'معلومات أساسية', memberInfo: 'تفاصيل',
    introduction: 'مقدمة', foundingDate: 'تاريخ التأسيس', rankings: 'التصنيفات', activity: 'النشاط',
    rank: 'الرتبة', assistance: 'المساعدة', lastLogin: 'آخر دخول', greeting: 'تحية',
    attendance: 'الحضور', areasOfExpertise: 'مجالات الخبرة',
    tagCheckInDaily: 'حضور يومي', tagCheckIn3Days: '3 أيام على الأقل/أسبوع', tagFreeAttendance: 'حضور حر',
    tagNewbie: 'صديق للمبتدئين', tagTopGuild: 'طموح للقمة', tagArena: 'خبراء المزادات',
    tagCasual: 'عادي', tagLastingRandom: 'تأثير عشوائي', tagLasting247: 'تأثير 24/7',
    apply: 'تطبيق', reset: 'إعادة ضبط', close: 'إغلاق',
    totalVol: 'الحجم الإجمالي', auctionWin: 'نسبة فوز المزاد', weeklyActive: 'نشاط أسبوعي',
    emblem: 'شعار', type: 'النوع', selectToEnter: 'اختر للإدخال',
    join: 'انضمام', leave: 'مغادرة النقابة', leaveConfirm: 'مغادرة هذه النقابة؟ لن تتمكن من الانضمام مجدداً لمدة 12 ساعة.',
    cooldown: 'فترة انتظار', cooldownMsg: 'غادرت مؤخراً. يمكنك الانضمام مجدداً بعد',
    hours: 'س', minutes: 'د', joined: 'تم الانضمام!', alreadyInGuild: 'غادر نقابتك الحالية أولاً', loginRequired: 'يرجى تسجيل الدخول للانضمام أو إنشاء نقابة',
    charDesigner: 'مصمم الشخصيات', generateChar: 'إنشاء', generating: 'جاري الإنشاء…',
    charPrompt: 'صف شخصيتك', charResult: 'شخصيتك',
    guildHall: 'قاعة النقابة',
    settings: 'الإعدادات', settingsDesc: 'إعدادات النقابة',
    guildDesc: 'الوصف', acceptance: 'القبول', saveSetting: 'حفظ', settingsSaved: 'تم الحفظ',
  },
  pt: {
    recommended: 'Recomendados', invite: 'Convidar', copied: 'Link copiado', searchPh: 'Buscar guilda por nome…',
    tag: 'Busca por Tag', search: 'Buscar', foundDesc: 'Funde sua própria guilda ou entre em um clube de colecionadores. Negocie junto para ganhar recompensas coletivas semanais.',
    found: 'Fundar', feeNote: 'Único · anti-spam', weeklyVol: 'Volume semanal', members: 'Membros',
    noRank: 'Sem limite de rank', accept: 'Admissão', auto: 'Auto', manual: 'Manual', info: 'Info', empty: 'Nenhuma guilda encontrada',
    rewards: ['Dividendos semanais', 'XP de contribuição', 'Emblema de prestígio', 'Acesso antecipado'],
    rewardDesc: ['Parte das taxas e royalties semanais', 'Ganhe pontos para subir a guilda', 'Títulos e papéis na guilda', 'Compre drops populares primeiro'],
    createTitle: 'Fundar nova guilda', guildName: 'Nome da guilda', focus: 'Foco', create: 'Criar', cancel: 'Cancelar', creating: 'Criando…',
    needLogin: 'Faça login para fundar uma guilda', createFail: 'Falha ao criar guilda, tente novamente',
    back: 'Guilda', checkin: 'Check-in', actAct: 'Atividades', actDecor: 'Decoração da Galeria', actDiv: 'Dividendos semanais',
    nVault: 'Cofre coletivo', nVaultSub: 'Co-propriedade de obras', nLeague: 'Liga de Guildas', nLeagueSub: 'Corrida de volume sazonal',
    nGallery: 'Galeria curada', nGallerySub: 'Coleção compartilhada', auction: 'Leilão da Guilda', membersBtn: 'Membros', chat: 'Chat da guilda',
    chatMsg: 'fundos prontos — vamos negociar',
    open: 'Aberto', noPref: 'Sem preferência', automatic: 'Automático', selective: 'Seletivo',
    weeklyAssist: 'Ajuda semanal', masteryRank: 'Mestria da Guilda', guildInfo: 'Info da Guilda',
    basicInfo: 'Informações básicas', memberInfo: 'Info',
    introduction: 'Introdução', foundingDate: 'Data de fundação', rankings: 'Rankings', activity: 'Atividade',
    rank: 'Rank', assistance: 'Ajuda', lastLogin: 'Último login', greeting: 'Saudação',
    attendance: 'Presença', areasOfExpertise: 'Áreas de especialização',
    tagCheckInDaily: 'Check-in diário', tagCheckIn3Days: 'Mínimo 3 dias/semana', tagFreeAttendance: 'Livre',
    tagNewbie: 'Amigável para novatos', tagTopGuild: 'Aspirante ao topo', tagArena: 'Especialistas em leilão',
    tagCasual: 'Casual', tagLastingRandom: 'Efeito aleatório', tagLasting247: 'Efeito 24/7',
    apply: 'Aplicar', reset: 'Redefinir', close: 'Fechar',
    totalVol: 'Volume total', auctionWin: 'Taxa de vitória', weeklyActive: 'Ativos semanais',
    emblem: 'Emblema', type: 'Tipo', selectToEnter: 'Selecionar para inserir',
    join: 'Entrar', leave: 'Sair da guilda', leaveConfirm: 'Sair desta guilda? Você não poderá entrar novamente por 12 horas.',
    cooldown: 'Espera', cooldownMsg: 'Você saiu recentemente. Reentrada disponível em',
    hours: 'h', minutes: 'm', joined: 'Entrou!', alreadyInGuild: 'Saia da sua guilda atual primeiro', loginRequired: 'Faça login para entrar ou criar uma guilda',
    charDesigner: 'Designer de personagem', generateChar: 'Gerar', generating: 'Gerando…',
    charPrompt: 'Descreva seu personagem', charResult: 'Seu personagem',
    guildHall: 'Salão da guilda',
    settings: 'Configurações', settingsDesc: 'Configuração da guilda',
    guildDesc: 'Descrição', acceptance: 'Aceitação', saveSetting: 'Salvar', settingsSaved: 'Salvo',
  },
}
type S = typeof EN

// ── Data ─────────────────────────────────────────────────────────
interface GuildMember {
  name: string; rank: string; assistance: number; lastLogin: string; greeting: string
}

interface GuildView extends Omit<ApiGuild, 'acceptance'> {
  level: number; weeklyVolume: number; maxMembers: number; acceptance: 'auto' | 'manual' | 'selective'
  tags: string[]; emblem: string; leaderMessage: string; weeklyAssistance: number
  auctionWinRate: number; foundingDate: string; introduction: string
  weeklyActive: number; totalVolume: number; guildMembers: GuildMember[]; ranking: number
}

const MOCK: GuildView[] = [
  {
    id: 'g1', name: 'BlueChipDAO', description: null, focus: 'Collectors', avatar_color: DARK.gold,
    member_count: 22, level: 8, weeklyVolume: 1240, maxMembers: 30, acceptance: 'auto',
    tags: ['Check-In Everyday', 'Arena Experts'], emblem: 'eagle-emblem',
    leaderMessage: 'We hunt blue chips together. Join the alpha.', weeklyAssistance: 18500,
    auctionWinRate: 72, foundingDate: '2025-03-15', introduction: 'Premier blue chip collectors guild. We share alpha, co-bid on auctions, and build wealth together.',
    weeklyActive: 20, totalVolume: 45200, ranking: 12,
    guildMembers: [
      { name: 'CryptoWhale', rank: 'Guild Master', assistance: 4200, lastLogin: '2h ago', greeting: 'Welcome aboard!' },
      { name: 'ArtHunter', rank: 'Officer', assistance: 3100, lastLogin: '5h ago', greeting: 'Let\'s find gems' },
      { name: 'DiamondHands', rank: 'Member', assistance: 2800, lastLogin: '1d ago', greeting: 'HODL gang' },
    ],
  },
  {
    id: 'g2', name: 'GenesisCircle', description: null, focus: 'Blue chip', avatar_color: DARK.goldLight,
    member_count: 14, level: 11, weeklyVolume: 3580, maxMembers: 27, acceptance: 'selective',
    tags: ['Wannabe the Top Guild', 'Check-In Everyday'], emblem: 'lion',
    leaderMessage: 'Only serious collectors. We aim for #1.', weeklyAssistance: 32000,
    auctionWinRate: 85, foundingDate: '2024-11-01', introduction: 'Top-tier guild focused on dominating the auction scene. Selective entry only.',
    weeklyActive: 14, totalVolume: 128000, ranking: 2,
    guildMembers: [
      { name: 'Genesis_King', rank: 'Guild Master', assistance: 8500, lastLogin: '30m ago', greeting: 'Excellence only' },
      { name: 'AlphaSeeker', rank: 'Officer', assistance: 6200, lastLogin: '1h ago', greeting: 'Let\'s dominate' },
    ],
  },
  {
    id: 'g3', name: 'NeoPatrons', description: null, focus: 'Newcomers', avatar_color: DARK.gold,
    member_count: 6, level: 3, weeklyVolume: 210, maxMembers: 16, acceptance: 'auto',
    tags: ['Newbie Friendly', 'Free Attendance', 'Casual'], emblem: 'panda',
    leaderMessage: 'Everyone is welcome here! Learn & grow.', weeklyAssistance: 2400,
    auctionWinRate: 25, foundingDate: '2026-01-20', introduction: 'A friendly space for newcomers to learn art trading.',
    weeklyActive: 5, totalVolume: 1800, ranking: 156,
    guildMembers: [
      { name: 'NewbieKing', rank: 'Guild Master', assistance: 800, lastLogin: '3h ago', greeting: 'Welcome!' },
    ],
  },
  {
    id: 'g4', name: 'PixelGuild', description: null, focus: 'Generative', avatar_color: DARK.gold,
    member_count: 18, level: 6, weeklyVolume: 920, maxMembers: 24, acceptance: 'auto',
    tags: ['At Least 3 Days a Week', 'Casual'], emblem: 'butterfly',
    leaderMessage: 'Generative art lovers unite!', weeklyAssistance: 11200,
    auctionWinRate: 48, foundingDate: '2025-06-10', introduction: 'For fans of generative, algorithmic, and AI-assisted art.',
    weeklyActive: 15, totalVolume: 22400, ranking: 38,
    guildMembers: [
      { name: 'PixelMaster', rank: 'Guild Master', assistance: 3200, lastLogin: '1h ago', greeting: 'Create & collect' },
      { name: 'GenArtFan', rank: 'Officer', assistance: 2600, lastLogin: '4h ago', greeting: 'Art is code' },
    ],
  },
  {
    id: 'g5', name: 'OldMasters', description: null, focus: 'Classical', avatar_color: DARK.gold,
    member_count: 11, level: 5, weeklyVolume: 640, maxMembers: 20, acceptance: 'selective',
    tags: ['Check-In Everyday', 'Lasting Effect 24/7'], emblem: 'griffin-symbol',
    leaderMessage: 'Timeless art, timeless value.', weeklyAssistance: 8900,
    auctionWinRate: 61, foundingDate: '2025-01-05', introduction: 'Classical art connoisseurs. We appreciate tradition and lasting value.',
    weeklyActive: 9, totalVolume: 35600, ranking: 21,
    guildMembers: [
      { name: 'ClassicCollector', rank: 'Guild Master', assistance: 2900, lastLogin: '2h ago', greeting: 'Tradition matters' },
      { name: 'ArtHistorian', rank: 'Member', assistance: 1800, lastLogin: '6h ago', greeting: 'Beauty endures' },
    ],
  },
  {
    id: 'g6', name: 'PhoenixRise', description: null, focus: 'Experimental', avatar_color: DARK.gold,
    member_count: 9, level: 4, weeklyVolume: 480, maxMembers: 18, acceptance: 'auto',
    tags: ['Newbie Friendly', 'Lasting Effect Random'], emblem: 'fox-head',
    leaderMessage: 'From ashes we rise. Experimental art ftw!', weeklyAssistance: 5600,
    auctionWinRate: 35, foundingDate: '2025-09-22', introduction: 'Pushing boundaries with experimental art. All welcome.',
    weeklyActive: 7, totalVolume: 8900, ranking: 85,
    guildMembers: [
      { name: 'Phoenix_Lead', rank: 'Guild Master', assistance: 2100, lastLogin: '45m ago', greeting: 'Rise up!' },
    ],
  },
  {
    id: 'g7', name: 'NightOwls', description: null, focus: 'Collectors', avatar_color: DARK.gold,
    member_count: 15, level: 7, weeklyVolume: 1100, maxMembers: 25, acceptance: 'auto',
    tags: ['Free Attendance', 'Arena Experts'], emblem: 'owl',
    leaderMessage: 'We trade after midnight. Night crawlers welcome.', weeklyAssistance: 14200,
    auctionWinRate: 58, foundingDate: '2025-04-18', introduction: 'Active during late hours. Auction snipers and night traders.',
    weeklyActive: 12, totalVolume: 38700, ranking: 18,
    guildMembers: [
      { name: 'NightHawk', rank: 'Guild Master', assistance: 3800, lastLogin: '1h ago', greeting: 'The night is ours' },
      { name: 'MoonBidder', rank: 'Officer', assistance: 2900, lastLogin: '3h ago', greeting: 'Late night alpha' },
    ],
  },
  {
    id: 'g8', name: 'DragonVault', description: null, focus: 'Blue chip', avatar_color: DARK.gold,
    member_count: 20, level: 9, weeklyVolume: 2100, maxMembers: 28, acceptance: 'selective',
    tags: ['Check-In Everyday', 'Wannabe the Top Guild'], emblem: 'dinosaur-rex',
    leaderMessage: 'Hoard the best. Dragon energy.', weeklyAssistance: 24500,
    auctionWinRate: 78, foundingDate: '2024-12-01', introduction: 'Top-performing guild with dragon-like tenacity. Selective admissions.',
    weeklyActive: 18, totalVolume: 95000, ranking: 5,
    guildMembers: [
      { name: 'DragonLord', rank: 'Guild Master', assistance: 6800, lastLogin: '20m ago', greeting: 'Breathe fire' },
      { name: 'ScaleKeeper', rank: 'Officer', assistance: 4500, lastLogin: '2h ago', greeting: 'Guard the vault' },
    ],
  },
]

function toView(g: ApiGuild): GuildView {
  const emblem = EMBLEMS[Math.abs(hashStr(g.name)) % EMBLEMS.length]
  return {
    ...g,
    level: g.level ?? Math.max(1, Math.round((g.member_count ?? 1) / 3)),
    weeklyVolume: g.weekly_volume_eth ?? 0,
    maxMembers: g.max_members ?? 30,
    acceptance: g.acceptance ?? 'auto',
    tags: g.focus ? [g.focus] : [],
    emblem,
    leaderMessage: g.description ?? '',
    weeklyAssistance: (g.weekly_volume_eth ?? 0) * 10,
    auctionWinRate: Math.round(Math.random() * 80 + 10),
    foundingDate: '2025-01-01',
    introduction: g.description ?? '',
    weeklyActive: g.member_count ?? 1,
    totalVolume: (g.weekly_volume_eth ?? 0) * 30,
    guildMembers: [],
    ranking: getRankNumber((g.weekly_volume_eth ?? 0) * 30, Math.round(Math.random() * 80 + 10)),
  }
}

function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

// ── Cooldown helpers ────────────────────────────────────────────
const _COOLDOWN_MS = 12 * 60 * 60 * 1000
const CK_JOINED = 'artcurve_guild_joined'
const CK_LEFT = 'artcurve_guild_left_at'

function getJoinedGuild(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CK_JOINED)
}
function setJoinedGuild(id: string | null) {
  if (id) localStorage.setItem(CK_JOINED, id)
  else localStorage.removeItem(CK_JOINED)
}
function _getLeftAt(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(CK_LEFT) || '0', 10)
}
function setLeftAt() { localStorage.setItem(CK_LEFT, String(Date.now())) }
function cooldownRemaining(): number {
  // DISABLED FOR TESTING
  return 0
  // const left = getLeftAt()
  // if (!left) return 0
  // return Math.max(0, COOLDOWN_MS - (Date.now() - left))
}
function formatCooldown(ms: number, s: S): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}${s.hours} ${m}${s.minutes}`
}

// ── Gemini API for character generation ─────────────────────────
async function generateCharacterImage(prompt: string): Promise<string | null> {
  try {
    const key = process.env.NEXT_PUBLIC_GEMINI_KEY
    if (!key) return null
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate a detailed character description as a 3D Pixar-style illustration prompt for an art guild member. The character should be a cute anthropomorphic cat in a fantasy guild setting. User's description: "${prompt}". Return ONLY the image generation prompt, nothing else. Make it vivid and detailed, under 300 chars.` }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 400 },
        }),
      },
    )
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  } catch { return null }
}

// ── Shared components ───────────────────────────────────────────
function Filigree({ w = '100%' }: { w?: string }) {
  const C = useC()
  return (
    <div style={{ position: 'relative', height: 1, width: w, margin: '12px auto', background: `linear-gradient(90deg,transparent,${C.lineGold},transparent)` }}>
      <span style={{ position: 'absolute', left: '50%', top: -3, width: 6, height: 6, marginLeft: -3, transform: 'rotate(45deg)', background: C.gold }} />
    </div>
  )
}

function GuildEmblem({ emblem, size = 48 }: { emblem: string; size?: number }) {
  const C = useC()
  const isDark = C.bg === DARK.bg
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1.5px solid ${C.gold}`, background: `radial-gradient(circle, ${C.gold}2E, ${C.panel2} 72%)`,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/guild/emblems/${emblem}.svg`} alt="" width={size * 0.6} height={size * 0.6} style={{ objectFit: 'contain', filter: isDark ? 'brightness(0) invert(0.82) sepia(0.3) saturate(2) hue-rotate(10deg)' : 'brightness(0) sepia(0.5) saturate(3) hue-rotate(10deg)' }} />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function TagChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  const C = useC()
  return (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.95 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 20,
        padding: '4px 12px', fontSize: 11, cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${active ? C.gold : C.line}`,
        color: active ? '#221905' : C.muted,
        background: active ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : 'transparent',
      }}>{label}</motion.button>
  )
}

// ── Guild row (Epic Seven style) ────────────────────────────────
function GuildRow({ g, s, onInfo, onJoin, onEnter, joinedId, cdRemaining }: { g: GuildView; s: S; onInfo: () => void; onJoin: (g: GuildView) => void; onEnter: () => void; joinedId: string | null; cdRemaining: number }) {
  const C = useC()
  const isJoined = joinedId === g.id
  const cd = cdRemaining
  const inOtherGuild = joinedId !== null && joinedId !== g.id
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ borderColor: C.gold, y: -1 }}
      onClick={onInfo}
      style={{
        display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12,
        background: C.panel, border: `1px solid ${C.line}`, cursor: 'pointer',
        transition: 'border-color 0.2s', alignItems: 'center',
      }}>
      <GuildEmblem emblem={g.emblem} size={52} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.goldLight, background: `${C.gold}1F`, borderRadius: 6, padding: '1px 8px' }}>
            Lv.{g.level}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{g.name}</span>
          <span style={{ fontSize: 11, color: C.gold, marginLeft: 'auto', fontWeight: 600 }}>
            #{g.ranking}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.muted, marginBottom: 5 }}>
          <span>{s.weeklyAssist}: <span style={{ color: C.ink }}>{g.weeklyAssistance.toLocaleString()}</span></span>
          <span>{s.masteryRank}: <span style={{ color: C.ink }}>#{g.ranking}</span></span>
          <span>{s.members}: <span style={{ color: C.ink }}>{g.member_count}/{g.maxMembers}</span></span>
        </div>

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          &ldquo;{g.leaderMessage}&rdquo;
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {g.tags.map((t) => <TagChip key={t} label={t} active />)}
          <TagChip label={g.acceptance === 'auto' ? s.automatic : g.acceptance === 'selective' ? s.selective : s.manual} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'stretch' }}>
        {!isJoined ? (
          <motion.button type="button" onClick={(e) => { e.stopPropagation(); if (!inOtherGuild && cd === 0) onJoin(g) }}
            whileTap={!inOtherGuild && cd === 0 ? { scale: 0.96 } : {}} whileHover={!inOtherGuild && cd === 0 ? { scale: 1.03 } : {}}
            title={cd > 0 ? `${s.cooldownMsg} ${formatCooldown(cd, s)}` : inOtherGuild ? s.alreadyInGuild : ''}
            style={{ fontFamily: SERIF, borderRadius: 9, padding: '8px 18px', fontSize: 12, fontWeight: 600,
              cursor: !inOtherGuild && cd === 0 ? 'pointer' : 'not-allowed',
              color: !inOtherGuild && cd === 0 ? '#221905' : C.muted,
              background: !inOtherGuild && cd === 0 ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : 'transparent',
              border: `1px solid ${!inOtherGuild && cd === 0 ? C.gold : C.line}`,
              opacity: inOtherGuild || cd > 0 ? 0.45 : 1 }}>
            {cd > 0 ? <><IconClock size={12} style={{ verticalAlign: -1, marginRight: 3 }} />{s.cooldown}</> : s.join}
          </motion.button>
        ) : (
          <motion.button type="button" onClick={(e) => { e.stopPropagation(); onEnter() }} whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}
            style={{ fontFamily: SERIF, borderRadius: 9, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: '#221905', background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, border: 'none', textAlign: 'center' }}>
            {s.guildHall}
          </motion.button>
        )}
        <motion.button type="button" onClick={(e) => { e.stopPropagation(); onInfo() }} whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}
          style={{ fontFamily: SERIF, borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            color: '#221905', background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, border: 'none', textAlign: 'center' }}>{s.info}</motion.button>
      </div>
    </motion.div>
  )
}

// ── Tag Search modal ────────────────────────────────────────────
function TagSearchModal({ s, activeTags, onApply, onClose }: { s: S; activeTags: string[]; onApply: (tags: string[]) => void; onClose: () => void }) {
  const C = useC()
  const [selected, setSelected] = useState<string[]>(activeTags)
  const toggle = (t: string) => setSelected((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])

  const attendanceTags = [
    { key: 'Check-In Everyday', label: s.tagCheckInDaily },
    { key: 'At Least 3 Days a Week', label: s.tagCheckIn3Days },
    { key: 'Free Attendance', label: s.tagFreeAttendance },
  ]
  const expertiseTags = [
    { key: 'Newbie Friendly', label: s.tagNewbie },
    { key: 'Wannabe the Top Guild', label: s.tagTopGuild },
    { key: 'Arena Experts', label: s.tagArena },
    { key: 'Casual', label: s.tagCasual },
    { key: 'Lasting Effect Random', label: s.tagLastingRandom },
    { key: 'Lasting Effect 24/7', label: s.tagLasting247 },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ width: 480, maxWidth: '100%', background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
          <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.goldLight }}>{s.tag}</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.gold, marginBottom: 10 }}>{s.attendance}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
            {attendanceTags.map((t) => <TagChip key={t.key} label={t.label} active={selected.includes(t.key)} onClick={() => toggle(t.key)} />)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.gold, marginBottom: 10 }}>{s.areasOfExpertise}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
            {expertiseTags.map((t) => <TagChip key={t.key} label={t.label} active={selected.includes(t.key)} onClick={() => toggle(t.key)} />)}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setSelected([])} style={{ borderRadius: 9, padding: '9px 16px', fontSize: 12, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.line}`, color: C.ink }}>{s.reset}</button>
            <button type="button" onClick={() => { onApply(selected); onClose() }}
              style={{ fontFamily: SERIF, borderRadius: 9, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#221905', background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, border: 'none' }}>{s.apply}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Guild Information modal ─────────────────────────────────────
function GuildInfoModal({ g, s, onClose }: { g: GuildView; s: S; onClose: () => void }) {
  const C = useC()
  const [tab, setTab] = useState<'basic' | 'info'>('basic')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ width: 560, maxWidth: '100%', maxHeight: '80vh', background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: `1px solid ${C.line}` }}>
          <GuildEmblem emblem={g.emblem} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.goldLight }}>Lv.{g.level}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{g.name}</span>
              <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>#{g.ranking}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.members}: {g.member_count}/{g.maxMembers} · {s.accept}: {g.acceptance === 'auto' ? s.automatic : g.acceptance === 'selective' ? s.selective : s.manual}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><IconX size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}` }}>
          {(['basic', 'info'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                color: tab === t ? C.gold : C.muted, background: 'transparent', border: 'none',
                borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent',
              }}>{t === 'basic' ? s.basicInfo : s.memberInfo}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {tab === 'basic' ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 6 }}>{s.introduction}</div>
                <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>{g.introduction}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: C.panel2, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}><IconCalendar size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{s.foundingDate}</div>
                  <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{g.foundingDate}</div>
                </div>
                <div style={{ background: C.panel2, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}><IconTrophy size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{s.rankings}</div>
                  <div style={{ fontSize: 14, color: C.gold, fontWeight: 600 }}>#{g.ranking}</div>
                </div>
                <div style={{ background: C.panel2, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}><IconFlame size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{s.totalVol}</div>
                  <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{g.totalVolume.toLocaleString()} ETH</div>
                </div>
                <div style={{ background: C.panel2, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}><IconTarget size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{s.auctionWin}</div>
                  <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{g.auctionWinRate}%</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 6 }}>{s.activity}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
                  <span>{s.weeklyActive}: <span style={{ color: C.ink }}>{g.weeklyActive}/{g.member_count}</span></span>
                  <span>{s.weeklyVol}: <span style={{ color: C.ink }}>{g.weeklyVolume.toLocaleString()} ETH</span></span>
                  <span>{s.weeklyAssist}: <span style={{ color: C.ink }}>{g.weeklyAssistance.toLocaleString()}</span></span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 6 }}>Tags</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {g.tags.map((t) => <TagChip key={t} label={t} active />)}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr', gap: 0, fontSize: 11, color: C.muted, padding: '0 0 8px', borderBottom: `1px solid ${C.line}` }}>
                <span>{s.members}</span><span>{s.rank}</span><span>{s.assistance}</span><span>{s.lastLogin}</span>
              </div>
              {g.guildMembers.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr', gap: 0, padding: '10px 0', borderBottom: `1px solid ${C.line}`, fontSize: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ color: C.ink, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{m.greeting}</div>
                  </div>
                  <span style={{ color: m.rank === 'Guild Master' ? C.gold : m.rank === 'Officer' ? C.goldLight : C.ink }}>{m.rank}</span>
                  <span style={{ color: C.ink }}>{m.assistance.toLocaleString()}</span>
                  <span style={{ color: C.muted }}>{m.lastLogin}</span>
                </div>
              ))}
              {g.guildMembers.length === 0 && (
                <div style={{ textAlign: 'center', color: C.muted, padding: '30px 0', fontSize: 13 }}>{s.empty}</div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Create guild modal (Epic Seven style) ───────────────────────
const FOCUS_OPTS = ['Collectors', 'Blue chip', 'Generative', 'Classical', 'Experimental', 'Newcomers']
const EMBLEM_PICKS = ['lion', 'eagle-emblem', 'wolf-head', 'owl', 'tiger', 'bear-head', 'griffin-symbol', 'dinosaur-rex',
  'fox-head', 'bull', 'stag-head', 'raven', 'swan', 'seahorse', 'pegasus', 'chess-knight',
  'scorpion', 'octopus', 'shark-jaws', 'butterfly', 'panda', 'gorilla', 'elephant', 'dolphin']

function CreateGuildModal({ s, onClose, onCreated }: { s: S; onClose: () => void; onCreated: (mock?: GuildView) => void }) {
  const C = useC()
  const [name, setName] = useState('')
  const [intro, setIntro] = useState('')
  const [focus, setFocus] = useState(FOCUS_OPTS[0])
  const [emblem, setEmblem] = useState(EMBLEM_PICKS[0])
  const [showEmblemPicker, setShowEmblemPicker] = useState(false)
  const [acceptance, setAcceptance] = useState<'auto' | 'selective'>('auto')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true); setErr(null)
    try {
      await guildService.create({ name: name.trim(), description: intro.trim() || undefined, focus })
      onCreated()
    } catch {
      const mock: GuildView = {
        id: `g-${Date.now()}`, name: name.trim(), description: intro.trim() || null, focus,
        avatar_color: DARK.gold, member_count: 1, level: 1, weeklyVolume: 0, maxMembers: 30,
        acceptance, tags: [focus], emblem, leaderMessage: intro.trim() || '',
        weeklyAssistance: 0, auctionWinRate: 0, foundingDate: new Date().toISOString().slice(0, 10),
        introduction: intro.trim() || '', weeklyActive: 1, totalVolume: 0, guildMembers: [], ranking: 999,
      }
      onCreated(mock)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ width: 580, maxWidth: '100%', background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.line}` }}>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.goldLight }}>Guild Foundation</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: 20, padding: 20 }}>
          {/* Left: Emblem */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{s.emblem}</div>
            <div style={{
              width: 120, height: 120, borderRadius: 14, border: `2px solid ${C.gold}`,
              background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/guild/emblems/${emblem}.svg`} alt="" width={72} height={72} style={{ objectFit: 'contain', filter: 'brightness(0) invert(0.9) sepia(0.2) saturate(1.5) hue-rotate(10deg)' }} />
            </div>
            <button type="button" onClick={() => setShowEmblemPicker(!showEmblemPicker)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 9, padding: '6px 14px', fontSize: 11, cursor: 'pointer',
                border: `1px solid ${C.lineGold}`, color: C.ink, background: 'transparent' }}>
              <IconRefresh size={13} color={C.gold} /> {s.emblem}
            </button>
          </div>

          {/* Right: Form fields */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, minWidth: 80 }}>{s.guildName}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={s.selectToEnter}
                style={{ flex: 1, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: '9px 12px', color: C.ink, fontSize: 13, outline: 'none' }} />
            </div>

            {/* Introduction */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, minWidth: 80, paddingTop: 8 }}>{s.introduction}</span>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder={s.selectToEnter} rows={3}
                style={{ flex: 1, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: '9px 12px', color: C.ink, fontSize: 13, outline: 'none', resize: 'none' }} />
            </div>

            {/* Tag (focus) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, minWidth: 80, paddingTop: 6 }}>Tag</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FOCUS_OPTS.map((f) => (
                  <button key={f} type="button" onClick={() => setFocus(f)}
                    style={{ borderRadius: 20, padding: '5px 14px', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${focus === f ? C.gold : C.line}`, color: focus === f ? '#221905' : C.muted,
                      background: focus === f ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : 'transparent',
                      fontWeight: focus === f ? 600 : 400 }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, minWidth: 80 }}>{s.type}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['auto', 'selective'] as const).map((val) => (
                  <button key={val} type="button" onClick={() => setAcceptance(val)}
                    style={{ borderRadius: 9, padding: '6px 16px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${acceptance === val ? C.gold : C.line}`,
                      color: acceptance === val ? '#221905' : C.muted,
                      background: acceptance === val ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : 'transparent',
                      fontWeight: acceptance === val ? 600 : 400 }}>
                    {val === 'auto' ? `${s.open}: ${s.automatic}` : s.selective}
                  </button>
                ))}
              </div>
            </div>

            {err && <div style={{ fontSize: 12, color: '#e87a7a' }}>{err}</div>}
          </div>
        </div>

        {/* Emblem picker grid */}
        <AnimatePresence>
          {showEmblemPicker && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', borderTop: `1px solid ${C.line}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, padding: 14 }}>
                {EMBLEM_PICKS.map((e) => (
                  <button key={e} type="button" onClick={() => { setEmblem(e); setShowEmblemPicker(false) }}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: emblem === e ? `2px solid ${C.gold}` : `1px solid ${C.line}`, background: emblem === e ? `${C.gold}26` : C.panel2,
                    }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/guild/emblems/${e}.svg`} alt="" width={28} height={28} style={{ objectFit: 'contain', filter: 'brightness(0) invert(0.82) sepia(0.3) saturate(2) hue-rotate(10deg)' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer: Cancel + Found */}
        <div style={{ display: 'flex', borderTop: `1px solid ${C.line}` }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '14px 0', fontSize: 14, cursor: 'pointer', background: C.panel2, border: 'none', color: C.ink, borderRight: `1px solid ${C.line}` }}>{s.cancel}</button>
          <button type="button" onClick={submit} disabled={!name.trim() || busy}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: name.trim() && !busy ? 'pointer' : 'default',
              fontFamily: SERIF, color: '#221905', background: name.trim() ? `linear-gradient(180deg,${C.goldLight},${C.gold})` : C.line, border: 'none', opacity: busy ? 0.7 : 1 }}>
            <IconCoin size={16} /> {GUILD_FOUNDATION_FEE_ETH} ETH · {busy ? s.creating : s.found}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Finder view ─────────────────────────────────────────────────
function FinderView({ guilds, s, onEnter, onRefresh, onCreate, joinedId, onJoin, onLeaveGuild, t }: { guilds: GuildView[]; s: S; onEnter: (g: GuildView) => void; onRefresh: () => void; onCreate: () => void; joinedId: string | null; onJoin: (g: GuildView) => void; onLeaveGuild: () => void; t: Colors }) {
  const C = useC()
  const [cdRemaining, setCdRemaining] = useState(() => cooldownRemaining())
  useEffect(() => {
    const t = setInterval(() => setCdRemaining(cooldownRemaining()), 30000)
    return () => clearInterval(t)
  }, [])
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [openFilter, setOpenFilter] = useState<'all' | 'auto' | 'selective'>('all')
  const [showOpenDrop, setShowOpenDrop] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [infoGuild, setInfoGuild] = useState<GuildView | null>(null)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const REWARD_ICONS = [IconCoin, IconTrendingUp, IconAward, IconGift]

  const filtered = useMemo(() => {
    let list = guilds
    if (query.trim()) list = list.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()))
    if (openFilter === 'auto') list = list.filter((g) => g.acceptance === 'auto')
    if (openFilter === 'selective') list = list.filter((g) => g.acceptance === 'selective')
    if (activeTags.length > 0) list = list.filter((g) => activeTags.some((t) => g.tags.includes(t)))
    return list
  }, [guilds, query, openFilter, activeTags])

  const invite = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/guild` : '/guild'
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, padding: '26px 20px 0', maxWidth: 1180, margin: '0 auto', height: '100%', overflow: 'hidden' }}>
        {/* Foundation — scroll riêng */}
        <div style={{
          position: 'relative', borderRadius: 16, textAlign: 'center', background: t.bg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
        <div style={{ padding: '16px 16px 12px', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Banner background fill */}
          {t.bannerBg !== 'none' && <div style={{ position: 'absolute', inset: 0, background: t.bannerBg, pointerEvents: 'none' }} />}
          <motion.div
            animate={t.showFrost ? { boxShadow: ['inset 0 0 30px rgba(100,160,220,0.0)', 'inset 0 0 50px rgba(100,160,220,0.25)', 'inset 0 0 30px rgba(100,160,220,0.0)'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, backgroundImage: `url(${t.banner})`, backgroundSize: t.bannerFit, backgroundPosition: t.bannerPos, backgroundRepeat: 'no-repeat', opacity: 1, pointerEvents: 'none' }}
          />
          {/* Light mode tint overlay */}
          {t.bannerTint !== 'none' && <div style={{ position: 'absolute', inset: 0, background: t.bannerTint, pointerEvents: 'none' }} />}
          {/* Gold edge lines */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', background: t.gold, zIndex: 2 }} />
          <div style={{ position: 'absolute', right: 0, top: 0, width: 2, height: '100%', background: t.gold, zIndex: 2 }} />
          {t.showFrost && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${t.bg}00 40%, ${t.bg}B3 100%)`, pointerEvents: 'none' }} />}

          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, letterSpacing: 2, color: t.showFrost ? t.goldLight : '#F0E0C0', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>Guild Foundation</div>
            <div style={{ width: '70%', height: 1, margin: '10px auto 0', background: `linear-gradient(90deg, transparent, ${t.gold}, transparent)` }} />

            {/* Crest + frost mist rising from below */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '10px auto 8px' }}>
              <motion.img src={t.crest} alt="Guild crest"
                animate={t.showFrost
                  ? { filter: ['drop-shadow(0 0 16px rgba(201,169,110,0.4))', 'drop-shadow(0 0 28px rgba(201,169,110,0.7))', 'drop-shadow(0 0 16px rgba(201,169,110,0.4))'] }
                  : { filter: ['drop-shadow(0 0 12px rgba(255,200,100,0.3))', 'drop-shadow(0 0 22px rgba(255,200,100,0.55))', 'drop-shadow(0 0 12px rgba(255,200,100,0.3))'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ height: 300, objectFit: 'contain', position: 'relative', zIndex: 2 }}
              />
              {/* Frost mist rising from bottom of crest */}
              {t.showFrost && <div style={{ position: 'absolute', bottom: -40, left: '-10%', right: '-10%', height: 200, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
                {/* Wide base fog layer */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [0.9, 1.1, 0.9], y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', bottom: 0, left: '-5%', right: '-5%', height: 80,
                    background: 'radial-gradient(ellipse 120% 100% at 50% 100%, rgba(180,215,245,0.35), transparent 70%)',
                    filter: 'blur(16px)',
                  }}
                />
                {/* Rising mist columns */}
                {[...Array(8)].map((_, i) => (
                  <motion.div key={i}
                    animate={{
                      y: [20, -120 - i * 10],
                      opacity: [0, 0.5, 0.8, 0.6, 0],
                      scaleX: [0.6, 1 + i * 0.08, 1.6],
                      scaleY: [1, 1.3, 0.8],
                    }}
                    transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: [0.16, 1, 0.3, 1], delay: i * 0.45 }}
                    style={{
                      position: 'absolute', bottom: 10,
                      left: `${5 + i * 11.5}%`,
                      width: 60 + i * 5, height: 45,
                      borderRadius: '50%',
                      background: `radial-gradient(ellipse, rgba(180,215,245,${0.4 - i * 0.03}), transparent 65%)`,
                      filter: `blur(${10 + i}px)`,
                    }}
                  />
                ))}
                {/* Gold spark wisps */}
                {[...Array(5)].map((_, i) => (
                  <motion.div key={`sp${i}`}
                    animate={{
                      y: [30, -100 - i * 25],
                      x: [0, (i % 2 === 0 ? 15 : -15)],
                      opacity: [0, 0.7, 0.9, 0.4, 0],
                    }}
                    transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: 'easeOut', delay: i * 0.7 + 0.2 }}
                    style={{
                      position: 'absolute', bottom: 5,
                      left: `${12 + i * 18}%`,
                      width: 3, height: 3, borderRadius: '50%',
                      background: t.gold,
                      boxShadow: `0 0 8px 3px ${t.gold}60`,
                    }}
                  />
                ))}
                {/* Ambient cold glow pulsing */}
                <motion.div
                  animate={{ opacity: [0.15, 0.45, 0.15], scaleY: [0.9, 1.2, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', bottom: -15, left: '0%', right: '0%', height: 60,
                    background: 'linear-gradient(0deg, rgba(180,215,245,0.3), rgba(180,215,245,0.08), transparent)',
                    filter: 'blur(18px)', borderRadius: '50%',
                  }}
                />
              </div>}
              {/* Light-mode ember sparks */}
              {!t.showFrost && <div style={{ position: 'absolute', bottom: -20, left: '5%', right: '5%', height: 160, pointerEvents: 'none', zIndex: 1 }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div key={`em${i}`}
                    animate={{ y: [20, -100 - i * 15], x: [0, (i % 2 === 0 ? 10 : -10)], opacity: [0, 0.8, 0.5, 0] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeOut', delay: i * 0.6 }}
                    style={{ position: 'absolute', bottom: 0, left: `${10 + i * 15}%`, width: 3, height: 3, borderRadius: '50%',
                      background: '#FFCC66', boxShadow: '0 0 6px 2px rgba(255,170,50,0.5)' }}
                  />
                ))}
              </div>}
            </div>

            <p style={{ fontSize: 13, color: t.showFrost ? t.muted : 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 14px', padding: '0 10px' }}>{s.foundDesc}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {s.rewards.map((label, i) => {
                const Icon = REWARD_ICONS[i]
                return (
                  <div key={i} title={s.rewardDesc[i]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      border: `1px solid ${t.lineGold}`,
                      background: t.showFrost ? `radial-gradient(circle, ${t.gold}1F, ${t.panel2} 70%)` : 'rgba(0,0,0,0.25)',
                      backdropFilter: t.showFrost ? 'none' : 'blur(4px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} color={t.showFrost ? t.gold : t.goldLight} />
                    </div>
                    <span style={{ fontSize: 9, color: t.showFrost ? t.muted : 'rgba(255,255,255,0.7)', lineHeight: 1.2, textAlign: 'center', textTransform: 'uppercase' as const, maxWidth: 70 }}>{label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.lineGold}`, borderRadius: 11, overflow: 'hidden', background: t.showFrost ? `${t.panel2}99` : 'rgba(0,0,0,0.3)', backdropFilter: t.showFrost ? 'none' : 'blur(4px)', maxWidth: 280, margin: '0 auto' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                <IconCoin size={16} color={t.gold} /><span style={{ fontSize: 14, color: t.showFrost ? t.ink : '#F0EBE1' }}>{GUILD_FOUNDATION_FEE_ETH} ETH</span>
              </div>
              <motion.button type="button" onClick={onCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ fontFamily: SERIF, background: `linear-gradient(180deg,${t.goldLight},${t.gold})`, color: '#221905', fontSize: 14, fontWeight: 600, padding: '12px 20px', cursor: 'pointer', border: 'none' }}>{s.found}</motion.button>
            </div>
            <div style={{ fontSize: 10.5, color: t.showFrost ? t.muted : 'rgba(255,255,255,0.55)', marginTop: 9 }}>{s.feeNote}</div>
          </div>
        </div></div>

        {/* Recommended */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: SERIF, fontSize: 23, fontWeight: 600, letterSpacing: 1, color: t.goldLight }}>{s.recommended}</span>
            <motion.button type="button" onClick={invite} whileTap={{ scale: 0.96 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${t.lineGold}`, borderRadius: 9, padding: '7px 13px', fontSize: 12, color: t.ink, background: 'transparent', cursor: 'pointer' }}>
              {copied ? <IconCheck size={15} color={t.green} /> : <IconMail size={15} color={t.gold} />}{copied ? s.copied : s.invite}
            </motion.button>
          </div>
          <Filigree />

          {/* Filter toolbar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            {/* Open dropdown */}
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShowOpenDrop(!showOpenDrop)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${t.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 12, color: t.ink, background: 'transparent', cursor: 'pointer' }}>
                {s.open}: {openFilter === 'all' ? s.noPref : openFilter === 'auto' ? s.automatic : s.selective}
                <IconChevronDown size={13} color={t.gold} />
              </button>
              {showOpenDrop && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: t.panel, border: `1px solid ${t.lineGold}`, borderRadius: 10, overflow: 'hidden', zIndex: 10, minWidth: 160 }}>
                  {([['all', s.noPref], ['auto', s.automatic], ['selective', s.selective]] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => { setOpenFilter(val); setShowOpenDrop(false) }}
                      style={{ display: 'block', width: '100%', padding: '9px 14px', fontSize: 12, textAlign: 'left', cursor: 'pointer', border: 'none',
                        color: openFilter === val ? t.gold : t.ink, background: openFilter === val ? `${t.gold}18` : 'transparent' }}>{label}</button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={() => setTagModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${activeTags.length > 0 ? t.gold : t.line}`, borderRadius: 9, padding: '8px 12px', fontSize: 11, color: activeTags.length > 0 ? t.gold : t.muted, background: activeTags.length > 0 ? `${t.gold}14` : 'transparent', cursor: 'pointer' }}>
              <IconHash size={14} color={t.gold} />{s.tag}{activeTags.length > 0 && ` (${activeTags.length})`}
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${t.line}`, borderRadius: 9, padding: '0 12px' }}>
              <IconSearch size={15} color={t.gold} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={s.searchPh}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.ink, fontSize: 12, padding: '9px 0' }} />
            </div>

            <button type="button" onClick={onRefresh} aria-label="Refresh" style={{ display: 'flex', alignItems: 'center', border: `1px solid ${t.line}`, borderRadius: 9, padding: '8px 11px', color: t.muted, background: 'transparent', cursor: 'pointer' }}>
              <IconRefresh size={14} color={t.gold} />
            </button>
          </div>

          {/* Guild list — only this area scrolls */}
          <div data-lenis-prevent style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: 4, scrollbarWidth: 'thin', scrollbarColor: `${t.gold}40 transparent` }}>
            <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
              {filtered.length === 0
                ? <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '30px 0' }}>{s.empty}</div>
                : filtered.map((g) => <GuildRow key={g.id} g={g} s={s} onInfo={() => setInfoGuild(g)} onJoin={onJoin} onEnter={() => onEnter(g)} joinedId={joinedId} cdRemaining={cdRemaining} />)}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tagModalOpen && <TagSearchModal key="tsm" s={s} activeTags={activeTags} onApply={setActiveTags} onClose={() => setTagModalOpen(false)} />}
        {infoGuild && <GuildInfoModal key="gim" g={infoGuild} s={s} onClose={() => setInfoGuild(null)} />}
        {leaveConfirm && (
          <motion.div key="lc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setLeaveConfirm(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              style={{ background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 14, padding: 24, maxWidth: 400, textAlign: 'center' }}>
              <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.goldLight, marginBottom: 12 }}>{s.leave}</div>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 20, lineHeight: 1.6 }}>{s.leaveConfirm}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="button" onClick={() => setLeaveConfirm(false)}
                  style={{ borderRadius: 9, padding: '10px 24px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.line}`, color: C.ink }}>{s.cancel}</button>
                <button type="button" onClick={() => { onLeaveGuild(); setLeaveConfirm(false) }}
                  style={{ borderRadius: 9, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.red, border: 'none', color: '#fff' }}>{s.leave}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Hall ─────────────────────────────────────────────────────────
function _FeatureNode({ icon, title, sub, featured }: { icon: React.ReactNode; title: string; sub: string; featured?: boolean }) {
  const C = useC()
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CharacterDesigner({ s }: { s: S }) {
  const C = useC()
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    const r = await generateCharacterImage(prompt.trim())
    setResult(r)
    setBusy(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: 14, padding: 18, marginTop: 16, maxWidth: 600 }}>
      <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.goldLight, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconWand size={20} color={C.gold} />{s.charDesigner}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={s.charPrompt}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
          style={{ flex: 1, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: '10px 14px', color: C.ink, fontSize: 13, outline: 'none' }} />
        <motion.button type="button" onClick={generate} disabled={busy || !prompt.trim()} whileTap={{ scale: 0.96 }}
          style={{ fontFamily: SERIF, borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
            color: '#221905', background: `linear-gradient(180deg,${C.goldLight},${C.gold})`, border: 'none', opacity: busy ? 0.6 : 1 }}>
          {busy ? s.generating : s.generateChar}
        </motion.button>
      </div>
      {result && (
        <div style={{ background: C.panel2, borderRadius: 10, padding: 14, border: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 6 }}>{s.charResult}</div>
          <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{result}</div>
        </div>
      )}
    </motion.div>
  )
}

function resolveWsUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try { const u = new URL(api); return `${u.protocol}//${u.host}` } catch { return 'http://localhost:3001' }
}

function HallView({ guild, s, onLeave, onLeaveGuild }: { guild: GuildView; s: S; onLeave: () => void; onLeaveGuild: () => void }) {
  const C = useC()
  const jwt = useAuthStore(s2 => s2.jwt)
  const currentUser = useAuthStore(s2 => s2.user)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [activeSection, setActiveSection] = useState('vault')
  const [settingsName, setSettingsName] = useState(guild.name)
  const [settingsDesc, setSettingsDesc] = useState('')
  const [settingsAcceptance, setSettingsAcceptance] = useState<'auto' | 'manual'>('auto')
  const [settingsEmblem, setSettingsEmblem] = useState(guild.emblem)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace"

  // ── Real data states ──
  const [members, setMembers] = useState<ApiGuildMember[]>([])
  const [chatMessages, setChatMessages] = useState<ApiGuildMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [_announcements, setAnnouncements] = useState<ApiGuildAnnouncement[]>([])
  const [analytics, setAnalytics] = useState<ApiGuildAnalytics | null>(null)
  const [activities, setActivities] = useState<ApiGuildActivity[]>([])
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Determine role from real API
  const myMembership = members.find(m => m.user_id === currentUser?.id)
  const isGuildMaster = myMembership?.role === 'OWNER' || myMembership?.role === 'Guild Master'
  const _isModerator = isGuildMaster || myMembership?.role === 'MODERATOR'

  // ── Fetch real data ──
  useEffect(() => {
    guildService.members(guild.id).then(res => setMembers(res.data ?? [])).catch(() => {})
    guildService.messages(guild.id, 50).then(msgs => setChatMessages(msgs.reverse())).catch(() => {})
    guildService.announcements(guild.id).then(setAnnouncements).catch(() => {})
    guildService.analytics(guild.id).then(setAnalytics).catch(() => {})
    guildService.activity(guild.id).then(setActivities).catch(() => {})
    guildService.detail(guild.id).then(d => {
      if (d.description) setSettingsDesc(d.description)
      if (d.acceptance) setSettingsAcceptance(d.acceptance)
    }).catch(() => {})
  }, [guild.id])

  // ── WebSocket for guild chat ──
  useEffect(() => {
    if (!jwt) return
    const socket = io(`${resolveWsUrl()}/events`, {
      auth: { token: jwt },
      transports: ['websocket', 'polling'],
      reconnection: true,
    })
    socketRef.current = socket
    socket.on('connect', () => { socket.emit('guild:subscribe', { guild_id: guild.id }) })
    socket.on('guild:message:new', (msg: ApiGuildMessage) => {
      setChatMessages(prev => [...prev, msg])
    })
    return () => {
      socket.emit('guild:unsubscribe', { guild_id: guild.id })
      socket.disconnect()
      socketRef.current = null
    }
  }, [jwt, guild.id])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [chatMessages])

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || !jwt) return
    setChatInput('')
    try { await guildService.postMessage(guild.id, text) } catch { /* broadcast adds it */ }
  }, [chatInput, jwt, guild.id])

  const totalVol = analytics ? analytics.total_volume_eth.toFixed(0) : (guild.weeklyAssistance * 2.4).toFixed(0)
  const weeklyVol = analytics ? analytics.weekly_volume_eth.toFixed(2) : (guild.weeklyAssistance * 0.067).toFixed(0)
  const winRate = Math.min(93, 48 + guild.level * 2.3)
  const R = 6

  const sideMenuItems = [
    { key: 'vault', icon: <IconBuildingBank size={15} />, label: s.nVault },
    { key: 'league', icon: <IconTrophy size={15} />, label: s.nLeague },
    { key: 'gallery', icon: <IconPhoto size={15} />, label: s.nGallery },
    { key: 'auction', icon: <IconGavel size={15} />, label: s.auction },
    { key: 'members', icon: <IconUsers size={15} />, label: s.membersBtn },
    { key: 'chat', icon: <IconMessage2 size={15} />, label: s.chat },
    { key: 'activities', icon: <IconChecklist size={15} />, label: s.actAct },
    { key: 'dividends', icon: <IconGift size={15} />, label: s.actDiv },
    ...(isGuildMaster ? [{ key: 'settings', icon: <IconSettings size={15} />, label: s.settings }] : []),
  ]

  const TH: React.CSSProperties = { fontSize: 10, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const NUM: React.CSSProperties = { fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }
  const INPUT: React.CSSProperties = { width: '100%', padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: R, background: C.bg, color: C.ink, fontSize: 13, outline: 'none' }

  const handleSaveSettings = async () => {
    try {
      await guildService.update(guild.id, {
        name: settingsName,
        description: settingsDesc,
        acceptance: settingsAcceptance,
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch {
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    }
  }

  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: R + 2, overflow: 'hidden', maxWidth: 1200, margin: '16px auto', background: C.bg }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', borderBottom: `1px solid ${C.line}`, background: C.panel2 }}>
        <button type="button" onClick={onLeave}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: C.ink, background: 'none', border: 'none', cursor: 'pointer' }}>
          <IconChevronLeft size={15} color={C.gold} />{s.back}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GuildEmblem emblem={guild.emblem} size={20} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{guild.name}</span>
          <span style={{ ...NUM, fontSize: 11, color: C.gold }}>Lv.{guild.level}</span>
          <span style={{ ...NUM, fontSize: 11, color: C.muted }}>#{guild.ranking}</span>
        </div>
        <button type="button" onClick={() => setShowLeaveConfirm(true)}
          style={{ padding: '4px 12px', fontSize: 11, fontWeight: 500, color: C.red, background: 'none', border: `1px solid ${C.red}30`, borderRadius: R, cursor: 'pointer' }}>
          {s.leave}
        </button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 160px)', minHeight: 480 }}>
        {/* Sidebar */}
        <div style={{ width: 180, borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', background: C.panel2, flexShrink: 0 }}>
          {/* Guild identity + stats */}
          <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <GuildEmblem emblem={guild.emblem} size={34} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{guild.name}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Lv.{guild.level} - {guild.member_count}/{guild.maxMembers} {s.membersBtn.toLowerCase()}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 0 0', borderTop: `1px solid ${C.line}` }}>
              <div>
                <div style={{ ...NUM, fontSize: 14, fontWeight: 700, color: C.gold }}>{(Number(totalVol) / 1000).toFixed(1)}K</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{s.totalVol}</div>
              </div>
              <div>
                <div style={{ ...NUM, fontSize: 14, fontWeight: 700, color: C.ink }}>#{guild.ranking}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{s.rank}</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '6px 0', overflow: 'auto' }}>
            {sideMenuItems.map((item, _idx) => {
              const isActive = activeSection === item.key
              const isSettingsItem = item.key === 'settings'
              return (
                <div key={item.key}>
                  {isSettingsItem && <div style={{ height: 1, background: C.line, margin: '6px 12px' }} />}
                  <button type="button" onClick={() => setActiveSection(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', fontSize: 12,
                      fontWeight: isActive ? 600 : 400, color: isActive ? C.gold : C.muted,
                      background: isActive ? `${C.gold}10` : 'transparent',
                      border: 'none', borderLeft: `2px solid ${isActive ? C.gold : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'color 0.15s, background 0.15s',
                    }}>
                    {item.icon}
                    {item.label}
                  </button>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <div data-lenis-prevent style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px', minHeight: 0 }}>
          {/* Section title */}
          <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}>
              {sideMenuItems.find(i => i.key === activeSection)?.label}
            </div>
            {activeSection === 'vault' && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.nVaultSub}</div>}
            {activeSection === 'league' && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.nLeagueSub}</div>}
            {activeSection === 'gallery' && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.nGallerySub}</div>}
            {activeSection === 'settings' && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.settingsDesc}</div>}
          </div>

          {/* ─── Vault ─── */}
          {activeSection === 'vault' && <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: s.totalVol, value: `${Number(totalVol).toLocaleString()}`, unit: 'ETH', accent: C.gold },
                { label: s.weeklyVol, value: `${Number(weeklyVol).toLocaleString()}`, unit: 'ETH', accent: C.gold },
                { label: s.auctionWin, value: `${winRate.toFixed(1)}`, unit: '%', accent: C.green },
                { label: s.weeklyActive, value: `${Math.max(guild.member_count - 2, 1)}`, unit: `/${guild.member_count}`, accent: C.gold },
              ].map((card, i) => (
                <div key={i} style={{ background: C.panel, borderRadius: R, padding: '12px 14px', borderLeft: `3px solid ${card.accent}30` }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ ...NUM, fontSize: 18, fontWeight: 700, color: C.ink }}>{card.value}</span>
                    <span style={{ ...NUM, fontSize: 10, color: C.muted }}>{card.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{s.membersBtn} <span style={{ fontWeight: 400, color: C.muted }}>({members.length})</span></div>
            <div style={{ borderRadius: R, overflow: 'hidden', border: `1px solid ${C.line}`, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr', padding: '7px 14px', ...TH, background: C.panel2 }}>
                <span>{s.membersBtn}</span><span>{s.rank}</span><span>Joined</span>
              </div>
              {members.map((m) => {
                const name = m.user?.username ?? m.user?.wallet_address?.slice(0, 8) ?? 'Unknown'
                const roleLabel = m.role === 'OWNER' ? 'Guild Master' : m.role === 'MODERATOR' ? 'Officer' : 'Member'
                const isOwner = m.role === 'OWNER'
                return (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr', padding: '9px 14px', fontSize: 12, color: C.ink, borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: R, background: isOwner ? `${C.gold}20` : C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: isOwner ? C.gold : C.muted }}>
                      {name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    {isOwner && <IconShieldChevron size={12} color={C.gold} />}
                    {m.role === 'MODERATOR' && <IconStar size={12} color={C.gold} />}
                    <span style={{ color: isOwner ? C.gold : C.muted, fontWeight: isOwner ? 600 : 400 }}>{roleLabel}</span>
                  </div>
                  <span style={{ ...NUM, color: C.muted, fontSize: 11 }}>{new Date(m.joined_at).toLocaleDateString()}</span>
                </div>
                )
              })}
              {members.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: C.muted }}>No members data</div>}
            </div>

          </>}

          {/* ─── League ─── */}
          {activeSection === 'league' && (
            <div style={{ borderRadius: R, overflow: 'hidden', border: `1px solid ${C.line}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr', padding: '7px 14px', ...TH, background: C.panel2 }}>
                <span>#</span><span>Guild</span><span>{s.weeklyVol}</span><span>{s.rank}</span>
              </div>
              {[
                { rank: 1, name: 'GenesisCircle', vol: '48,200', mastery: 1 },
                { rank: 2, name: guild.name, vol: Number(weeklyVol).toLocaleString(), mastery: guild.ranking },
                { rank: 3, name: 'PixelGuild', vol: '8,420', mastery: 38 },
                { rank: 4, name: 'SovereignDAO', vol: '6,108', mastery: 47 },
                { rank: 5, name: 'NightOwlsNFT', vol: '4,903', mastery: 61 },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr', padding: '9px 14px', fontSize: 12, color: C.ink,
                  borderTop: `1px solid ${C.line}`, alignItems: 'center',
                  background: row.name === guild.name ? `${C.gold}08` : 'transparent',
                }}>
                  <span style={{ ...NUM, fontWeight: 700, color: row.rank <= 3 ? C.gold : C.muted }}>{row.rank}</span>
                  <span style={{ fontWeight: row.name === guild.name ? 600 : 400, color: row.name === guild.name ? C.gold : C.ink }}>{row.name}</span>
                  <span style={{ ...NUM }}>{row.vol} <span style={{ fontSize: 9, color: C.muted }}>ETH</span></span>
                  <span style={{ ...NUM, color: C.muted, fontSize: 11 }}>#{row.mastery}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── Gallery ─── */}
          {activeSection === 'gallery' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { title: 'Starry Night Remix', floor: '0.47', artist: 'marcelowu', img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop' },
                { title: 'Digital Bloom #42', floor: '0.82', artist: 'lena.kvn', img: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop' },
                { title: 'Cyber Samurai', floor: '1.14', artist: 'ryo_tanaka', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop' },
                { title: 'Abstract Waves', floor: '0.63', artist: 'ada.eth', img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3579?w=400&h=400&fit=crop' },
                { title: 'Neon District', floor: '0.91', artist: 'felix_art', img: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400&h=400&fit=crop' },
                { title: 'Golden Hour', floor: '0.38', artist: 'marcelowu', img: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=400&fit=crop' },
              ].map((item, i) => (
                <div key={i} style={{ borderRadius: R, overflow: 'hidden', border: `1px solid ${C.line}`, cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.gold + '60')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.line)}>
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: C.panel }}>
                    <img src={item.img} alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      loading="lazy" />
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{item.artist}</span>
                      <span style={{ ...NUM, fontSize: 12, fontWeight: 600, color: C.gold }}>{item.floor} ETH</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Auction ─── */}
          {activeSection === 'auction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { title: 'Crystal Genesis', time: '2h 14m left', bid: '1.24', bids: 12, live: true },
                { title: 'Neon Waves', time: 'starts in 8h', bid: '2.05', bids: 0, live: false },
                { title: 'Emerald Fractals', time: '4h 32m left', bid: '0.87', bids: 6, live: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: R, border: `1px solid ${C.line}`, background: C.panel }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: R, background: `linear-gradient(135deg, ${C.gold}18, ${C.panel2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconGavel size={16} color={C.gold} style={{ opacity: 0.6 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {item.live && <div style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} />}
                        <span style={{ ...NUM, fontSize: 10, color: item.live ? C.green : C.muted }}>{item.time}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...NUM, fontSize: 15, fontWeight: 700, color: C.ink }}>{item.bid} <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>ETH</span></div>
                    <div style={{ ...NUM, fontSize: 10, color: C.muted }}>{item.bids > 0 ? `${item.bids} bids` : 'No bids yet'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── Members ─── */}
          {activeSection === 'members' && (
            <div style={{ borderRadius: R, overflow: 'hidden', border: `1px solid ${C.line}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr', padding: '7px 14px', ...TH, background: C.panel2 }}>
                <span>{s.membersBtn}</span><span>{s.rank}</span><span>Joined</span>
              </div>
              {members.map((m) => {
                const name = m.user?.username ?? m.user?.wallet_address?.slice(0, 8) ?? 'Unknown'
                const roleLabel = m.role === 'OWNER' ? 'Guild Master' : m.role === 'MODERATOR' ? 'Officer' : 'Member'
                const isOwner = m.role === 'OWNER'
                return (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr', padding: '9px 14px', fontSize: 12, color: C.ink, borderTop: `1px solid ${C.line}`, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: R, background: isOwner ? `${C.gold}20` : C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: isOwner ? C.gold : C.muted }}>
                      {name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    {isOwner && <IconShieldChevron size={12} color={C.gold} />}
                    {m.role === 'MODERATOR' && <IconStar size={12} color={C.gold} />}
                    <span style={{ color: isOwner ? C.gold : C.muted, fontWeight: isOwner ? 600 : 400 }}>{roleLabel}</span>
                  </div>
                  <span style={{ ...NUM, color: C.muted, fontSize: 11 }}>{new Date(m.joined_at).toLocaleDateString()}</span>
                </div>
                )
              })}
              {members.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: C.muted }}>No members data</div>}
            </div>
          )}

          {/* ─── Chat ─── */}
          {activeSection === 'chat' && (
            <div style={{ borderRadius: R, overflow: 'hidden', border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
              <div ref={chatScrollRef} data-lenis-prevent style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                {chatMessages.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', fontSize: 12, color: C.muted }}>No messages yet. Start the conversation!</div>
                )}
                {chatMessages.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderTop: i > 0 ? `1px solid ${C.line}` : 'none', alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: R, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.muted }}>
                      {(c.user_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{c.user_name}</span>
                        <span style={{ ...NUM, fontSize: 9, color: C.muted }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.ink, marginTop: 3, lineHeight: 1.45, opacity: 0.85 }}>{c.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); sendChatMessage() }}
                style={{ padding: '10px 14px', borderTop: `1px solid ${C.line}`, background: C.panel2, display: 'flex', gap: 8 }}>
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder={jwt ? 'Type a message...' : 'Connect wallet to chat'}
                  disabled={!jwt} maxLength={500}
                  style={{ ...INPUT, borderRadius: R, padding: '7px 10px', fontSize: 12, background: C.bg }} />
                <button type="submit" disabled={!chatInput.trim() || !jwt}
                  style={{ padding: '7px 16px', borderRadius: R, background: chatInput.trim() && jwt ? C.gold : C.panel, border: 'none', color: chatInput.trim() && jwt ? '#1a1400' : C.muted, fontSize: 12, fontWeight: 600, cursor: chatInput.trim() && jwt ? 'pointer' : 'default', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  Send
                </button>
              </form>
            </div>
          )}

          {/* ─── Activities ─── */}
          {activeSection === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activities.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', fontSize: 12, color: C.muted }}>No recent activity</div>
              )}
              {activities.slice(0, 20).map((act) => (
                <div key={act.tx_hash} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: R, border: `1px solid ${C.line}`, background: C.panel }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: R, background: act.is_buy ? `${C.green}18` : `${C.red}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconTrendingUp size={16} color={act.is_buy ? C.green : C.red} style={{ transform: act.is_buy ? 'none' : 'rotate(180deg)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{act.username} {act.is_buy ? 'bought' : 'sold'}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{act.artwork_title} · {Number(act.share_amount)} shares</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...NUM, fontSize: 13, fontWeight: 600, color: act.is_buy ? C.green : C.red }}>{Number(act.eth_amount).toFixed(4)} ETH</div>
                    <div style={{ ...NUM, fontSize: 9, color: C.muted }}>{new Date(act.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {/* Legacy tasks for visual completeness */}
              {activities.length === 0 && [
                { title: 'Daily Check-in', desc: 'Check in to earn guild XP', status: 'Available', color: C.green, icon: <IconCheck size={14} /> },
                { title: 'Weekly Trade Goal', desc: 'Trade 5 artworks this week', status: '3/5', color: C.gold, icon: <IconTarget size={14} /> },
                { title: 'Invite Members', desc: 'Invite 2 new members', status: 'Not started', color: C.muted, icon: <IconUsers size={14} /> },
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: R, border: `1px solid ${C.line}`, background: C.panel }}>
                  <div style={{ width: 32, height: 32, borderRadius: R, background: `${act.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: act.color, flexShrink: 0 }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{act.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{act.desc}</div>
                  </div>
                  <span style={{ ...NUM, fontSize: 11, fontWeight: 600, color: act.color, padding: '3px 10px', borderRadius: R, background: `${act.color}10` }}>{act.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── Dividends ─── */}
          {activeSection === 'dividends' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'This Week', value: '0.42', unit: 'ETH', accent: C.green },
                  { label: 'Total Earned', value: '3.81', unit: 'ETH', accent: C.gold },
                  { label: 'Next Payout', value: '5d 12h', unit: '', accent: C.muted },
                ].map((d, i) => (
                  <div key={i} style={{ background: C.panel, borderRadius: R, padding: '14px 14px', borderLeft: `3px solid ${d.accent}30` }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 500 }}>{d.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ ...NUM, fontSize: 20, fontWeight: 700, color: C.ink }}>{d.value}</span>
                      {d.unit && <span style={{ ...NUM, fontSize: 10, color: C.muted }}>{d.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, padding: '8px 0' }}>
                Dividends are distributed weekly based on your contribution XP and guild volume.
              </div>
            </div>
          )}

          {/* ─── Settings (Guild Master only) ─── */}
          {activeSection === 'settings' && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{s.guildName}</label>
                <input type="text" value={settingsName} onChange={e => setSettingsName(e.target.value)}
                  style={{ ...INPUT }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{s.guildDesc}</label>
                <textarea value={settingsDesc} onChange={e => setSettingsDesc(e.target.value)} rows={3}
                  style={{ ...INPUT, resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{s.emblem}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMBLEMS.slice(0, 20).map((e) => (
                    <button type="button" key={e} onClick={() => setSettingsEmblem(e)}
                      style={{
                        width: 36, height: 36, borderRadius: R, cursor: 'pointer',
                        border: settingsEmblem === e ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                        background: settingsEmblem === e ? `${C.gold}15` : C.panel,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      }}>
                      <GuildEmblem emblem={e} size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{s.acceptance}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['auto', 'manual'] as const).map(mode => (
                    <button type="button" key={mode} onClick={() => setSettingsAcceptance(mode)}
                      style={{
                        padding: '7px 18px', borderRadius: R, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1px solid ${settingsAcceptance === mode ? C.gold : C.line}`,
                        background: settingsAcceptance === mode ? `${C.gold}15` : 'transparent',
                        color: settingsAcceptance === mode ? C.gold : C.muted,
                      }}>
                      {mode === 'auto' ? s.auto : s.manual}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{s.focus}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[s.tagCasual, s.tagNewbie, s.tagTopGuild, s.tagArena, s.tagCheckInDaily].map((tag) => (
                    <span key={tag} style={{ padding: '4px 12px', borderRadius: R, fontSize: 11, border: `1px solid ${C.line}`, color: C.muted, background: C.panel }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                <button type="button" onClick={handleSaveSettings}
                  style={{ padding: '8px 24px', borderRadius: R, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.gold, border: 'none', color: '#1a1400', transition: 'opacity 0.15s' }}>
                  {settingsSaved ? s.settingsSaved : s.saveSetting}
                </button>
                {settingsSaved && <span style={{ fontSize: 12, color: C.green }}>
                  <IconCheck size={14} style={{ verticalAlign: -2, marginRight: 3 }} />{s.settingsSaved}
                </span>}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowLeaveConfirm(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              style={{ background: C.panel, border: `1px solid ${C.lineGold}`, borderRadius: R + 2, padding: '24px 28px', maxWidth: 360, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{s.leave}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.6 }}>{s.leaveConfirm}</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button type="button" onClick={() => setShowLeaveConfirm(false)}
                  style={{ borderRadius: R, padding: '7px 20px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: `1px solid ${C.line}`, color: C.ink }}>{s.cancel}</button>
                <button type="button" onClick={() => { onLeaveGuild(); setShowLeaveConfirm(false) }}
                  style={{ borderRadius: R, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.red, border: 'none', color: '#fff' }}>{s.leave}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function GuildPage() {
  const { locale } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = isDark ? DARK : LIGHT
  const s = STR[locale] ?? STR.en
  const [guilds, setGuilds] = useState<GuildView[]>(MOCK)
  const [view, setView] = useState<'finder' | 'hall'>('finder')
  const [active, setActive] = useState<GuildView>(MOCK[1])
  const [createOpen, setCreateOpen] = useState(false)
  const [joinedId, setJoinedId] = useState<string | null>(() => getJoinedGuild())

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevBg = body.style.backgroundColor
    html.style.overflow = 'hidden'
    html.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.height = '100%'
    body.style.margin = '0'
    body.style.backgroundColor = T.bg
    html.classList.add('lenis-stopped')
    return () => {
      html.style.overflow = ''
      html.style.height = ''
      body.style.overflow = ''
      body.style.height = ''
      body.style.margin = ''
      body.style.backgroundColor = prevBg
      html.classList.remove('lenis-stopped')
    }
  }, [T.bg])

  const load = () => {
    guildService.list()
      .then((rows) => { if (Array.isArray(rows) && rows.length) setGuilds(rows.map(toView)) })
      .catch(() => {})
  }
  useEffect(load, [])

  const isAuth = useAuthStore(s => s.isAuthenticated)

  const handleJoin = (g: GuildView) => {
    if (!isAuth) { alert(s.loginRequired ?? 'Please login first'); return }
    if (cooldownRemaining() > 0) return
    setJoinedGuild(g.id)
    setJoinedId(g.id)
    setActive(g)
    setView('hall')
  }

  const handleLeaveGuild = () => {
    setLeftAt()
    setJoinedGuild(null)
    setJoinedId(null)
    setView('finder')
  }

  const enter = (g: GuildView) => { setActive(g); setView('hall') }

  return (
    <ThemeCtx.Provider value={T as Colors}>
      <div style={{ background: T.sceneBg, position: 'fixed', top: 68, left: 0, right: 0, bottom: 0, color: T.ink, overflow: 'hidden' }}>
        <AnimatePresence>
          {createOpen && <CreateGuildModal key="cm" s={s} onClose={() => setCreateOpen(false)} onCreated={(mock) => { setCreateOpen(false); if (mock) setGuilds(prev => [mock, ...prev]); else load() }} />}
        </AnimatePresence>
        {view === 'finder'
          ? <FinderView guilds={guilds} s={s} onEnter={enter} onRefresh={load} onCreate={() => { if (!isAuth) { alert(s.loginRequired ?? 'Please login first'); return }; setCreateOpen(true) }} joinedId={joinedId} onJoin={handleJoin} onLeaveGuild={handleLeaveGuild} t={T} />
          : <HallView guild={active} s={s} onLeave={() => setView('finder')} onLeaveGuild={handleLeaveGuild} />}
      </div>
    </ThemeCtx.Provider>
  )
}
