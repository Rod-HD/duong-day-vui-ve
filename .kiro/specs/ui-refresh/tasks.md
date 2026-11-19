# Implementation Plan: UI refresh (Stitch)

## Overview

Làm theo thứ tự dữ liệu → khung HTML → CSS và animation → logic trạng thái → kiểm thử → deploy. Mỗi task commit và push một lần, rồi cập nhật codebase-graph.

## Tasks

- [ ] 1. Dữ liệu và khung trang
  - [ ] 1.1 Thêm `short` vào `web/content.json`, gồm 0 "Ủng hộ", 1 "Bực bội", 2 "Lời khuyên", 3 "Bé cổ vũ", 4 "Tiếng cười", 5 "English", 6 "Bạn đẹp", 7 "Thêm"
    - _Requirements: 1.2_
  - [ ] 1.2 Viết lại `web/index.html` theo Component 2
    - Mascot và doodle dùng SVG inline. Không ảnh người thật, không font ngoài
    - _Requirements: 1.1, 1.3, 1.4, 3.2, 5.2, 5.3_

- [ ] 2. Viết lại `web/style.css`
  - Tokens Stitch, chế độ tối, khung điện thoại ≥768px, phím kẹo, thẻ cuộc gọi
  - Keyframes `press`, `rise`, `bar`, `ring`, `float`, `pop`, đặt trong media `no-preference`
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.5_

- [ ] 3. Cập nhật `web/app.js`
  - Thêm `setState` + đồng hồ + `onended`/`onend` + nút `#end`
  - Highlight phím và dòng danh mục, dòng danh mục là `<button>`, thêm `burst()`
  - Giữ nguyên `pick`, `play`, `speak`, `stop` và hành vi dự phòng
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.2, 4.3_

- [ ] 4. Kiểm thử
  - [ ] 4.1 Cập nhật `tools/smoke.mjs`: sửa selector, thêm kiểm tra theo design Testing Strategy
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 4.2 Chụp ảnh 360px sáng/tối và 1280px, so với ảnh Stitch
    - _Requirements: 1.1, 1.3, 5.5_

- [ ] 5. Checkpoint: push → Render tự deploy → chạy smoke.mjs trên link live → PASS
