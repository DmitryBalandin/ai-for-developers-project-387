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

## Conventional commit format (v1.0.0)

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type

Must be one of:
- `feat` — a new feature (correlates with `MINOR` in SemVer)
- `fix` — a bug fix (correlates with `PATCH` in SemVer)
- `build` — changes affecting build system or dependencies
- `chore` — other changes that don't modify src or test files
- `ci` — changes to CI configuration and scripts
- `docs` — documentation only changes
- `style` — formatting, missing semi-colons, etc. (no production code change)
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — code change that improves performance
- `test` — adding or correcting tests
- `revert` — reverting a previous commit

### Scope (optional)

A noun in parentheses describing the affected codebase section:

```
feat(api): add pagination
fix(parser): handle empty input
```

### Breaking change indicator (optional)

Append `!` after the type/scope to indicate a breaking change (correlates with `MAJOR` in SemVer):

```
feat!: drop support for Node 6
feat(api)!: change response format
```

### Body (optional)

A longer description after one blank line. Free-form paragraphs.

### Footers (optional)

Each footer is a word token followed by `: ` or ` #`:

```
BREAKING CHANGE: environment variables now take precedence over config files
Reviewed-by: Z
Refs: #123
```

`BREAKING CHANGE` is the standard footer for breaking changes (alternative to `!`). `BREAKING-CHANGE` is synonymous with `BREAKING CHANGE`.

### Examples

```
feat: allow provided config object to extend other configs
```
```
feat!: send an email to the customer when a product is shipped
```
```
feat(api)!: send an email to the customer when a product is shipped
```
```
docs: correct spelling of CHANGELOG
```
```
feat(lang): add Polish language
```
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```
```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```
