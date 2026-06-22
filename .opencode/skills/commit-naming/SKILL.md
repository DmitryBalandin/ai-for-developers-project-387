---
name: commit-naming
description: Use when suggesting a commit title. Checks git diff for files that should be gitignored, then proposes a concise conventional-commit title.
---

# Commit Naming

When the user proposes a commit title, follow this workflow:

1. **Check `git diff`** (and `git diff --cached` if staged) to see all changed files
2. **Scan for gitignore-worthy files** — new files that match these patterns:
   - `.playwright-mcp/` — Playwright MCP debug artifacts (snapshots, screenshots, logs)
   - `test-results/` — Playwright test output
   - `playwright-report/` — Playwright HTML report
   - `playwright/.cache/` — Playwright browser cache
   - `*.log`, `*.tmp`, `*.pid` — logs and temp files
   - `.env`, `.env.local`, `.env.*.local` — secrets (must already be in gitignore)
   - `dist/`, `build/`, `.next/`, `out/` — build output
   - `*.tsbuildinfo` — TypeScript incremental info
   - `coverage/`, `.nyc_output/` — code coverage
3. **If found**: tell the user these files should be added to `.gitignore`, and don't propose a commit title until they are handled
4. **If clean**: propose a concise conventional-commit title based on the diff content

## Conventional commit format

```
<type>: <short description>
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`.
