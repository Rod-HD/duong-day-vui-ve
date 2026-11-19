---
inclusion: always
---

# Environment rules (MANDATORY for every task)

## Project context
- Name: duong-day-vui-ve (tên hiển thị tạm: "Đường Dây Vui Vẻ")
- Description: Web "hotline" lời động viên của trẻ em cho người Việt, lấy cảm hứng từ Peptoc hotline (peptoc.org/hotline).
- Stack: HTML/CSS/JS thuần (không build, không framework) + Python script tạo audio (edge-tts).
- Hardware: không yêu cầu đặc biệt.
- Runtime context: Windows 11, PowerShell. Node có sẵn ở D:\Programs\nodejs nhưng KHÔNG dùng.

## Cost policy (project-wide)
- Demo phải 0đ: host tĩnh free (GitHub Pages / Cloudflare Pages), không backend, không DB, không API trả phí.
- Mọi đề xuất dịch vụ có phí phải ghi rõ giá + lý do, và để sau khi user duyệt.

## Drive policy
- Mọi file, venv, audio nằm trên ổ D trong thư mục project.
- KHÔNG cài gì vào ổ C.
- Python 3.13.1 (do uv quản lý) ở `D:\Programs\Python\cpython-3.13.1-windows-x86_64-none\python.exe` — chỉ dùng nó để TẠO `.venv`, không pip install global.
- Lệnh `python` trên PATH là stub Microsoft Store (không chạy) → luôn dùng đường dẫn đầy đủ ở trên hoặc `.venv\Scripts\python`.
- Tool khác: git `D:\Programs\Git`, gh `D:\Programs\gh\bin` (đã đăng nhập, `GH_CONFIG_DIR=D:\Programs\gh\config`), uv `D:\Programs\uv` (chưa có trong PATH).

## Venv path
d:\Duy\LVCF\DACD\Peptoc\.venv

## Correct invocation pattern
```powershell
D:\Programs\Python\cpython-3.13.1-windows-x86_64-none\python.exe -m venv .venv   # chỉ chạy 1 lần
.venv\Scripts\python -m pip install --no-cache-dir -r requirements.txt   # no-cache: tránh cache pip ở C
.venv\Scripts\python tools\gen_audio.py                # tạo mp3
.venv\Scripts\python -m http.server 8000 -d web        # chạy thử: http://localhost:8000
```

## Wrong patterns (NEVER use)
```powershell
pip install edge-tts          # cài global vào C
python tools\gen_audio.py     # dùng Python global
npm install ...               # project không dùng Node
```

## Project-specific paths
- Web (thư mục deploy): `web/`
- Nội dung câu nói: `web/content.json`
- Audio: `web/audio/<phím>/<số>.mp3`
- Script tạo audio: `tools/gen_audio.py`
- External services: edge-tts (dịch vụ đọc của Microsoft Edge, free, không chính thức — chỉ dùng lúc tạo file, web không gọi tới).

## Notes
- Mở `web/index.html` bằng file:// sẽ KHÔNG đọc được content.json (CORS) → luôn chạy qua http.server.
