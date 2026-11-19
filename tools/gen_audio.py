"""Generate mp3 files for web/content.json using edge-tts (free, unofficial Microsoft Edge voices).

Usage (from project root):
    .venv\\Scripts\\python tools\\gen_audio.py            # create missing files only
    .venv\\Scripts\\python tools\\gen_audio.py --force    # overwrite everything (replaces real recordings!)
    .venv\\Scripts\\python tools\\gen_audio.py --dry-run  # list what would happen, no network
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent / "web"


def jobs(content):
    """Return [(relative mp3 path, text, voice)] in the order app.js expects."""
    fill = lambda s: s.replace("{brand}", content["brand"])
    out = [("audio/greeting.mp3", fill(content["greeting"]), content["voice"])]
    for key, opt in content["options"].items():
        voice = opt.get("voice", content["voice"])
        for i, text in enumerate(opt["messages"], 1):
            out.append((f"audio/{key}/{i}.mp3", fill(text), voice))
    return out


def _selfcheck():
    c = {"brand": "B", "voice": "vi", "greeting": "hi {brand}",
         "options": {"1": {"messages": ["a", "b"]}, "5": {"voice": "en", "messages": ["x"]}}}
    j = jobs(c)
    assert [p for p, _, _ in j] == ["audio/greeting.mp3", "audio/1/1.mp3", "audio/1/2.mp3", "audio/5/1.mp3"], j
    assert j[0][1] == "hi B" and j[1][2] == "vi" and j[3][2] == "en", j


async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--force", action="store_true", help="overwrite existing mp3 files")
    ap.add_argument("--dry-run", action="store_true", help="only print the plan")
    args = ap.parse_args()

    content = json.loads((WEB / "content.json").read_text(encoding="utf-8"))
    failed = []
    for rel, text, voice in jobs(content):
        path = WEB / rel
        if path.exists() and not args.force:
            print("skip", rel)
            continue
        if args.dry_run:
            print("make", rel, voice)
            continue
        import edge_tts  # imported here so --dry-run works without the package
        path.parent.mkdir(parents=True, exist_ok=True)
        try:
            await edge_tts.Communicate(text, voice).save(str(path))
            print("ok  ", rel)
        except Exception as e:  # keep going after a failure (Req 4.4)
            path.unlink(missing_ok=True)  # never leave a half-written file that would be skipped next run
            failed.append(rel)
            print("FAIL", rel, repr(e), file=sys.stderr)
    if failed:
        print(f"{len(failed)} file(s) failed: {', '.join(failed)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    _selfcheck()
    asyncio.run(main())
