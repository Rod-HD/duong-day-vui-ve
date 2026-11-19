# Implementation Plan: Web Hotline (demo 0đ)

## Overview

Làm theo thứ tự dữ liệu → audio → giao diện → deploy. Ánh xạ sang design:

- Task 1: môi trường + `content.json` (Component 1)
- Task 2: `gen_audio.py` (Component 4)
- Task 3: `index.html`/`style.css`/`app.js` (Component 2, 3)
- Task 4: checkpoint trên trình duyệt
- Task 5: `render.yaml` + README + đưa lên Render (Component 5, 6)
- Task 6: checkpoint demo online

Sau mỗi task phải cập nhật `.kiro/steering/codebase-graph.md`.

## Tasks

- [ ] 1. Môi trường và nội dung
  - [x] 1.1 Tạo `.venv` và cài edge-tts
    - Tạo venv bằng Python ở đường dẫn trong environment.md (KHÔNG dùng `python` trên PATH), sau đó `.venv\Scripts\python -m pip install edge-tts`
    - Kiểm tra: `.venv\Scripts\python -c "import edge_tts"` chạy không lỗi
    - Tạo `requirements.txt` gồm 1 dòng `edge-tts`
    - _Requirements: 4.5_

  - [ ] 1.2 Viết `web/content.json`
    - Các field: `brand`, `note`, `voice`, `greeting`, `options` (0–7), `help`
    - Phím 1–7 có ≥3 câu tiếng Việt viết lại theo tinh thần menu Peptoc. Phím 5 viết tiếng Anh, `voice` = `en-US-AnaNeural`, `lang` = `en-US`
    - Phím 0 có lời cảm ơn và `info` = "Thông tin ủng hộ: đang cập nhật."
    - `help`: 111, 115, Ngày Mai 0963061414
    - Kiểm tra: `.venv\Scripts\python -c "import json;json.load(open('web/content.json',encoding='utf-8'))"`
    - _Requirements: 2.1, 2.2, 2.5, 5.1, 5.4, 5.5_

- [ ] 2. Script tạo audio
  - [ ] 2.1 Viết `tools/gen_audio.py`
    - Hàm `jobs(content)`: trả về list `(path, text, voice)`, gồm `greeting.mp3` và `<key>/<i>.mp3`
    - Cờ `--force` (ghi đè) và `--dry-run` (chỉ in, không gọi mạng)
    - Mỗi câu chạy trong `try` riêng. Câu lỗi được in ra, chạy tiếp, cuối cùng `sys.exit(1)` nếu có lỗi
    - Có self-check `assert` cho đường dẫn của `jobs()`
    - Kiểm tra: `--dry-run` in đúng số file (số câu + 1)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 2.2 Tạo mp3 thật
    - Chạy `.venv\Scripts\python tools\gen_audio.py`
    - Kiểm tra: số file `.mp3` trong `web/audio` = số câu + 1. Nghe thử 1 file tiếng Việt và 1 file phím 5
    - Chạy lại lần 2 phải thấy "skip" toàn bộ
    - _Requirements: 3.1, 4.1, 4.2, 4.3_

- [ ] 3. Giao diện web
  - [ ] 3.1 Viết `web/index.html` và `web/style.css`
    - Các id: `brand`, `menu`, `screen` (`aria-live="polite"`), `keypad`, `call`, `help`
    - Footer ghi nguồn Peptoc kèm link và ghi chú bản demo
    - CSS variables, chế độ tối, bàn phím dạng grid 3×4, phím `min-height: 56px`, không dùng tài nguyên ngoài
    - _Requirements: 1.1, 1.2, 2.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.2_

  - [ ] 3.2 Viết `web/app.js`
    - Các hàm `init`, `press`, `pick`, `play`, `speak` theo design
    - Lấy brand từ `content.json` và gán vào `#brand` + `document.title`
    - `keydown` 0–9 gọi `press`. Phím không có nội dung thì hiện thông báo
    - Fetch lỗi thì hiện "Không tải được nội dung — hãy chạy qua http server"
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4, 3.1, 3.2, 3.3, 5.4, 5.5_

- [ ] 4. Checkpoint: kiểm tra trên trình duyệt
  - Chạy `.venv\Scripts\python -m http.server 8000 -d web`
  - Làm hết checklist trong design.md mục Testing Strategy. Ghi kết quả vào nhật ký trong codebase-graph.md

- [ ] 5. Deploy free
  - [ ] 5.1 Viết `render.yaml`
    - `type: web`, `runtime: static`, `buildCommand: echo no build`, `staticPublishPath: ./web`
    - _Requirements: 7.1, 7.5_

  - [ ] 5.2 Viết `README.md`
    - Nội dung:
      - chạy local
      - tạo audio
      - thay giọng thật và lưu ý mapping theo thứ tự
      - đổi tên (`brand`)
      - deploy Render: push GitHub → Render → New → Blueprint
      - dự phòng: Cloudflare Pages, output dir `web`
    - Bảng giới hạn và chi phí:
      - Render Hobby 5GB/tháng, vượt ~$0.15/GB
      - Cloudflare không giới hạn băng thông
      - edge-tts không chính thức
      - các phương án tổng đài thật kèm giá tham khảo
    - _Requirements: 7.4, 7.6_

  - [ ] 5.3 Kiểm dung lượng và hướng dẫn user đưa lên Render
    - Kiểm tra: tổng `web/` < 50MB
    - User tự làm 2 bước cần tài khoản: tạo repo GitHub và push; Render → New → Blueprint → chọn repo
    - Kiểm tra: mở link `*.onrender.com` trên điện thoại, bấm phím 1 có tiếng
    - _Requirements: 7.3, 7.5_

- [ ] 6. Checkpoint: demo online chạy, gửi link cho người khác thử
