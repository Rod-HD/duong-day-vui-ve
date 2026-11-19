# Implementation Plan: UI refresh (Stitch → neo-brutalist/risograph, xanh dương) + PWA + QR

## Overview

Làm theo thứ tự dữ liệu → khung HTML → CSS và animation → logic trạng thái → PWA và QR → kiểm thử → deploy. Mỗi task commit và push một lần, rồi cập nhật codebase-graph.

## Tasks

- [x] 1. Dữ liệu và khung trang
  - [x] 1.1 Thêm `short` vào `web/content.json` (0 "Ủng hộ", 1 "Bực bội", 2 "Lời khuyên", 3 "Bé cổ vũ", 4 "Tiếng cười", 5 "English", 6 "Bạn đẹp", 7 "Thêm")
    - _Requirements: 1.2_
  - [x] 1.2 Viết lại `web/index.html` theo Component 2
    - Mascot và doodle dùng SVG inline, filter `#rough`. Không ảnh người thật, không font ngoài
    - _Requirements: 1.1, 1.3, 1.4, 3.2, 5.2, 5.3_

- [x] 2. Viết lại `web/style.css`
  - Phong cách neo-brutalist/risograph, chủ đạo xanh dương, chế độ tối, khung điện thoại ≥900px
  - Toàn bộ chuyển động nằm trong media `no-preference`
  - Hiệu ứng xuất hiện lúc tải trang chỉ chạy đến khi có `.ready`
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.5_

- [x] 3. Cập nhật `web/app.js`
  - `setState`, đồng hồ, `onended`/`onend` với token `playId`, nút `#end`
  - Highlight phím và dòng danh mục, ripple, burst (dọn bằng timer), hiệu ứng lún khi gõ bàn phím máy tính, lắc phím rỗng
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.2, 4.3_

- [x] 3b. PWA + QR
  - [x] 3b.1 `tools/icon.svg` → `web/icons/*.png` (Chromium `--headless=old`); `web/manifest.webmanifest`; `web/sw.js`; đăng ký SW + nút cài/hướng dẫn iOS
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 3b.2 `tools/make_qr.py` (qrcode 8.2 trong .venv) → `web/qr.svg`; sticker QR trên desktop; `web/poster.html` + link ở footer
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Kiểm thử
  - [x] 4.1 `tools/smoke.mjs` mở rộng lên 45 kiểm tra. Ép `prefers-reduced-motion: no-preference` để không phụ thuộc cài đặt Windows. Đạt 45/45, ổn định 3 lần chạy
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 4.2 Chụp ảnh 360px (sáng, tối, đang phát), 1280px và poster, rồi xem bằng mắt
    - _Requirements: 1.1, 1.3, 5.5_

- [ ] 5. Checkpoint: push → Render tự deploy → chạy smoke.mjs trên link live → PASS
