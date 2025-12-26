# Local Development Setup

## Prerequisites

- **Bun** v1.0+ - [bun.sh](https://bun.sh)
- **Node.js** v20+ - [nodejs.org](https://nodejs.org)
- **Docker** and **Docker Compose** - [docker.com](https://docs.docker.com/get-docker/)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/dalssaso/MyMemoryCard.git
cd mymemorycard
make install
```

### 2. Configure Environment

```bash
cp .env.example backend/.env.local
```

Edit `backend/.env.local`:

```bash
# Database (Docker PostgreSQL on port 5433)
DATABASE_URL=postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard

# Redis (Docker Redis on port 6380)
REDIS_URL=redis://localhost:6380

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-dev-jwt-secret-change-in-production

# RAWG API (optional, get from https://rawg.io/apidocs)
RAWG_API_KEY=
```

### 3. Start Services

```bash
make dev
```

This starts PostgreSQL (port 5433) and Redis (port 6380) in Docker.

### 4. Start Development Servers

In separate terminals:

```bash
# Terminal 1: Backend
make dev-backend    # http://localhost:3000

# Terminal 2: Frontend
make dev-frontend   # http://localhost:5173
```

## Verify Setup

```bash
# Health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

Open http://localhost:5173 in your browser.

## Common Tasks

### Database

```bash
make db-shell       # Open PostgreSQL shell
make db-migrate     # Run migrations
```

### Testing

```bash
make test-unit        # Unit tests (no Docker needed)
make test-integration # Integration tests (requires running backend)
make test-coverage    # Coverage report
```

### Code Quality

```bash
make typecheck      # TypeScript checking
make lint           # ESLint (frontend)
make format         # Prettier formatting
```

### Stop/Clean

```bash
make stop           # Stop Docker containers
make clean          # Stop and remove volumes (deletes data)
```

## Troubleshooting

### Port conflicts

PostgreSQL uses port 5433 and Redis uses port 6380 to avoid conflicts with local installations.

### Backend won't connect

Ensure Docker containers are running:

```bash
docker ps
# Should show mymemorycard-db and mymemorycard-redis
```

### Reset database

```bash
make clean
make dev
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection (port 5433) |
| `REDIS_URL` | Yes | - | Redis connection (port 6380) |
| `JWT_SECRET` | Yes | - | JWT signing key (min 32 chars) |
| `RAWG_API_KEY` | No | - | RAWG API for game metadata |
