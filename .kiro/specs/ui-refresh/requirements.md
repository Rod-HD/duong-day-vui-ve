# Requirements Document

## Introduction

Làm lại giao diện `web/` theo thiết kế Stitch, gồm project `13630802284968747190` và screen `e07b56b51a124002b200026873194b5a`. Trang mới trông như một ứng dụng gọi điện dễ thương, có hiệu ứng chuyển động đầy đủ.

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

1. WHEN một lời nhắn bắt đầu phát, THE thẻ cuộc gọi SHALL hiện chip "Đang nghe: Phím N — <label>", chạy đồng hồ mm:ss, bật sóng âm và vòng sáng quanh mascot.
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
6. THE animation SHALL chỉ dùng `transform` và `opacity`.
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
