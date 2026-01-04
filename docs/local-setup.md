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

### 2. Start Services

```bash
make dev
```

This starts PostgreSQL (port 5433) and Redis (port 6380) in Docker.

### 3. Start Development Servers

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

### Database (Drizzle ORM)

Migrations run automatically on backend startup. For manual control:

```bash
make db-shell       # Open PostgreSQL shell
make db-generate    # Generate migration from schema changes
make db-migrate     # Apply pending migrations via drizzle-kit
make db-push        # Push schema directly (dev only)
make db-studio      # Open Drizzle Studio GUI
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

## Configuration

The backend uses sensible defaults for local development. No `.env` file is needed.

| Variable       | Default                                                             | Description                               |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL` | `postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard` | PostgreSQL connection                     |
| `REDIS_URL`    | `redis://localhost:6380`                                            | Redis connection                          |
| `JWT_SECRET`   | `dev-jwt-secret-change-in-production`                               | JWT signing key                           |
| `RAWG_API_KEY` | -                                                                   | RAWG API for game metadata (optional)     |
| `PORT`         | `3000`                                                              | Backend server port                       |
| `ORIGIN`       | -                                                                   | Additional allowed CORS origin (optional) |

For production, set these via environment variables in `docker-compose.prod.yml`.
