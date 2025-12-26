# MyMemoryCard

[![CI](https://github.com/dalssaso/MyMemoryCard/actions/workflows/ci.yml/badge.svg)](https://github.com/dalssaso/MyMemoryCard/actions/workflows/ci.yml)
[![Docker Build](https://github.com/dalssaso/MyMemoryCard/actions/workflows/docker.yml/badge.svg)](https://github.com/dalssaso/MyMemoryCard/actions/workflows/docker.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
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

- **Backend**: Bun, PostgreSQL 16+, Redis, TypeScript
- **Frontend**: React 19, TanStack (Router, Query, Table), Tailwind CSS, Recharts

## Quick Start

### Development Setup

```bash
# Clone and install
git clone https://github.com/dalssaso/MyMemoryCard.git
cd mymemorycard
make install

# Configure environment
cp .env.example backend/.env.local

# Start PostgreSQL and Redis
make dev

# In separate terminals:
make dev-backend    # Backend on :3000
make dev-frontend   # Frontend on :5173
```

### Production Deployment

```bash
cp .env.example .env
# Edit .env with production values
make prod
```

See [docs/local-setup.md](docs/local-setup.md) for detailed setup instructions.

## Development

Run `make help` to see all available commands.

### Common Commands

```bash
make dev              # Start Docker services (postgres, redis)
make dev-backend      # Run backend locally
make dev-frontend     # Run frontend locally
make test             # Run all tests
make test-unit        # Unit tests only (no Docker needed)
make test-integration # Integration tests (requires Docker + backend)
make typecheck        # TypeScript checking
make lint             # ESLint
make format           # Prettier formatting
```

### Testing

Two-tier testing strategy:

- **Unit tests**: No external dependencies, fast, mocked services
- **Integration tests**: Real PostgreSQL/Redis via Docker

```bash
make test-unit        # Run unit tests
make test-integration # Run integration tests (start Docker + backend first)
make test-coverage    # Unit tests with coverage (90% threshold)
```

## Project Structure

```
mymemorycard/
├── backend/           # Bun backend
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── services/  # Database, Redis, external APIs
│   │   └── middleware/# Auth, CORS
│   └── tests/
│       ├── unit/      # Unit tests (mocked)
│       └── integration/ # Integration tests
├── frontend/          # React frontend
│   └── src/
│       ├── pages/     # Route components
│       ├── components/# UI components
│       └── hooks/     # Custom hooks
├── docs/
└── docker-compose.yml # PostgreSQL + Redis
```

## Docker Compose Files

- `docker-compose.yml` - Infrastructure only (PostgreSQL, Redis)
- `docker-compose.prod.yml` - Production with pre-built images

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](LICENSE)

---


