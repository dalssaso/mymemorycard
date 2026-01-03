# MyMemoryCard Deployment Guide

This directory contains production-ready Docker Compose configurations for deploying MyMemoryCard.

## Quick Start

1. **Choose your reverse proxy:**
   - `docker-compose.yml` - Nginx (default, requires manual SSL setup)
   - `docker-compose.caddy.yml` - Caddy (automatic HTTPS, recommended)
   - `docker-compose.traefik.yml` - Traefik (automatic HTTPS, Docker-native)

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

3. **Deploy:**
   ```bash
   # Nginx (default) - requires SSL certificates in ./certs/
   docker compose up -d

   # Caddy (recommended for automatic HTTPS)
   docker compose -f docker-compose.caddy.yml up -d

   # Traefik
   docker compose -f docker-compose.traefik.yml up -d
   ```

4. **Verify:**
   ```bash
   curl https://your-domain.com/api/health
   ```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `secure-random-password` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-super-secret-key-min-32-chars` |
| `DOMAIN` | Your domain name | `games.example.com` |
| `ACME_EMAIL` | Email for Let's Encrypt (Caddy/Traefik) | `admin@example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RAWG_API_KEY` | RAWG API key for game metadata | (none) |
| `BACKEND_VERSION` | Backend image version | `latest` |
| `FRONTEND_VERSION` | Frontend image version | `latest` |
| `POSTGRES_USER` | Database username | `mymemorycard` |
| `POSTGRES_DB` | Database name | `mymemorycard` |

## Reverse Proxy Comparison

| Feature | Nginx | Caddy | Traefik |
|---------|-------|-------|---------|
| Automatic HTTPS | No | Yes | Yes |
| Config complexity | Medium | Low | Medium |
| Performance | Highest | High | High |
| Docker integration | Manual | Manual | Native |
| HTTP/3 support | No | Yes | Yes |

## SSL Certificate Setup

### Caddy and Traefik (Automatic)

SSL certificates are automatically obtained from Let's Encrypt. Just ensure:
- Port 80 is accessible from the internet (for ACME challenge)
- `DOMAIN` and `ACME_EMAIL` are configured in `.env`

### Nginx (Manual)

**Option 1: Use certbot**
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to deploy/certs/
mkdir -p certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/
sudo chown $USER:$USER certs/*.pem
```

**Option 2: Use existing certificates**
```bash
mkdir -p certs
# Place your certificates:
# - certs/fullchain.pem
# - certs/privkey.pem
```

## Timeouts for AI Features

All reverse proxy configurations include extended timeouts (5 minutes) to support:
- AI Curator recommendations (can take 60-120+ seconds)
- Bulk import operations
- Large file uploads (up to 50MB)

The relevant settings are:
- **Nginx:** `proxy_read_timeout 300s`
- **Caddy:** `response_header_timeout 300s`
- **Traefik:** `readTimeout: 300s`

## Updating

The docker-compose files are pinned to specific versions that are auto-updated on each release.

**Current versions:**
- Backend: `1.1.0` <!-- x-release-please-version -->
- Frontend: `1.1.0` <!-- x-release-please-version -->

```bash
# Pull latest images (uses pinned versions in docker-compose files)
docker compose pull

# Recreate containers
docker compose up -d
```

To use a different version, edit the image tags in the docker-compose file or override with environment variables:

```bash
# Override to use latest
docker compose up -d --pull always
```

## Backup and Restore

### Database Backup
```bash
docker exec mymemorycard-postgres pg_dump -U mymemorycard mymemorycard > backup-$(date +%Y%m%d).sql
```

### Database Restore
```bash
docker exec -i mymemorycard-postgres psql -U mymemorycard mymemorycard < backup.sql
```

### Volume Backup
```bash
# Stop services first
docker compose down

# Backup volumes
docker run --rm -v mymemorycard_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz /data
docker run --rm -v mymemorycard_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-data.tar.gz /data
```

## Troubleshooting

### Check service health
```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
docker compose logs nginx  # or caddy/traefik
```

### Test backend directly
```bash
docker exec mymemorycard-backend wget -qO- http://localhost:3000/api/health
```

### Check certificate status (Caddy)
```bash
docker exec mymemorycard-caddy caddy list-certificates
```

### Check Traefik dashboard (if enabled)
```bash
# Enable dashboard in traefik.yml first
docker exec mymemorycard-traefik traefik healthcheck
```

### Database connection issues
```bash
# Check PostgreSQL is healthy
docker exec mymemorycard-postgres pg_isready -U mymemorycard

# Check logs
docker compose logs postgres
```

### Reset everything
```bash
# Stop and remove containers, volumes, and networks
docker compose down -v

# Start fresh
docker compose up -d
```

## Architecture

```
                    Internet
                       |
                       v
              +----------------+
              | Reverse Proxy  |
              | (nginx/caddy/  |
              |   traefik)     |
              +-------+--------+
                      |
         +------------+------------+
         |                         |
         v                         v
   +----------+              +----------+
   | Frontend |              | Backend  |
   | (nginx)  |              |  (bun)   |
   +----------+              +----+-----+
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
              +----------+               +----------+
              | Postgres |               |  Redis   |
              +----------+               +----------+
```

## Resources

- [Full documentation](../docs/)
- [AI Curator setup](../docs/ai-curator-settings/)
- [Local development setup](../docs/local-setup.md)
- [RAWG API](https://rawg.io/apidocs)
