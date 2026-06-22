# AGENTS.md

**Important:** Before committing or pushing, always ask the user for confirmation first, unless the user explicitly said to do so.

**Calendar of Calls** — упрощённый сервис бронирования времени (Cal.com-like). Владелец создаёт типы событий, гость бронирует слоты.

Два пакета: `backend/` (Fastify + TypeScript) и `frontend/` (React 19 + Vite + shadcn/ui). Данные в in-memory хранилище, сбрасываются при перезапуске.

## Команды

```bash
make install              # Frontend: npm install
make install-backend      # Backend: npm install
make dev                  # Frontend dev-server (vite, порт 5173)
make backend              # Backend dev-server (tsx watch src/server.ts, порт 3000)
make dev-all              # Backend + Frontend одновременно (для терминала)
make start                # Backend + Frontend через setsid (для AI-агента)
make stop                 # Остановка dev-серверов
make build                # Frontend build: tsc -b && vite build
make lint                 # Biome check (корень)
make format               # Biome check --write (автоформат)
make test-e2e             # Playwright e2e тесты (автозапуск серверов)
make test-backend         # Backend: vitest (unit + integration)
make prism                # API mock: prism mock ...openapi.yaml (порт 3000)
```

Также `npm run lint` / `npm run format` доступны внутри `frontend/` и `backend/` (вызывают `biome check` локально).

## API

Спецификация: `spec/main.tsp` (TypeSpec). OpenAPI 3.0: `spec/output/@typespec/openapi3/openapi.yaml`.

## Бэкенд

- Fastify + CORS, Zod валидация, nanoid, date-fns
- Линтер/форматер: Biome (единый `biome.json` в корне)
- Точка входа: `backend/src/server.ts`, запуск через `tsx watch`
- Импорты используют расширение `.js` (tsx-конвенция), не `.ts`
- `PORT` (по умолч. 3000)
- Для изоляции тестов у Store есть метод `reset()`

## Бэкенд-тесты

Vitest в `backend/src/__tests__/`. Два набора:
- `slots.test.ts` — unit-тесты `generateSlots` (чистая функция)
- `routes.test.ts` — интеграционные тесты через `app.inject()` (Fastify in-memory)

Изоляция через `store.reset()` в `beforeEach`. Запуск:

```bash
make test-backend
# или
cd backend && npm test
```

## Фронтенд

- **Tailwind CSS v4**: плагин `@tailwindcss/vite`, CSS через `@import "tailwindcss"` (нет PostCSS config)
- **Path aliases**: `@/` → `./src/`, `src/` → `./src/`
- **shadcn/ui**: компоненты в `src/components/ui/`, `cn()` в `src/lib/utils.ts`
- **Линтер/форматер**: Biome (`biome.json` в корне). `useImportType` обязателен (соответствует `verbatimModuleSyntax`)
- **TS строгости**: `verbatimModuleSyntax` (нужен `import type`), `noUnusedLocals`, `noUnusedParameters`; build через `tsc -b && vite build` (project references)
- **Роуты**: `/` (главная), `/book` (каталог), `/book/:eventTypeId` (бронь), `/owner` (панель владельца)
- **`VITE_API_URL`** (по умолч. `http://localhost:3000`)

## E2E тесты

Playwright в `frontend/e2e/`. Конфиг сам запускает бэкенд (`tsx src/server.ts`, порт 3000) и Vite (порт 5173). В dev — `reuseExistingServer: !process.env.CI`.

## Skills

| Скилл | Файл | Описание |
|-------|------|----------|
| `commit-naming` | `.opencode/skills/commit-naming/SKILL.md` | Проверка gitignore и conventional commit |
| `frontend-requirements` | `.opencode/skills/frontend-requirements/SKILL.md` | Требования к фронтенду |

## Запуск dev-серверов для AI-агента

`make dev-all` запускает процессы в foreground — при таймауте bash tool они убиваются.
Для надёжного старта используйте `make start` (через `setsid`):

```bash
make start   # Запуск бэкенда (3000) + фронтенда (5173)
make stop    # Остановка обоих серверов
```

Либо по отдельности через `setsid` напрямую:

```bash
# Бэкенд
cd backend && setsid sh -c 'exec npm run dev >> /tmp/backend.log 2>&1' &

# Фронтенд (--host для доступа по сети)
cd frontend && setsid sh -c 'exec npx vite --host >> /tmp/frontend.log 2>&1' &

# Проверка
sleep 3 && curl -s http://localhost:5173/ | head -3
```

Логи пишутся в `/tmp/backend.log` и `/tmp/frontend.log`.

## Браузерная автоматизация

Настройка Chrome, WSL Chromium и Playwright MCP: `.opencode/setup/browser-automation.md`
