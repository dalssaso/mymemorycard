# MyMemoryCard Deployment Guide

This directory contains production-ready Docker Compose configuration for deploying MyMemoryCard.

## Quick Start

1. **Download docker-compose.yml:**

   ```bash
   mkdir mymemorycard && cd mymemorycard
   curl -O https://raw.githubusercontent.com/dalssaso/MyMemoryCard/main/deploy/docker-compose.yml
   ```

2. **Create nginx.conf** (see [Nginx Configuration](#nginx-configuration) below)

3. **Set up SSL certificates** (see [SSL Certificates](#ssl-certificates) below)

4. **Configure environment and deploy:**

   ```bash
   # Option A: Using .env file
   curl -O https://raw.githubusercontent.com/dalssaso/MyMemoryCard/main/deploy/.env.example
   cp .env.example .env
   nano .env  # Edit with your values
   docker compose up -d

   # Option B: Inline environment variables
   DB_PASSWORD=your-secure-password \
   JWT_SECRET=your-32-char-secret-key-here \
   DOMAIN=games.example.com \
   docker compose up -d
   ```

5. **Verify:**
   ```bash
   curl https://your-domain.com/api/health
   ```

## Environment Variables

### Required

| Variable      | Description                    | Example                              |
| ------------- | ------------------------------ | ------------------------------------ |
| `DB_PASSWORD` | PostgreSQL password            | `secure-random-password`             |
| `JWT_SECRET`  | JWT signing secret (32+ chars) | `your-super-secret-key-min-32-chars` |
| `DOMAIN`      | Your domain name               | `games.example.com`                  |

### Optional

| Variable        | Description                    | Default        |
| --------------- | ------------------------------ | -------------- |
| `RAWG_API_KEY`  | RAWG API key for game metadata | (none)         |
| `POSTGRES_USER` | Database username              | `mymemorycard` |
| `POSTGRES_DB`   | Database name                  | `mymemorycard` |

## SSL Certificates

### Using Certbot with DNS Validation

DNS validation is recommended as it doesn't require the server to be publicly accessible:

```bash
# Install certbot
sudo apt install certbot

# Get certificate using DNS validation
sudo certbot certonly --preferred-challenges dns -d your-domain.com

# Follow prompts to add TXT record to your DNS

# Copy certificates to your deploy directory
mkdir -p certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/
sudo chown $USER:$USER certs/*.pem
```

### Using Existing Certificates

```bash
mkdir -p certs
# Place your certificates:
# - certs/fullchain.pem
# - certs/privkey.pem
```

## Nginx Configuration

Create `nginx.conf` in your deploy directory with the following content:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # File upload size limit (for game covers, etc.)
    client_max_body_size 50M;
    client_body_timeout 120s;
    client_header_timeout 60s;

    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

    # Upstream definitions
    upstream backend {
        server backend:3000;
        keepalive 32;
    }

    upstream frontend {
        server frontend:80;
        keepalive 16;
    }

    # HTTP - Redirect to HTTPS
    server {
        listen 80;
        server_name _;

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL certificates
        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Backend API
        location /api {
            limit_req zone=api_limit burst=50 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            proxy_connect_timeout 30s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
            send_timeout 300s;

            # Buffering settings for large responses
            proxy_buffering on;
            proxy_buffer_size 128k;
            proxy_buffers 4 256k;
            proxy_busy_buffers_size 256k;
        }

        # Frontend (SPA)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Static asset caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Updating

The docker-compose file uses pinned versions that are auto-updated on each release.

**Current versions:**

- Backend: `1.1.0` <!-- x-release-please-version -->
- Frontend: `1.1.0` <!-- x-release-please-version -->

```bash
# Pull latest images
docker compose pull

# Recreate containers
docker compose up -d
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
docker compose logs nginx
```

### Test backend directly

```bash
docker exec mymemorycard-backend wget -qO- http://localhost:3000/api/health
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
              |     Nginx      |
              | (reverse proxy)|
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
- [Local development setup](../docs/local-setup.md)
- [RAWG API](https://rawg.io/apidocs)
