"""Write web/qr.svg pointing at the demo URL (re-run if the URL changes).

Usage: .venv\\Scripts\\python tools\\make_qr.py [url]
"""
import sys
from pathlib import Path

import qrcode
import qrcode.image.svg

URL = sys.argv[1] if len(sys.argv) > 1 else "https://duong-day-vui-ve.onrender.com/"
OUT = Path(__file__).resolve().parent.parent / "web" / "qr.svg"

# High error correction so the code still scans when printed small or slightly smudged.
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=2)
qr.add_data(URL)
qr.make(fit=True)
qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(OUT)
print(f"{OUT.name}: {URL} (version {qr.version})")
