# Browser Automation — настройка MCP серверов

Документация по браузерным MCP серверам и инструментам для автоматизации.

## MCP Серверы

| Сервер | Тип | Описание |
|--------|-----|----------|
| `github` | local (`gh mcp`) | GitHub API — PR, issues, репозитории |
| `chrome-devtools` | local (CDP) | Chrome DevTools Protocol — браузерная автоматизация (Windows Chrome, disabled) |
| `chrome-devtools-wsl` | local (CDP) | Chrome DevTools Protocol — браузерная автоматизация (WSL Chromium, disabled) |
| `playwright` | local (CDP) | Playwright MCP — браузерная автоматизация (WSL Chromium, CDP mode, авто-запуск) |
| `shadcn` | local (`shadcn-mcp`) | shadcn/ui MCP — управление компонентами shadcn |

## Custom Tools

| Инструмент | Описание |
|-----------|----------|
| `chrome-status` | Проверка: Chrome на Windows, CDP, MCP, portproxy, вкладки, dev-сервер |
| `chrome-start` | Запуск Chrome на Windows с `--remote-debugging-port=9222` |
| `chrome-kill` | Убить Chrome на Windows, дождаться освобождения порта |
| `chrome-start-wsl` | Запуск WSL Chromium с `--remote-debugging-port=9224` |
| `chrome-status-wsl` | Проверка WSL Chromium на порту 9224, вкладки, MCP |
| `chrome-kill-wsl` | Убить WSL Chromium на порту 9224 |

## chrome-devtools (Windows Chrome)

### Архитектура

```
Windows                          WSL2
┌──────────────┐                ┌─────────────────────┐
│  Chrome.exe  │  :9222         │  chrome-devtools    │
│  (GUI+CDP)   │────┐           │  -mcp (stdio)       │
│  port 9222   │    │           │       ↑             │
└──────┬───────┘    │           │  OpenCode agent     │
       │            │           └─────────────────────┘
       │ portproxy  │ 172.x.x.x:9223
       │ 9223→9222  │
       └────────────┘
```

### Рабочий процесс

1. **Убедиться, что Chrome запущен:** `chrome-status`
2. **Если не запущен:** `chrome-start` (или двойной клик `C:\Temp\chrome-debug.bat` на Windows)
3. **Проверить:** `chrome-status` — должен показать `✅ Chrome`, `✅ Portproxy`, `✅ MCP chrome-devtools`
4. **Работа через MCP:** `navigate_page`, `take_screenshot`, `take_snapshot`, `click`, `fill`, `fill_form`, `list_console_messages`, `list_network_requests`

### Проверка

```bash
W_IP=$(ip route show default | awk '{print $3}')
curl -s "http://${W_IP}:9223/json/version"   # статус Chrome
curl -s "http://${W_IP}:9223/json"            # список вкладок
```

### Portproxy (однократно на Windows, PowerShell Admin)

```powershell
netsh interface portproxy add v4tov4 listenport=9223 listenaddress=0.0.0.0 connectport=9222 connectaddress=127.0.0.1
New-NetFirewallRule -DisplayName "Allow MCP Chrome Debug" -Direction Inbound -Protocol TCP -LocalPort 9223 -Action Allow
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| Chrome не отвечает на порт 9223 | Запустить `chrome-start` или двойной клик по `.bat` |
| `opencode mcp ls` не показывает `chrome-devtools` | Перезапустить OpenCode |
| Порт 9222 занят | `chrome-kill`, затем `chrome-start` |

## chrome-devtools-wsl (WSL Chromium)

Альтернативный MCP сервер для работы с WSL Chromium напрямую (без Windows Chrome).

### Архитектура

```
WSL2
┌────────────────────┐
│  Chromium (snap)   │  :9224
│  (GUI+CDP)         │────┐
│  port 9224         │    │
└────────────────────┘    │
                          │
              chrome-devtools-wsl
              -mcp (stdio, localhost:9224)
                     ↑
              OpenCode agent
```

### Рабочий процесс

1. **Убедиться, что WSL Chromium запущен:** `chrome-status-wsl`
2. **Если не запущен:** `chrome-start-wsl` (запускает Chromium с `--remote-debugging-port=9224`)
3. **Включить MCP сервер:** в `opencode.json` установить `"chrome-devtools-wsl"` → `"enabled": true`, а остальные браузерные MCP (`chrome-devtools`, `playwright`) → `"enabled": false`, затем `opencode mcp restart`
4. **Работа через MCP:** те же инструменты — `navigate_page`, `take_screenshot`, `take_snapshot`, `click`, `fill`, `fill_form`
5. **Выключить:** `chrome-kill-wsl`, затем переключить MCP обратно

### Проверка

```bash
curl -s "http://127.0.0.1:9224/json/version"   # статус Chromium
curl -s "http://127.0.0.1:9224/json"            # список вкладок
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| Chromium не отвечает на порт 9224 | Запустить `chrome-start-wsl`. Если скрипт сообщает "уже запущен", но порт недоступен — запустить вручную: `nohup /snap/bin/chromium --remote-debugging-port=9224 about:blank &` |
| `Snapshot`/`Screenshot` возвращают пустоту | Нет DISPLAY — Chromium запущен headless, GUI не отрисовывается |
| `opencode mcp ls` не показывает `chrome-devtools-wsl` | Проверить `"enabled": true` в `opencode.json`, перезапустить OpenCode |

## Playwright MCP

Playwright MCP — альтернатива chrome-devtools, предоставляет браузерную автоматизацию через Playwright.

### Конфигурация

Подключается к тому же WSL Chromium через CDP (`http://127.0.0.1:9224`). При старте автоматически проверяет и запускает Chromium, если он не работает.

### Инструменты

| Инструмент | Назначение |
|-----------|-----------|
| `browser_navigate` | Перейти по URL |
| `browser_click` | Кликнуть на элемент |
| `browser_fill_form` | Заполнить форму |
| `browser_snapshot` | Получить a11y-дерево |
| `browser_screenshot` | Сделать скриншот |
| `browser_console_messages` | Получить консоль |
| `browser_network_requests` | Получить сетевые запросы |
| `browser_evaluate` | Выполнить JavaScript |
| `browser_hover` | Навести на элемент |
| `browser_press_key` | Нажать клавишу |
| `browser_resize` | Изменить размер окна |
| `browser_drag` | Drag and drop |
| `browser_run_code_unsafe` | Выполнить произвольный Playwright код |

### Особенности

- Chromium запускается автоматически при старте MCP сервера (если ещё не запущен)
- Использует тот же профиль (`/tmp/chromium-wsl-profile`), что и chrome-devtools-wsl
- Работает в headed-режиме (с GUI), если доступен DISPLAY
- При остановке MCP сервера Chromium **не убивается** — остаётся работать для других сервисов

### Использование

```bash
# Проверить что Chromium запущен
curl -s http://127.0.0.1:9224/json/version

# Принудительно перезапустить Chromium
chrome-kill-wsl && chrome-start-wsl

# Переключиться на Playwright MCP (если сейчас активен другой MCP)
# В opencode.json: "playwright" → "enabled": true, остальные → false
# Затем перезапустить OpenCode
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| `playwright_browser_snapshot` возвращает пустоту | Проверить что Chromium отвечает: `curl -s http://127.0.0.1:9224/json/version` |
| `browser_navigate` не работает | Убедиться что в opencode.json `"playwright"` → `"enabled": true` |
| 404 WebSocket при подключении | `--cdp-endpoint` указан как `ws://...` вместо `http://...` — исправить в `opencode.json` |
| "Cannot connect to browser" в логах | Убить процессы: `chrome-kill-wsl`, затем снова запустить OpenCode |

## Совместимость MCP серверов

| Сервер | Статус | Порт | Браузер |
|--------|--------|------|---------|
| `chrome-devtools` | disabled | 9223 (Windows) | Chrome на Windows |
| `chrome-devtools-wsl` | disabled | 9224 (WSL) | WSL Chromium |
| `playwright` | **enabled** | 9224 (WSL, CDP) | WSL Chromium (через Playwright) |

Для переключения между серверами менять `"enabled"` в `opencode.json` и перезапускать OpenCode. Включённым должен быть **только один** из трёх браузерных MCP серверов, чтобы избежать конфликтов за порт 9224.

**Важно:** Перед включением любого браузерного MCP сервера (`chrome-devtools`, `chrome-devtools-wsl`, `playwright`) нужно проверить, что остальные два выключены (`"enabled": false`). Если включён другой — сначала выключить его, затем включить нужный.
