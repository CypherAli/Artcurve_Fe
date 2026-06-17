# Guild assets

Thả các ảnh sau vào thư mục này để trang `/guild` dùng (nếu thiếu file → tự fallback sang crest vector + icon mặc định, không lỗi):

| File | Nội dung | Kích thước khuyến nghị (PNG nền trong suốt) |
|------|----------|---------------------------------------------|
| `crest.png` | Huy hiệu guild (banner + kiếm + cánh + sư tử + tua) | ~600 × 720 |
| `reward-1.png` | Phần thưởng 1 (vd: huy hiệu đỏ) | ~120 × 120 |
| `reward-2.png` | Phần thưởng 2 (vd: giọt bạc) | ~120 × 120 |
| `reward-3.png` | Phần thưởng 3 (vd: EXP +) | ~120 × 120 |
| `reward-4.png` | Phần thưởng 4 (vd: Gold +) | ~120 × 120 |

Lưu đúng tên (chữ thường) là tự hiển thị. Component: `src/components/guild/GuildPage.tsx` (ImgFallback).
