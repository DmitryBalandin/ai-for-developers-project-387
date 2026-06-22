---
name: backend-architecture
description: Conventions and architecture rules for the Calendar of Calls backend (Fastify + TypeScript).
---

# Backend Architecture

## Разделение ответственности

| Слой | Где | Что делает |
|------|-----|------------|
| **Routes** | `routes/*.ts` | Транспорт: парсинг входа (Zod body/params/query), вызов сервиса, HTTP-ответ |
| **Services** | `services/*.ts` | Бизнес-логика: чистые функции, доменные правила, не знают про HTTP |
| **Store** | `store.ts` | Данные: CRUD, синглтон, in-memory |
| **Types** | `types.ts` | Общие интерфейсы и DTO |

## Правила

- **Zod** только в routes — структурная валидация (формат, required, границы)
- **Бизнес-проверки** только в services — доменные инварианты (пересечение слотов, дата в прошлом)
- **Route не содержит бизнес-логику** — только парсинг → вызов → ответ
- **services не содержат Zod и HTTP** — чистая работа с типами, кидают `BookingError` (error + statusCode)
- `as`-касты `request.params` / `request.query` **запрещены** — только `z.schema.safeParse()`
- Импорты с расширением `.js`

## Ошибки

- `BookingError(message, statusCode?)` из `services/bookings.ts` — для доменных ошибок
- Route ловит `BookingError` и отдаёт `{ code, message }` с нужным статусом
- Глобальный error handler в `app.ts` — fallback для непредвиденных ошибок

## Тесты

- Unit-тесты на чистые функции из services — без Fastify, напрямую
- Интеграционные тесты на routes — через `app.inject()`
- `store.reset()` в `beforeEach` для изоляции
