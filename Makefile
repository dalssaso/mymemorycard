# MyMemoryCard Makefile
# Run `make help` to see available commands

.PHONY: help dev stop clean test test-unit test-integration test-coverage typecheck lint format install db-shell logs

# Default target
help:
	@echo "MyMemoryCard Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install          Install all dependencies (backend + frontend)"
	@echo "  make dev              Start infrastructure and show dev instructions"
	@echo "  make dev-backend      Start backend server (port 3000)"
	@echo "  make dev-frontend     Start frontend server (port 5173)"
	@echo "  make stop             Stop Docker containers"
	@echo "  make clean            Stop containers and remove volumes"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests (unit + integration)"
	@echo "  make test-unit        Run unit tests only (no Docker required)"
	@echo "  make test-integration Run integration tests (requires Docker + backend)"
	@echo "  make test-coverage    Run unit tests with coverage report"
	@echo ""
	@echo "Code Quality:"
	@echo "  make typecheck        Run TypeScript type checking"
	@echo "  make lint             Run ESLint on frontend"
	@echo "  make format           Format all code with Prettier"
	@echo "  make format-check     Check formatting without changes"
	@echo ""
	@echo "Database (Drizzle ORM):"
	@echo "  make db-shell         Open PostgreSQL shell"
	@echo "  make db-generate      Generate new migration from schema changes"
	@echo "  make db-migrate       Apply pending migrations"
	@echo "  make db-push          Push schema directly (dev only)"
	@echo "  make db-studio        Open Drizzle Studio GUI"
	@echo ""
	@echo "Production:"
	@echo "  make prod             Start production stack (uses ghcr images)"
	@echo ""
	@echo "Logs:"
	@echo "  make logs             Tail Docker container logs"

# =============================================================================
# Installation
# =============================================================================

install:
	@echo "Installing backend dependencies..."
	cd backend && bun install
	@echo "Installing frontend dependencies..."
	cd frontend && npm ci
	@echo "Done!"

# =============================================================================
# Development
# =============================================================================

# Start infrastructure and show instructions
dev:
	docker compose up -d
	@echo ""
	@echo "Infrastructure started:"
	@echo "  PostgreSQL: localhost:5433"
	@echo "  Redis:      localhost:6380"
	@echo ""
	@echo "Start the apps in separate terminals:"
	@echo "  make dev-backend      # Terminal 1"
	@echo "  make dev-frontend     # Terminal 2"

dev-backend:
	cd backend && bun run dev

dev-frontend:
	cd frontend && npm run dev

# Stop containers
stop:
	docker compose down

# Stop and remove volumes
clean:
	docker compose down -v

# =============================================================================
# Production
# =============================================================================

prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# =============================================================================
# Testing
# =============================================================================

# Run all tests
test: test-unit test-integration

# Run unit tests only (no external dependencies)
test-unit:
	@echo "Running backend unit tests..."
	cd backend && bun run test:unit
	@echo "Running frontend unit tests..."
	cd frontend && npm run test:unit

# Run unit tests for backend only
test-unit-backend:
	cd backend && bun run test:unit

# Run unit tests for frontend only
test-unit-frontend:
	cd frontend && npm run test:unit

# Run integration tests (requires Docker + backend running)
test-integration:
	@echo "Running backend integration tests..."
	@echo "Make sure Docker is running (make dev) and backend is started (make dev-backend)"
	cd backend && bun run test:integration

# Run unit tests with coverage
test-coverage:
	@echo "Running backend unit tests with coverage..."
	cd backend && bun run test:coverage
	@echo "Running frontend unit tests with coverage..."
	cd frontend && npm run test:coverage

# =============================================================================
# Code Quality
# =============================================================================

typecheck:
	@echo "Type checking backend..."
	cd backend && bun run typecheck
	@echo "Type checking frontend..."
	cd frontend && npm run typecheck

lint:
	cd frontend && npm run lint

format:
	npm run format

format-check:
	npm run format:check

# =============================================================================
# Database (Drizzle ORM)
# =============================================================================

db-shell:
	docker exec -it mymemorycard-db psql -U mymemorycard -d mymemorycard

db-generate:
	cd backend && bun run db:generate

db-migrate:
	cd backend && bun run db:migrate

db-push:
	cd backend && bun run db:push

db-studio:
	cd backend && bun run db:studio

# =============================================================================
# Logs
# =============================================================================

logs:
	docker compose logs -f
