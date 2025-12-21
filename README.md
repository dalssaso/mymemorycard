# 🎮 GameList

A self-hosted, multi-platform game library aggregator with PostgreSQL, Bun runtime, and modern React frontend.

## Features

- 🎯 **Bulk Game Import** - Paste game names and auto-enrich with metadata
- 🌐 **Multi-Platform Support** - Steam, PlayStation, Xbox, Epic Games Store
- 🏆 **Achievement Tracking** - Track trophies and achievements across platforms
- ⏱️ **Completion Times** - Get estimates from PSNProfiles and HowLongToBeat
- 📊 **Progress Dashboard** - Visualize your gaming stats
- 🔒 **Secure Auth** - Password + WebAuthn support
- 🐳 **Docker Deployment** - Easy self-hosting with Docker Compose

## Tech Stack

### Backend
- **Bun** - Fast JavaScript runtime
- **PostgreSQL 16+** with UUIDv7
- **Redis** - Session storage and caching
- TypeScript

### Frontend
- **React 19** + TypeScript
- **TanStack** Router, Query, and Table
- **shadcn/ui** + Tailwind CSS
- **Recharts** for visualizations

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 20+ (for frontend)

### Development Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd gamelist
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
- Set a strong `DB_PASSWORD`
- Set a strong `JWT_SECRET` (min 32 characters)
- Add API keys for RAWG, IGDB (optional)

4. Start Docker services:
```bash
docker-compose up -d postgres redis
```

5. Start backend:
```bash
cd backend
bun install
bun run dev
```

6. Start frontend (in new terminal):
```bash
cd frontend
npm install
npm run dev
```

7. Open http://localhost:5173

### Production Deployment

```bash
docker-compose up -d
```

This will start all services (PostgreSQL, Redis, Backend, Frontend, Nginx).

## Project Structure

```
gamelist/
├── backend/           # Bun backend with TypeScript
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── services/  # Database, Redis, external APIs
│   │   ├── middleware/# Auth, CORS
│   │   └── types/     # TypeScript types
│   └── init.sql       # Database initialization
├── frontend/          # React frontend
│   └── src/
│       ├── pages/     # Route components
│       ├── components/# Reusable components
│       ├── hooks/     # Custom hooks
│       └── lib/       # API client, utilities
├── docs/
│   ├── PLAN.org       # Implementation plan
│   └── schema.sql     # Complete database schema
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Games (Coming Soon)
- `GET /api/games` - Get user's library
- `GET /api/games/:id` - Get game details
- `PATCH /api/games/:id/status` - Update game status

### Import (Coming Soon)
- `POST /api/import/bulk` - Bulk import games

## Design System

### Colors

The app uses a **vibrant gaming theme** on a pure black base:

- **Primary Purple** (#8B5CF6) - PlayStation-inspired
- **Electric Cyan** (#06B6D4) - Accent color
- **Achievement Green** (#10B981) - Success states
- **Alert Red** (#EF4444) - Errors
- **Trophy Gold** (#F59E0B) - Completed games

### Design Rules
- ❌ NO gradients
- ✅ Solid colors with opacity
- ✅ Neon accents on interactive elements
- ✅ Glowing effects on hover
- ✅ High contrast for readability

## Roadmap

### Phase 1: Foundation ✅ (In Progress)
- [x] Project structure
- [x] Docker Compose setup
- [x] Database schema
- [x] User authentication (password)
- [ ] WebAuthn support
- [x] Basic frontend setup

### Phase 2: Bulk Import
- [ ] Bulk import UI
- [ ] RAWG API integration
- [ ] Auto-enrichment service

### Phase 3: Library View
- [ ] TanStack Table implementation
- [ ] Game cards
- [ ] Filtering and sorting

### Phase 4: Game Details & Metadata
- [ ] Game detail page
- [ ] IGDB integration
- [ ] PSNProfiles scraper
- [ ] HowLongToBeat fallback

### Phase 5: Dashboard
- [ ] Stats widgets
- [ ] Charts and visualizations
- [ ] Recent activity

### Phase 6: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design

### Phase 7 (v2): LLM Features
- [ ] Ollama integration
- [ ] Game recommendations
- [ ] Natural language search

## Contributing

This is a personal project, but suggestions are welcome! Please open an issue first to discuss changes.

## License

MIT

## Acknowledgments

- [RAWG.io](https://rawg.io) - Game metadata API
- [IGDB](https://www.igdb.com) - Additional game data
- [PSNProfiles](https://psnprofiles.com) - Trophy data
- [HowLongToBeat](https://howlongtobeat.com) - Completion times
