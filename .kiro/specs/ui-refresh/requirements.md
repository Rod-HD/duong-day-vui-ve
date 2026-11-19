# Requirements Document

## Introduction

Làm lại giao diện `web/` theo bố cục của thiết kế Stitch, gồm project `13630802284968747190` và screen `e07b56b51a124002b200026873194b5a`. **Màu chủ đạo đổi sang xanh dương** theo yêu cầu của user ngày 2026-11-20. Thêm **PWA** (cài trang vào màn hình chính, nghe được khi offline) và **mã QR** để in poster. Đây là cách thay số điện thoại mà không tốn phí. Trang mới trông như một ứng dụng gọi điện dễ thương, có hiệu ứng chuyển động đầy đủ.

Logic hiện có giữ nguyên:
- `content.json` là nguồn nội dung
- phát mp3, nếu lỗi thì chuyển sang đọc bằng TTS, nếu vẫn không được thì chỉ hiện phụ đề
- chọn câu không lặp lại câu vừa phát
- deploy trên Render

**Ngoài phạm vi:**
- ảnh trẻ em thật
- tên hoặc tuổi "bé" bịa ra
- tab "Lời khuyên"/"Đã lưu"
- font, script hay ảnh tải từ bên ngoài
- số điện thoại

## Glossary

- **Thẻ cuộc gọi (Call card)**: khối nền tím mận gồm đồng hồ, chip trạng thái, mascot, phụ đề và sóng âm.
- **Trạng thái cuộc gọi**: `idle` (chưa gọi), `playing` (đang phát một lời nhắn hoặc lời chào), `ended` (vừa kết thúc).
- **Nhãn ngắn (`short`)**: 1–2 chữ hiện dưới số trên phím, ví dụ "Bực bội". Lấy từ `content.json`.
- **Mascot**: hình mặt trời cười vẽ bằng SVG inline. Không phải ảnh người thật.
- **Burst**: hiệu ứng tim hoặc sao bung ra từ phím vừa bấm.
- **Reduced motion**: thiết lập `prefers-reduced-motion: reduce` của hệ điều hành.

## Requirements

### Requirement 1: Bố cục theo thiết kế Stitch

**User Story:** As a người dùng, I want trang trông như một ứng dụng gọi điện đáng yêu, so that tôi thấy vui ngay khi mở trang.

#### Acceptance Criteria

1. THE Hotline Web SHALL hiển thị theo thứ tự: header (mascot, tên, chip, phụ đề), thẻ cuộc gọi, bàn phím 3×4 tròn, nút "Gọi" xanh và nút "Kết thúc" đỏ, danh mục chủ đề, khối "Cần giúp đỡ ngay?" (không có số), footer.
2. THE mỗi phím có nội dung SHALL hiện số lớn kèm nhãn ngắn `short` lấy từ `content.json`. Phím 8, 9, *, # SHALL hiện mờ.
3. WHERE màn hình rộng ≥ 768px, THE Hotline Web SHALL đặt trang trong khung điện thoại ở giữa, nền có doodle.
4. THE Hotline Web SHALL KHÔNG có ảnh người thật, KHÔNG có tên hay tuổi bịa, KHÔNG có tab điều hướng giả.

---

### Requirement 2: Trạng thái cuộc gọi

**User Story:** As a người nghe, I want thấy rõ mình đang nghe gì và đã nghe bao lâu, so that cảm giác giống một cuộc gọi thật.

#### Acceptance Criteria

1. WHEN một lời nhắn bắt đầu phát, THE thẻ cuộc gọi SHALL hiện chip "Đang nghe · Phím N" kèm dòng chủ đề `<label>`, chạy đồng hồ mm:ss, bật sóng âm và vòng sáng quanh mascot.
2. WHEN bấm "Gọi", THE chip SHALL hiện "Đang kết nối…" rồi "Lời chào", và phát lời chào.
3. WHEN audio phát xong hoặc người dùng bấm "Kết thúc", THE Hotline Web SHALL dừng âm thanh và đồng hồ, tắt sóng âm, và chip hiện "Đã kết thúc".
4. WHILE một phím đang phát, THE phím đó và dòng tương ứng trong danh mục SHALL được làm nổi bật, và dòng danh mục SHALL hiện nhãn "Đang phát".

---

### Requirement 3: Danh mục chủ đề bấm được

**User Story:** As a người dùng điện thoại, I want bấm thẳng vào tên chủ đề, so that tôi không phải nhớ số.

#### Acceptance Criteria

1. WHEN người dùng bấm một dòng trong danh mục, THE Hotline Web SHALL xử lý như bấm phím tương ứng.
2. THE mỗi dòng SHALL là `<button>` có huy hiệu số và label đầy đủ.

---

### Requirement 4: Animation

**User Story:** As a người dùng, I want trang có chuyển động mượt và vui, so that trải nghiệm sinh động.

#### Acceptance Criteria

1. WHEN bấm phím hoặc nút, THE nút SHALL lún xuống (dịch xuống 4px, bóng ngắn lại) rồi bật lên.
2. WHEN bấm phím có nội dung, THE Hotline Web SHALL bung hiệu ứng burst tim hoặc sao từ phím đó.
3. WHEN phụ đề đổi, THE phụ đề SHALL hiện ra bằng hiệu ứng fade và trượt lên.
4. WHILE trạng thái là `playing`, THE sóng âm SHALL nhấp nhô và mascot SHALL có vòng sáng lan ra.
5. THE doodle nền SHALL trôi chậm.
6. THE keyframe animation SHALL chỉ dùng `transform` và `opacity`. Riêng hiệu ứng lún khi bấm nút/phím được phép đổi `box-shadow` (bóng cứng của phong cách neo-brutalist).
7. WHERE bật reduced motion, THE Hotline Web SHALL tắt mọi chuyển động nhưng giữ nguyên màu báo trạng thái.

---

### Requirement 5: Giữ chất lượng hiện có

**User Story:** As a chủ dự án, I want giao diện mới không làm hỏng những gì đang chạy, so that demo luôn dùng được.

#### Acceptance Criteria

1. THE mọi kiểm tra trong `tools/smoke.mjs` SHALL vẫn PASS, sau khi cập nhật selector theo giao diện mới.
2. THE Hotline Web SHALL không cuộn ngang ở 360px, có chế độ tối, và có `aria-live` cho phụ đề.
3. THE Hotline Web SHALL không tải tài nguyên ngoài origin (không Google Fonts, không ảnh CDN).
4. THE tổng `index.html` + `style.css` + `app.js` SHALL dưới 60KB.
5. THE chữ chính SHALL đạt độ tương phản WCAG AA.

---

### Requirement 6: PWA

**User Story:** As a người dùng điện thoại, I want cài trang như một app gọi điện, so that tôi mở nhanh như mở một đường dây.

#### Acceptance Criteria

1. THE Hotline Web SHALL có `manifest.webmanifest` (name, short_name, start_url, `display: standalone`, theme_color xanh dương, icon 192/512 PNG, apple-touch-icon).
2. THE Hotline Web SHALL đăng ký `sw.js`. Service worker ưu tiên lấy bản mới từ mạng, và dùng bản đã lưu khi mất mạng. Khi cài, nó lưu sẵn giao diện và toàn bộ mp3 lấy từ `content.json`.
3. WHEN trình duyệt bắn sự kiện `beforeinstallprompt`, THE Hotline Web SHALL hiện nút "Cài vào màn hình chính". WHERE là iPhone/iPad và chưa cài, THE Hotline Web SHALL hiện hướng dẫn "Chia sẻ → Thêm vào MH chính".
4. IF mất mạng sau lần mở đầu, THEN THE Hotline Web SHALL vẫn mở được và phát được audio.

---

### Requirement 7: Mã QR

**User Story:** As a chủ dự án, I want một mã QR để in, so that người khác quét mã là vào đường dây, không cần số điện thoại.

#### Acceptance Criteria

1. THE script `tools/make_qr.py` SHALL tạo `web/qr.svg` trỏ tới URL demo, mặc định là `https://duong-day-vui-ve.onrender.com/`.
2. WHERE màn hình rộng ≥ 768px, THE Hotline Web SHALL hiện thẻ "Quét để mở trên điện thoại" có mã QR.
3. THE `web/poster.html` SHALL là trang in A5 gồm tên, mascot, QR, lời mời và URL. Footer SHALL có link tới trang này.

---
