# Requirements Document

## Introduction

Xây bản demo "Đường Dây Vui Vẻ" (tên tạm): một trang web mô phỏng đường dây nóng kiểu Peptoc hotline (peptoc.org/hotline). Người dùng bấm số trên bàn phím điện thoại ảo để nghe lời động viên, lời khuyên và tiếng cười của trẻ em, bằng tiếng Việt.

Phiên bản demo dùng câu nói phỏng theo tinh thần menu của Peptoc, dịch sang tiếng Việt. Trang gốc không công bố lời thoại nên đây là câu viết lại, chưa phải bản dịch nguyên văn. Giọng đọc lấy từ TTS (edge-tts). Sau này nhóm sẽ thay bằng câu nói và giọng thu âm thật của trẻ em mà không cần sửa code.

**Trong phạm vi:** trang web tĩnh, bàn phím số, phát audio, script tạo audio, deploy free.
**Ngoài phạm vi (giai đoạn sau, có phí):** số điện thoại thật (1800/1900/024/028), tổng đài IVR, nhận donate online, quản trị nội dung, thống kê người dùng.
**Giả định:** người dùng có trình duyệt hiện đại (Chrome/Safari/Edge, có cả mobile) và có mạng.

## Glossary

- **Hotline Web**: trang web mô phỏng cuộc gọi tới đường dây nóng. Không có cuộc gọi điện thoại thật.
- **Phím (Option)**: một nút trên bàn phím ảo (0–9) ứng với một nhóm nội dung.
- **Menu**: danh sách phím và ý nghĩa, phỏng theo Peptoc: 1 bực bội/lo lắng, 2 lời khuyên cuộc sống, 3 lời cổ vũ của bé mẫu giáo, 4 tiếng cười trẻ em, 5 lời cổ vũ bằng tiếng Anh (thay cho tiếng Tây Ban Nha của bản gốc), 6 bạn trông tuyệt thế nào, 7 lời khuyên thêm, 0 ủng hộ dự án.
- **Lời nhắn (Message)**: một câu nói (text) kèm một file audio, thuộc một Phím.
- **Lời chào (Greeting)**: audio giới thiệu menu, phát khi người dùng bấm "Gọi".
- **content.json**: file dữ liệu duy nhất chứa menu và toàn bộ lời nhắn.
- **edge-tts**: thư viện Python miễn phí dùng giọng đọc của Microsoft Edge để tạo file mp3. Đây là dịch vụ không chính thức.
- **Giọng thật**: file mp3 thu âm trẻ em, thay thế file TTS cùng tên.
- **Đường dây hỗ trợ khẩn cấp**: số điện thoại hỗ trợ khủng hoảng/tâm lý thật ở Việt Nam, hiển thị trên trang để an toàn cho người dùng.

## Requirements

### Requirement 1: Bàn phím hotline

**User Story:** As a người đang buồn hoặc căng thẳng, I want bấm số như gọi điện để chọn loại lời động viên, so that tôi có trải nghiệm giống gọi hotline thật.

#### Acceptance Criteria

1. THE Hotline Web SHALL hiển thị bàn phím 3×4 (1–9, *, 0, #) và nút "Gọi".
2. THE Hotline Web SHALL hiển thị menu (phím → ý nghĩa) đọc được ngay trên trang.
3. WHEN người dùng bấm "Gọi", THE Hotline Web SHALL phát Lời chào đọc menu.
4. WHEN người dùng bấm một Phím có nội dung, THE Hotline Web SHALL dừng audio đang phát và phát một Lời nhắn của Phím đó.
5. WHEN người dùng gõ phím số 0–9 trên bàn phím máy tính, THE Hotline Web SHALL xử lý như bấm Phím tương ứng.
6. IF người dùng bấm Phím không có nội dung (8, 9, *, #), THEN THE Hotline Web SHALL hiển thị "Phím này chưa có nội dung, mời bạn chọn phím khác" và không báo lỗi.

---

### Requirement 2: Nội dung lời nhắn

**User Story:** As a thành viên nhóm dự án, I want toàn bộ câu nói nằm trong một file dữ liệu, so that tôi đổi câu mà không phải sửa code.

#### Acceptance Criteria

1. THE Hotline Web SHALL đọc menu và lời nhắn từ duy nhất `web/content.json`.
2. THE content.json SHALL có ít nhất 3 Lời nhắn cho mỗi Phím 1–7 và 1 Lời nhắn cho Phím 0.
3. WHEN một Phím được bấm nhiều lần, THE Hotline Web SHALL chọn ngẫu nhiên Lời nhắn và không lặp lại đúng câu vừa phát (nếu Phím có từ 2 câu trở lên).
4. WHILE một Lời nhắn đang phát, THE Hotline Web SHALL hiển thị text của câu đó làm phụ đề.
5. THE content.json SHALL ghi chú rằng đây là câu demo phỏng theo Peptoc và cần thay hoặc xin phép trước khi công khai.

---

### Requirement 3: Phát audio và dự phòng

**User Story:** As a người nghe, I want luôn nghe được lời nhắn, so that trang không bị "im lặng" khi thiếu file.

#### Acceptance Criteria

1. THE Hotline Web SHALL phát file `web/audio/<phím>/<số thứ tự>.mp3` tương ứng với Lời nhắn.
2. IF file audio không tải được, THEN THE Hotline Web SHALL đọc text bằng giọng đọc của trình duyệt (Web Speech API, `vi-VN`) và vẫn hiện phụ đề.
3. IF trình duyệt không có giọng đọc, THEN THE Hotline Web SHALL chỉ hiện phụ đề.
4. WHEN nhóm thay file mp3 bằng Giọng thật cùng đường dẫn, THE Hotline Web SHALL phát Giọng thật mà không cần sửa code.

---

### Requirement 4: Script tạo audio miễn phí

**User Story:** As a thành viên nhóm, I want tạo lại toàn bộ mp3 bằng một lệnh, so that sau khi sửa câu tôi có audio mới ngay.

#### Acceptance Criteria

1. THE script `tools/gen_audio.py` SHALL đọc `web/content.json` và tạo mp3 cho Lời chào và mọi Lời nhắn bằng edge-tts.
2. THE script SHALL dùng giọng `vi-VN` mặc định và giọng tiếng Anh cho Phím 5.
3. WHEN file mp3 đã tồn tại, THE script SHALL bỏ qua file đó (giữ Giọng thật), trừ khi chạy với `--force`.
4. IF edge-tts lỗi mạng ở một câu, THEN THE script SHALL báo câu bị lỗi, chạy tiếp các câu còn lại và kết thúc với exit code khác 0.
5. THE script SHALL chạy bằng Python trong `.venv` của project.

---

### Requirement 5: Thông tin, ghi nguồn và an toàn

**User Story:** As a người dùng có thể đang khủng hoảng, I want thấy ngay nơi được giúp đỡ thật, so that trang vui vẻ không thay thế hỗ trợ chuyên môn.

#### Acceptance Criteria

1. THE Hotline Web SHALL hiển thị khối "Cần giúp đỡ ngay?" với các số khẩn cấp Việt Nam (111 Tổng đài quốc gia bảo vệ trẻ em, 115 cấp cứu, cùng đường dây hỗ trợ tâm lý đã kiểm chứng).
2. THE Hotline Web SHALL ghi "Lấy cảm hứng từ Peptoc (peptoc.org), dự án của học sinh West Side Elementary, Healdsburg, California" kèm link.
3. THE Hotline Web SHALL ghi rõ đây là bản demo, câu nói là bản phỏng dịch tạm.
4. WHEN người dùng bấm Phím 0, THE Hotline Web SHALL phát lời cảm ơn và hiện thông tin ủng hộ (demo: "đang cập nhật").
5. THE tên hiển thị SHALL nằm ở đúng một chỗ trong code để đổi tên dễ.

---

### Requirement 6: Giao diện và trợ năng

**User Story:** As a người dùng điện thoại, I want trang dễ bấm và dễ đọc, so that tôi dùng được bằng một tay.

#### Acceptance Criteria

1. THE Hotline Web SHALL hiển thị đúng, không cuộn ngang, ở chiều rộng 360px trở lên.
2. THE Phím SHALL có kích thước chạm tối thiểu 48×48px và có `aria-label` mô tả ý nghĩa.
3. THE phụ đề SHALL nằm trong vùng `aria-live="polite"`.
4. THE Hotline Web SHALL hỗ trợ chế độ sáng và tối theo cài đặt hệ thống.

---

### Requirement 7: Chi phí 0đ và deploy

**User Story:** As a chủ dự án, I want demo chạy online miễn phí, so that tôi gửi link cho đối tác xem thử.

#### Acceptance Criteria

1. THE Hotline Web SHALL là site tĩnh (không backend, không DB, không API key) trong thư mục `web/`.
2. THE Hotline Web SHALL không dùng cookie, analytics hay script bên thứ ba.
3. THE tổng dung lượng `web/` SHALL dưới 50MB (an toàn với giới hạn của Render, GitHub Pages và Cloudflare Pages free).
4. THE README SHALL có hướng dẫn deploy free, ghi rõ giới hạn free và giá khi vượt.
5. THE repo SHALL có `render.yaml` để deploy `web/` thành Render Static Site (gói Hobby free) bằng một thao tác Blueprint, cho ra link `*.onrender.com` công khai.
6. THE README SHALL có Cloudflare Pages làm phương án dự phòng khi băng thông free của Render (5GB/tháng) không đủ.

---
