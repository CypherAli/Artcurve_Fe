# PROJECT.md — Artcurve_Fe (Frontend DApp)

> Giao diện người dùng của ArtCurve — Next.js 14 (App Router) · TypeScript · Tailwind v4 ·
> Wagmi v2 + RainbowKit · LiveKit. **Live: https://artcurve-fe.vercel.app**

## 1. Vai trò

Toàn bộ trải nghiệm người dùng: khám phá tranh, giao dịch cổ phần, studio nghệ sĩ,
livestream, quản lý danh mục — kết nối ví Web3 trực tiếp với smart contract Base L2.

## 2. Trang chính

| Route | Chức năng |
|---|---|
| `/marketplace` | Duyệt/tìm tranh, filter theo loại, giá real-time |
| `/trade/[id]` | Terminal giao dịch: chart nến (TradingView Lightweight), buy/sell on-chain |
| `/studio` | Nghệ sĩ tạo artwork: upload ảnh → IPFS, đặt curve/target, launch |
| `/live` | Xem nghệ sĩ livestream vẽ tranh (LiveKit) + trade song song |
| `/vault`, `/artwork` | Danh mục sở hữu, P&L, chi tiết tác phẩm |
| `/guild`, `/chat` | Hội nhóm, chatbot AI hỗ trợ |
| `/wallet`, `/auth`, `/settings` | Ví, đăng nhập SIWE, cài đặt |

## 3. Kỹ thuật nổi bật

- **Web3:** Wagmi v2 + RainbowKit — kết nối MetaMask/WalletConnect, ký SIWE,
  gọi `buyShares`/`sellShares` trên BondingCurveAMM (Base 8453 / Base Sepolia 84532).
- **Real-time:** Socket.IO namespace `/prices` + ws-hub — giá nhảy trực tiếp không reload.
- **State:** TanStack Query (server state) + Zustand (auth/UI state).
- **UI/UX:** Tailwind v4 design tokens (`--tp-*`, `--ac-*`), font Cormorant Garamond +
  Inter, dark mode View Transition API, GSAP + Lenis smooth-scroll, Framer Motion.
- **i18n:** 10 ngôn ngữ (en, vi, ar, de, es, fr, ja, ko, pt, zh).
- **SEO:** sitemap.ts, robots.ts, App Router metadata.

## 4. Cấu trúc

```
src/app/          # routes (App Router)
src/components/   # 1 thư mục / feature — MarketplacePage, TradePage, StudioPage...
src/services/     # API client layer
src/hooks/        # TanStack Query wrappers
src/types/api.ts  # types khớp DTO backend
```

## 5. Trạng thái

✅ Deploy production trên Vercel (auto-deploy từ `main`).
✅ Đầy đủ luồng: browse → connect ví → trade → portfolio → live.
⚠️ Giao dịch on-chain phụ thuộc contract trên Base Sepolia (testnet).
