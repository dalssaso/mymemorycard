default:
  just --list

setup:
  npm ci
  npm ci --prefix frontend
  cd backend && bun install --frozen-lockfile
  npx husky install

install: setup
deps: setup

ci:
  just lint
  just typecheck
  just format-check

dev:
  docker compose up -d

dev-backend:
  cd backend && bun run dev

dev-frontend:
  npm run dev --prefix frontend

start-backend:
  cd backend && bun run start

start-frontend:
  npm run preview --prefix frontend

stop:
  docker compose down

clean:
  docker compose down -v

logs:
  docker compose logs -f

typecheck:
  cd backend && bun run typecheck
  npm run typecheck --prefix frontend

typecheck-backend:
  cd backend && bun run typecheck

typecheck-frontend:
  npm run typecheck --prefix frontend

lint:
  cd backend && bun run lint
  npm run lint --prefix frontend

lint-backend:
  cd backend && bun run lint

lint-frontend:
  npm run lint --prefix frontend

format:
  cd backend && bun run format
  npm run format --prefix frontend

format-check:
  cd backend && bun run format:check
  npm run format:check --prefix frontend

format-backend:
  cd backend && bun run format

format-frontend:
  npm run format --prefix frontend

format-check-backend:
  cd backend && bun run format:check

format-check-frontend:
  npm run format:check --prefix frontend

test:
  just test-unit
  just test-integration

test-unit:
  cd backend && bun run test:unit
  npm run test:unit --prefix frontend

test-unit-backend:
  cd backend && bun run test:unit

test-unit-frontend:
  npm run test:unit --prefix frontend

test-integration:
  cd backend && bun run test:integration

test-coverage:
  cd backend && bun run test:coverage
  npm run test:coverage --prefix frontend

db-shell:
  docker compose exec -it postgres psql -U mymemorycard -d mymemorycard

db-generate:
  cd backend && bun run db:generate

db-migrate:
  cd backend && bun run db:migrate

db-push:
  cd backend && bun run db:push

db-studio:
  cd backend && bun run db:studio

build:
  just build-backend
  just build-frontend

build-backend:
  docker build -t mymemorycard-backend:local -f backend/Dockerfile backend

build-frontend:
  docker build -t mymemorycard-frontend:local -f frontend/Dockerfile frontend
