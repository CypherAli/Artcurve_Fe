# ArtCurve Frontend — Development Guide

## Lệnh

```bash
npm run dev      # :3000 — backend Be ở :3001 (NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1)
npm test         # jest
npm run lint
npm run build    # PHẢI xanh trước khi merge — push main = auto-deploy Vercel
```

## Stack
- Next.js 14 (App Router)
- TypeScript 5
- Tailwind CSS v4 + inline styles for dynamic values
- Wagmi v2 + RainbowKit (Web3 wallet)
- TanStack Query (data fetching)
- Zustand (auth, portfolio, notifications state)
- Framer Motion (animations)
- Socket.IO (real-time prices)

## Conventions
- CSS: Use `var(--tp-*)` tokens for trade page, `var(--ac-*)` for general
- Colors: Gold `#D4AF37` (accent), phase colors in `PHASE_COLOR` constant
- Typography: `--font-serif` (Cormorant Garamond) for headings, `--font-sans` (Inter) for body
- Dark mode: Uses `html.dark` class with View Transition API ("claw rip" animation)
- i18n: 10 locales (en, vi, ar, de, es, fr, ja, ko, pt, zh) — always add keys to ALL locale files.
  Enforced by the `Translations` interface (`src/i18n/locales/en.ts`): add the key to the
  interface first, then the compiler flags every locale still missing it — build fails in CI otherwise
- API: Services in `src/services/`, hooks in `src/hooks/`, types in `src/types/api.ts`
- State: TanStack Query for server state, Zustand only for client state (auth, UI)
- Components: `src/components/{feature}/` — one directory per feature

## Important Files
- `src/types/api.ts` — All TypeScript types matching BE DTOs
- `src/services/artwork.service.ts` — Artwork API calls
- `src/hooks/useMarketplace.ts` — Marketplace data hook with artworkType filter
- `src/components/marketplace/MarketplacePage.tsx` — Main marketplace (3500+ lines)
- `src/components/trade/TradePage.tsx` — Trading terminal
- `src/components/studio/StudioPage.tsx` — Artwork creation form
- `src/app/globals.css` — CSS variables and design tokens

## Skills — bảng chỉ đường (`.claude/skills/`)

Khi task khớp loại việc dưới đây, LUÔN đọc skill tương ứng trước khi code:

| Loại task | Skill bắt buộc |
|---|---|
| Bất kỳ UI/component/page nào người dùng nhìn thấy | `soft-skill` (high-end-visual-design) + `taste-skill` |
| Landing page / trang marketing nhiều section | `gpt-tasteskill` |
| Animation thường (tween, hover, stagger) | `gsap-core` hoặc `framer-motion` |
| Animation theo scroll (pin, scrub, parallax) | `gsap-framer-scroll-animation` (chính) · `gsap-scrolltrigger` · `cinematic-gsap-lenis-motion-system` (Lenis, phong cách cinematic) |
| Wallet / contract / blockchain hooks | `dapp-frontend-patterns` (project dùng **Wagmi v2**) + `frontend-ux` cho UX transaction. KHÔNG dùng skill `wagmi` (viết cho v3) trừ khi migrate. |
| Viết/sửa class Tailwind | `tailwind-css-rules` |
| State (Zustand/TanStack Query) | `state-management` |
| 3D / Three.js / R3F | `three-js` · shader GLSL → `r3f-shaders` |
| Next.js App Router (routing, RSC, server actions) | `nextjs-app-router-patterns-v3` |
| Code từ ảnh design / mockup | `image-to-code-skill` |
| Redesign / nâng cấp UI có sẵn | `redesign-skill` |
| Sinh ảnh design reference | `imagegen-frontend-web` (web) · `imagegen-frontend-mobile` (mobile) · `brandkit` (brand board) |
| Output file dài, cấm placeholder | `output-skill` |

Style skills chọn theo yêu cầu: `minimalist-skill` (tối giản) · `brutalist-skill` (brutalist/terminal) — mặc định không dùng nếu user không yêu cầu style đó.

## Environment Variables
- `NEXT_PUBLIC_API_URL` — Backend API base URL
- `NEXT_PUBLIC_CHAIN_ID` — Blockchain chain ID (84532 = Base Sepolia)
- `NEXT_PUBLIC_WS_HUB_URL` — WebSocket hub URL
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect project ID
- `NEXT_PUBLIC_LIVEKIT_URL` — LiveKit streaming URL

## Deploy
- Platform: Vercel
- Branch: main (auto-deploy)
- URL: https://artcurve-fe.vercel.app
