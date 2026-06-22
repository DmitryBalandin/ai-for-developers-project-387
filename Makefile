.PHONY: dev prism build install backend dev-all lint format start stop

lint:
	npx biome check

format:
	npx biome check --write

dev:
	cd frontend && npm run dev

prism:
	cd frontend && npm run prism

backend:
	cd backend && npm run dev

build:
	cd frontend && npm run build

install:
	cd frontend && npm install

install-backend:
	cd backend && npm install

test-e2e:
	cd frontend && npm run test:e2e

test-backend:
	cd backend && npm run test

dev-all:
	@echo "Starting backend on port 3000..."
	cd backend && npm run dev &
	@echo "Waiting for backend..."
	@for i in $$(seq 1 10); do curl -s http://localhost:3000/api/event-types > /dev/null 2>&1 && break; sleep 1; done
	@echo "Starting Vite dev server..."
	cd frontend && npm run dev

# Запуск dev-серверов для AI-агента (процессы выживают после таймаута bash tool)
start:
	@echo "Starting backend on port 3000..."
	@cd backend && setsid sh -c 'exec npm run dev >> /tmp/backend.log 2>&1' &
	@sleep 1
	@echo "Waiting for backend..."
	@for i in $$(seq 1 15); do curl -s http://localhost:3000/api/event-types > /dev/null 2>&1 && break; sleep 1; done
	@echo "Starting frontend on port 5173..."
	@cd frontend && setsid sh -c 'exec npx vite --host >> /tmp/frontend.log 2>&1' &
	@sleep 1
	@echo "Waiting for frontend..."
	@for i in $$(seq 1 15); do curl -s http://localhost:5173/ > /dev/null 2>&1 && break; sleep 1; done
	@echo "Backend PID: $$(lsof -ti :3000)"
	@echo "Frontend PID: $$(lsof -ti :5173)"
	@echo "Dev servers are running."

# Остановка dev-серверов
stop:
	@echo "Stopping dev servers..."
	@kill $$(lsof -ti :3000) 2>/dev/null || true
	@kill $$(lsof -ti :5173) 2>/dev/null || true
	@sleep 1
	@echo "Dev servers stopped."
