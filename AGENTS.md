<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Artcurve_Fe

Frontend DApp của ArtCurve (Next.js 14 App Router · Wagmi v2 · Tailwind v4 · TypeScript 5).
Convention chi tiết + **bảng chỉ đường skill**: xem `CLAUDE.md`. Kiến trúc toàn hệ thống: `../PROJECT.md`.

## Setup & lệnh

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, CHAIN_ID, WS_HUB_URL, WALLETCONNECT_PROJECT_ID
npm run dev                  # :3000 — backend Be chạy ở :3001 (NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1)
npm test                     # jest
npm run lint
npm run build                # PHẢI pass trước khi merge (Vercel auto-deploy từ main)
```

## Quy tắc bắt buộc

1. **Git:** branch → merge `main`; không logo Claude / `Co-Authored-By` trong commit.
   Push lên `main` = auto-deploy Vercel — chỉ merge khi `npm run build` xanh.
2. **i18n:** thêm text mới phải thêm key vào **cả 10 file locale** (en, vi, ar, de, es,
   fr, ja, ko, pt, zh). Được enforce bằng type: mọi locale khai báo `const xx: Translations`
   (`src/i18n/locales/`) — thiếu key là type error, `npm run build` fail ngay trong CI.
   Thêm key mới = sửa interface `Translations` trong `en.ts` trước, compiler sẽ chỉ ra
   9 file còn thiếu.
3. **Lenis smooth-scroll:** div nào cần scroll bằng con lăn chuột phải có
   `data-lenis-prevent`, nếu không sẽ không scroll được.
4. **State:** server state dùng TanStack Query; Zustand chỉ cho client state (auth, UI).
   Không fetch trong useEffect.
5. **Types khớp BE:** mọi type API nằm ở `src/types/api.ts` — đổi DTO bên
   `Artcurve_Be` thì phải cập nhật file này.
6. **CSS:** dùng design token (`var(--tp-*)` trade page, `var(--ac-*)` chung) —
   không hardcode màu; accent gold `#D4AF37`.
7. **Wagmi v2:** project dùng Wagmi **v2** — không viết code theo API v3
   (skill `wagmi` trong repo là tài liệu v3, chỉ dùng khi migrate).

## Cấu trúc chính

```
src/
├── app/            # App Router: marketplace, trade, studio, live, vault, guild, chat...
├── components/     # 1 thư mục / feature (marketplace/, trade/, studio/...)
├── services/       # API call layer (artwork.service.ts...)
├── hooks/          # useMarketplace, useAuth... (TanStack Query wrappers)
├── types/api.ts    # types khớp DTO backend
└── app/globals.css # CSS variables / design tokens
```

## Tích hợp

| Kết nối | Tới đâu |
|---|---|
| REST | `Artcurve_Be` :3001 qua `NEXT_PUBLIC_API_URL` (prefix `/api/v1`) |
| WebSocket | `artcurve-ws-hub` (giá real-time) + Socket.IO namespace `/prices` của Be |
| On-chain | Base Sepolia (84532) / Base Mainnet (8453) qua Wagmi v2 + RainbowKit |
| Streaming | LiveKit Cloud (trang Live) |

## Skills (`.claude/skills/` — 27 skill)

Danh sách + quy tắc "task nào → skill nào" nằm trong **bảng chỉ đường ở `CLAUDE.md`** —
đọc bảng đó trước khi làm task UI/animation/blockchain, đừng chọn skill theo cảm tính.
