# Đường Dây Vui Vẻ (tên tạm)

Trang web giả lập một đường dây nóng. Người dùng bấm số trên bàn phím để nghe lời động viên, lời khuyên và tiếng cười của các bạn nhỏ bằng tiếng Việt. Ý tưởng lấy từ [Peptoc hotline](https://www.peptoc.org/hotline), dự án của học sinh trường West Side Elementary ở Healdsburg, California.

> **Đây là bản demo.** Các câu nói được viết lại theo tinh thần menu của Peptoc, chưa phải bản dịch nguyên văn. Giọng đọc do máy tạo bằng edge-tts. Trước khi công khai, cần thay câu nói bằng nội dung của nhóm hoặc xin phép Peptoc.

## Menu

| Phím | Nội dung |
|---|---|
| 1 | Nếu bạn đang bực bội, nản lòng hay lo lắng |
| 2 | Lời khuyên cuộc sống |
| 3 | Các bé mẫu giáo cổ vũ bạn |
| 4 | Tiếng cười của trẻ em (hiện đang dùng TTS, cần thay bằng bản thu thật) |
| 5 | Lời cổ vũ bằng tiếng Anh (bản gốc của Peptoc là tiếng Tây Ban Nha) |
| 6 | Nghe xem bạn trông tuyệt vời thế nào |
| 7 | Thêm lời khuyên |
| 0 | Ủng hộ dự án (đang cập nhật) |

## Cấu trúc

```
web/                 ← thư mục deploy (site tĩnh, không backend)
  index.html  style.css  app.js
  content.json       ← nơi DUY NHẤT chứa tên, câu nói, nhãn ngắn trên phím
  audio/greeting.mp3, audio/<phím>/<thứ tự>.mp3
  manifest.webmanifest  sw.js  icons/   ← PWA: cài lên màn hình chính, nghe offline
  qr.svg  poster.html                   ← mã QR + trang in poster A5
tools/gen_audio.py   ← tạo mp3 từ content.json bằng edge-tts
tools/make_qr.py     ← tạo web/qr.svg
tools/icon.svg       ← bản gốc icon app
tools/smoke.mjs      ← 45 kiểm tra tự động
render.yaml          ← cấu hình deploy free lên Render
.kiro/               ← spec (requirements/design/tasks) + codebase-graph tiến độ
```

## Thay số điện thoại bằng QR + app (0đ)

- **Mã QR:** in trang `poster.html` (link "In poster QR" ở cuối trang). Người khác quét mã là vào đường dây, không cần số điện thoại.
- **Cài như app:** trên Android hoặc máy tính chạy Chrome/Edge, bấm nút "Cài vào màn hình chính". Trên iPhone, bấm Chia sẻ → Thêm vào MH chính. Sau lần mở đầu tiên, app vẫn chạy và phát được audio kể cả khi mất mạng.
- Nếu đổi link demo, tạo lại mã QR:
  ```powershell
  .venv\Scripts\python tools\make_qr.py https://link-moi/
  ```
- Nếu sửa `tools/icon.svg`, tạo lại các file icon PNG bằng Chromium có sẵn trong `D:\Programs\ms-playwright`, dùng chế độ `--headless=old` và `--force-device-scale-factor=1`. Có thể nhờ agent làm bước này.
- Khi đổi danh sách file giao diện, tăng số phiên bản `CACHE` trong `web/sw.js` để app đã cài lấy bản mới.

## Giao diện

Phong cách neo-brutalist (giống Gumroad) kết hợp zine in risograph 2 màu xanh dương và vàng. Giao diện có viền mực, bóng đổ cứng, giấy có hạt, nét vẽ tay và ghi chú viết tay. Không dùng gradient, emoji, ảnh người hay font tải ngoài.

Mọi animation tự tắt khi người dùng bật "Giảm chuyển động" trong máy.

## Chạy thử trên máy (Windows, PowerShell)

Python được cài ở `D:\Programs\Python`, thư viện cài trong `.venv` của project. Không cần thêm PATH.

```powershell
# Chỉ làm 1 lần
D:\Programs\Python\cpython-3.13.1-windows-x86_64-none\python.exe -m venv .venv
.venv\Scripts\python -m pip install --no-cache-dir -r requirements.txt

# Chạy web rồi mở http://localhost:8000
.venv\Scripts\python -m http.server 8000 -d web
```

Nếu mở thẳng `web/index.html` bằng cách nhấp đúp (đường dẫn `file://`), trang sẽ không đọc được `content.json`. Luôn chạy qua lệnh `http.server` ở trên.

## Kiểm thử tự động

Bật server ở trên, rồi chạy lệnh sau ở một cửa sổ PowerShell khác:

```powershell
D:\Programs\nodejs\node.exe tools\smoke.mjs
```

Lệnh này chạy 45 kiểm tra, trong đó có:
- bàn phím và menu hiển thị đủ
- mỗi phím phát đúng mp3
- bấm lại cùng phím thì không lặp câu vừa nghe
- thiếu mp3 thì trình duyệt đọc thay
- màn hình rộng 360px không bị cuộn ngang
- chế độ tối hiển thị đúng
- không có lỗi trong console

Script dùng Chromium có sẵn trong `D:\Programs\ms-playwright`.

## Sửa câu nói và tạo lại audio

1. Sửa `web/content.json`. Muốn chèn tên dự án vào câu thì viết `{brand}`.
2. Tạo các mp3 còn thiếu:
   ```powershell
   .venv\Scripts\python tools\gen_audio.py            # chỉ tạo file chưa có
   .venv\Scripts\python tools\gen_audio.py --dry-run  # xem trước, không gọi mạng
   .venv\Scripts\python tools\gen_audio.py --force    # tạo lại TẤT CẢ (ghi đè cả giọng thật!)
   ```

**Lưu ý:** mỗi câu ứng với một file theo **thứ tự** trong danh sách. Câu thứ 2 của phím 1 là file `audio/1/2.mp3`. Nếu chèn câu mới vào giữa danh sách, các file phía sau sẽ bị lệch. Có 2 cách xử lý: thêm câu mới vào cuối danh sách, hoặc xoá các file bị lệch rồi chạy lại script.

## Thay bằng giọng thu âm của các bạn nhỏ

Chép file mp3 thu âm đè lên file cùng tên trong `web/audio/...`. Bạn không phải sửa code. Script sẽ không ghi đè file đã có, trừ khi chạy với `--force`.

Nếu một file mp3 bị thiếu hoặc lỗi, trang sẽ dùng giọng đọc có sẵn của trình duyệt để đọc thay. Nếu trình duyệt cũng không có giọng đọc, trang chỉ hiện chữ.

## Đổi tên dự án

Sửa trường `"brand"` trong `web/content.json`. Tên sẽ tự cập nhật ở tiêu đề trang, lời chào và lời cảm ơn. Sau đó xoá `web/audio/greeting.mp3` và `web/audio/0/1.mp3` rồi chạy lại `gen_audio.py` để tạo lại 2 file audio có nhắc tên.

## Deploy miễn phí lên Render

1. Đẩy code lên GitHub. Repo này: https://github.com/Rod-HD/duong-day-vui-ve
2. Đăng nhập [render.com](https://render.com) bằng tài khoản GitHub. Không cần thẻ thanh toán.
3. Chọn **New → Blueprint**, chọn repo này, rồi bấm **Apply**. Render đọc file `render.yaml` và tạo một Static Site từ thư mục `web/`.
4. Bạn nhận được link `https://duong-day-vui-ve.onrender.com` (hoặc tên tương tự) để gửi cho người khác. Mỗi lần push lên `main`, Render tự deploy lại.

### Phương án dự phòng: Cloudflare Pages
Dùng khi lượng truy cập vượt mức miễn phí của Render. Vào Cloudflare dashboard, chọn **Workers & Pages → Create → Pages → Connect to Git**, chọn repo này. Để trống ô Build command, điền `web` vào ô Build output directory.

## Giới hạn miễn phí và chi phí khi vượt

Giá dưới đây là giá tham khảo, xem lại trên trang chính thức trước khi quyết định.

| Thành phần | Mức miễn phí | Khi cần hơn |
|---|---|---|
| Render Static Site (gói Hobby) | ~5GB băng thông/tháng, dùng chung cả workspace. Site không bị ngủ, có SSL | Vượt mức ~$0.15/GB, hoặc gói Pro $25/tháng (25GB) |
| Cloudflare Pages | Không giới hạn băng thông, mỗi file tối đa 25MB | Gần như không cần nâng cấp |
| edge-tts | Miễn phí nhưng không chính thức, có thể bị chặn bất cứ lúc nào. Các mp3 đã tạo thì vẫn dùng được | Azure Speech chính thức, ~$15–16 cho 1 triệu ký tự |
| Tên miền | `*.onrender.com` / `*.pages.dev` miễn phí | Tên miền riêng ~$10–12/năm |

### Khi cần số điện thoại thật (giai đoạn sau, có phí)

| Loại | Phí khởi tạo | Phí duy trì | Cước |
|---|---|---|---|
| 1800 (bạn trả cước thay người gọi) | ~1,5 triệu | ~400–550k/tháng | ~800đ–8.000đ/phút, **bạn trả**. Rất rủi ro nếu dự án viral |
| 1900 (người gọi trả) | 0–2 triệu | ~500k–1,1 triệu/tháng | Bạn được chia 35–40% doanh thu |
| Số cố định 024/028 + tổng đài cloud có IVR | thường 0 | ~300–700k/tháng | Người gọi trả cước thường. **Rẻ nhất mà vẫn hợp lệ** |

Các loại số trên thường yêu cầu hồ sơ pháp nhân.

Dùng SIM cá nhân với modem 4G và Asterisk thì không tốn phí thuê bao. Đổi lại có mấy hạn chế:
- Thường không nhận phím bấm ổn định.
- Mỗi SIM chỉ nhận một cuộc gọi tại một thời điểm.
- Máy phải bật 24/7.

## Số điện thoại

Trang **không hiển thị số điện thoại nào**. Khối "Cần giúp đỡ ngay?" chỉ có một câu nhắc chung (sửa trong `web/index.html`). Nếu sau này muốn thêm số của một tổ chức, cần xin phép họ trước.

Bản demo này chưa có số điện thoại riêng của dự án. Trang web chính là "đường dây". Khi nào có số tổng đài thật, xem mục "Khi cần số điện thoại thật" ở trên.
