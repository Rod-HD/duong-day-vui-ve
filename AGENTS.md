# AGENTS.md

> Source of truth for all AI coding agents (Claude Code, Codex CLI, Antigravity).
> CLAUDE.md imports this file.

## Project: duong-day-vui-ve

Web "hotline" lời động viên của trẻ em cho người Việt — bấm số trên bàn phím ảo để nghe lời cổ vũ, lấy cảm hứng từ Peptoc hotline (peptoc.org/hotline). Demo chạy 0đ.

## How this project is organized

Kiro-style spec-driven development. Planning + progress live in `.kiro/`:

```
.kiro/
├── steering/environment.md       ← env + cost rules (always)
├── steering/codebase-graph.md    ← GRAPH codebase + tiến độ (always)
└── specs/<feature-slug>/
    ├── requirements.md           ← what (EARS)
    ├── design.md                 ← how
    ├── tasks.md                  ← checklist
    └── .config.kiro
```

## Session start — REQUIRED reading order

1. Read `.kiro/steering/*.md` with `inclusion: always` (environment.md, codebase-graph.md).
2. **Hiểu codebase qua `codebase-graph.md`. KHÔNG đọc/quét lại toàn bộ code.** Chỉ mở file code mà task hiện tại cần sửa.
3. List `.kiro/specs/` to detect active spec. For it, read `requirements.md` → `design.md` → `tasks.md`.
4. Report:
   ```
   📋 Active spec: <name>
   Progress: <X>/<Y> tasks done (<%>)
   ✅ Recently completed: Task N.M — <title>
   ▶️ Next pending: Task N.M — <title>
      Requirements traced: X.Y
   ```
5. Wait for user input. If the `kiro-spec-driven` skill is installed, invoke it.

## Task execution rules

- Take the FIRST `- [ ]` task in `tasks.md`; check its `_Requirements: X.Y_` against requirements.md.
- Implement at the exact file paths in the task.
- Verify (run script / open page / check output). `- [ ]` → `- [x]` ONLY after verification passes.
- Parent `- [x]` only when all sub-tasks are `- [x]`.
- **After each finished task, update `.kiro/steering/codebase-graph.md`**: graph (mermaid), bảng file (file → vai trò → symbol chính → phụ thuộc), trạng thái, 1 dòng nhật ký có ngày. Giữ file ngắn: chỉ ghi cái agent sau cần để không phải đọc code.

## Critical rules

1. Verification is non-negotiable. "Looks right" is not done.
2. Don't change requirements/design mid-implementation without user approval.
3. One task at a time. Don't skip ahead.
4. If a task seems already done, check `codebase-graph.md` first, then grep. Don't re-implement.
5. Drive D only. Python libs only in `.venv` (see environment.md).
6. Demo must stay free. Any paid service → ask user first, state price.

## Anti-patterns (DO NOT)

❌ Reading the whole codebase at session start (use the graph)
❌ Finishing a task without updating codebase-graph.md
❌ `pip install` outside `.venv`, installing anything to drive C
❌ Adding a framework/build step/backend without user approval
❌ Marking tasks done because "the file exists"

## Communication

- Respond in **Vietnamese**. Code comments and commit messages in **English**.
- Be concise. One specific clarifying question beats five vague ones.
