# MyMemoryCard

[![CI](https://github.com/dalssaso/MyMemoryCard/actions/workflows/ci.yml/badge.svg)](https://github.com/dalssaso/MyMemoryCard/actions/workflows/ci.yml)
[![Docker Build](https://github.com/dalssaso/MyMemoryCard/actions/workflows/docker.yml/badge.svg)](https://github.com/dalssaso/MyMemoryCard/actions/workflows/docker.yml)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.x-orange)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)

A self-hosted, privacy-focused game library aggregator that helps you track and manage your gaming collection across multiple platforms.

## Features

- **Bulk Import** - Paste game names and automatically enrich with RAWG metadata
- **Multi-Platform Support** - Steam, PlayStation, Xbox, Epic, Nintendo Switch, and more
- **Game Tracking** - Status (backlog/playing/finished), ratings, notes, favorites
- **Custom Statistics** - Playtime, completion %, difficulty, achievements
- **Collections** - Custom collections and auto-detected game series
- **Dashboard** - Real-time stats and visualizations
- **Data Export** - JSON and CSV formats

## Tech Stack

- **Backend**: Bun, PostgreSQL 16+, Redis, Drizzle ORM, TypeScript
- **Frontend**: React 19, TanStack (Router, Query, Table), Tailwind CSS, Recharts

## Quick Start

### Development Setup

```bash
# Clone and install
git clone https://github.com/dalssaso/MyMemoryCard.git
cd mymemorycard
make install

# Start PostgreSQL and Redis
make dev

# In separate terminals:
make dev-backend    # Backend on :3000
make dev-frontend   # Frontend on :5173
```

No `.env` file needed for local development - sensible defaults are built-in.

### Production Deployment

For production deployment, see the [deploy/](deploy/) directory:

```bash
cd deploy
cp .env.example .env
# Edit .env with your configuration

# Using Caddy (recommended - automatic HTTPS)
docker compose -f docker-compose.caddy.yml up -d

# Or using Nginx (requires manual SSL setup)
docker compose up -d

# Or using Traefik
docker compose -f docker-compose.traefik.yml up -d
```

See [deploy/README.md](deploy/README.md) for detailed deployment instructions.

## Releases

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases.

- Backend and frontend are versioned independently
- Docker images are published to GHCR on each release
- Tags follow the format: `backend-v1.0.0`, `frontend-v1.0.0`

### Docker Images

```bash
# Backend
docker pull ghcr.io/dalssaso/mymemorycard/backend:latest
docker pull ghcr.io/dalssaso/mymemorycard/backend:1.0.0

# Frontend
docker pull ghcr.io/dalssaso/mymemorycard/frontend:latest
docker pull ghcr.io/dalssaso/mymemorycard/frontend:1.0.0
```

## Development

Run `make help` to see all available commands.

### Common Commands

```bash
make dev              # Start Docker services (postgres, redis)
make dev-backend      # Run backend locally
make dev-frontend     # Run frontend locally
make typecheck        # TypeScript checking
make lint             # ESLint
make format           # Prettier formatting
```

## Project Structure

```
mymemorycard/
├── backend/           # Bun backend
│   ├── src/
│   │   ├── db/        # Drizzle schema and migrations
│   │   ├── routes/    # API routes
│   │   ├── services/  # Database, Redis, external APIs
│   │   └── middleware/# Auth, CORS
│   └── drizzle/       # Generated SQL migrations
├── frontend/          # React frontend
│   └── src/
│       ├── pages/     # Route components
│       ├── components/# UI components
│       └── hooks/     # Custom hooks
├── deploy/            # Production deployment configs
│   ├── docker-compose.yml        # Nginx (default)
│   ├── docker-compose.caddy.yml  # Caddy (auto HTTPS)
│   └── docker-compose.traefik.yml# Traefik (auto HTTPS)
├── docs/
└── docker-compose.yml # Local development (PostgreSQL, Redis)
```

### Database Migrations

Migrations run automatically on backend startup via Drizzle ORM. To create new migrations:

```bash
make db-generate      # Generate migration from schema changes
make db-studio        # Open Drizzle Studio GUI
```

## Docker Compose Files

### Development (root directory)
- `docker-compose.yml` - Infrastructure only (PostgreSQL on port 5433, Redis on port 6380)

### Production (deploy/ directory)
- `deploy/docker-compose.yml` - Production with Nginx reverse proxy
- `deploy/docker-compose.caddy.yml` - Production with Caddy (automatic HTTPS)
- `deploy/docker-compose.traefik.yml` - Production with Traefik (automatic HTTPS)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Acknowledgments

Game metadata is powered by [RAWG Video Games Database](https://rawg.io).

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0**.

### What this means:
- **Free for personal use** - Self-hosting, hobby projects, research, education
- **Free for nonprofits** - Charities, educational institutions, government
- **Not for commercial use** - Cannot be used in paid products or services

See [LICENSE](LICENSE) for the full license text.
