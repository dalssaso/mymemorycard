# Deployment with Traefik

This guide covers deploying MyMemoryCard with Traefik as a reverse proxy, including automatic SSL/TLS certificate management with Let's Encrypt.

## Prerequisites

- Ubuntu/Debian server (or similar Linux distribution)
- Domain name pointing to your server
- Docker and Docker Compose installed
- Root or sudo access

## Architecture

```
Internet → Traefik (Port 80/443) → Frontend + Backend → PostgreSQL + Redis
```

Traefik automatically:
- Routes traffic to correct services
- Obtains and renews SSL certificates
- Handles HTTP to HTTPS redirects

## Quick Deployment

### 1. Server Setup

Update system packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Docker if not already installed:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Clone and Configure

Clone the repository:

```bash
cd /opt
sudo git clone https://github.com/dalssaso/MyMemoryCard.git
cd mymemorycard
```

Configure environment:

```bash
sudo cp .env.example .env
sudo nano .env
```

Update variables including your domain:

```bash
POSTGRES_PASSWORD=your-very-secure-database-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
RAWG_API_KEY=your-rawg-api-key
DOMAIN=games.yourdomain.com
EMAIL=your-email@example.com  # For Let's Encrypt notifications
```

### 3. Create Traefik Configuration

Create Traefik directory structure:

```bash
sudo mkdir -p /opt/traefik
sudo touch /opt/traefik/acme.json
sudo chmod 600 /opt/traefik/acme.json
```

Create Traefik static configuration:

```bash
sudo nano /opt/traefik/traefik.yml
```

Add the following:

```yaml
# Traefik Static Configuration
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true

  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-public

log:
  level: INFO

accessLog:
  filePath: "/var/log/access.log"
```

### 4. Create Docker Compose Configuration

Create production docker-compose file:

```bash
sudo nano /opt/mymemorycard/docker-compose.traefik.yml
```

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /opt/traefik/traefik.yml:/traefik.yml:ro
      - /opt/traefik/acme.json:/acme.json
      - /var/log/traefik:/var/log
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      # Dashboard
      - "traefik.http.routers.traefik.rule=Host(`traefik.${DOMAIN:-localhost}`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.middlewares=traefik-auth"
      # Basic auth for dashboard (user: admin, password: change-this)
      # Generate with: echo $(htpasswd -nb admin your-password) | sed -e s/\\$/\\$\\$/g
      - "traefik.http.middlewares.traefik-auth.basicauth.users=admin:$$apr1$$xyz$$abc123"

  postgres:
    image: postgres:16
    container_name: mymemorycard-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-mymemorycard}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-mymemorycard}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-mymemorycard}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mymemorycard

  redis:
    image: redis:7-alpine
    container_name: mymemorycard-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - mymemorycard

  backend:
    build: ./backend
    container_name: mymemorycard-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-mymemorycard}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-mymemorycard}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      RAWG_API_KEY: ${RAWG_API_KEY}
      NODE_ENV: production
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - mymemorycard
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`${DOMAIN:-localhost}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=3000"
      # Security headers
      - "traefik.http.middlewares.backend-headers.headers.customResponseHeaders.X-Robots-Tag=noindex,nofollow"
      - "traefik.http.routers.backend.middlewares=backend-headers"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: mymemorycard-frontend
    restart: unless-stopped
    environment:
      VITE_API_URL: https://${DOMAIN:-localhost}
    depends_on:
      - backend
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`${DOMAIN:-localhost}`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=5173"
      # Security headers
      - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Frame-Options=SAMEORIGIN"
      - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Content-Type-Options=nosniff"
      - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-XSS-Protection=1; mode=block"
      - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.Referrer-Policy=strict-origin-when-cross-origin"
      - "traefik.http.middlewares.security-headers.headers.sslRedirect=true"
      - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.security-headers.headers.stsPreload=true"
      - "traefik.http.routers.frontend.middlewares=security-headers"

volumes:
  postgres_data:
  redis_data:

networks:
  traefik-public:
    external: true
  mymemorycard:
    driver: bridge
```

### 5. Create Traefik Network

```bash
sudo docker network create traefik-public
```

### 6. Generate Dashboard Password

Install apache2-utils:

```bash
sudo apt install apache2-utils -y
```

Generate password hash:

```bash
echo $(htpasswd -nb admin your-secure-password) | sed -e s/\\$/\\$\\$/g
```

Copy the output and update the `traefik-auth` label in docker-compose.traefik.yml.

### 7. Start Services

```bash
cd /opt/mymemorycard
sudo docker-compose -f docker-compose.traefik.yml up -d
```

Check logs:

```bash
sudo docker-compose -f docker-compose.traefik.yml logs -f
```

### 8. Verify Deployment

Visit your domain:
- Main app: `https://games.yourdomain.com`
- Traefik dashboard: `https://traefik.yourdomain.com` (use admin credentials)

Test API:

```bash
curl https://games.yourdomain.com/api/health
```

## Advanced Configuration

### Rate Limiting

Add rate limiting middleware to docker-compose.traefik.yml:

```yaml
services:
  backend:
    labels:
      # ... existing labels
      - "traefik.http.middlewares.api-ratelimit.ratelimit.average=100"
      - "traefik.http.middlewares.api-ratelimit.ratelimit.burst=50"
      - "traefik.http.routers.backend.middlewares=backend-headers,api-ratelimit"
```

### IP Whitelisting

Restrict access to specific IPs:

```yaml
services:
  traefik:
    labels:
      # ... existing labels
      - "traefik.http.middlewares.whitelist.ipwhitelist.sourcerange=192.168.1.0/24,1.2.3.4"
      - "traefik.http.routers.traefik.middlewares=traefik-auth,whitelist"
```

### Custom Error Pages

Create error pages directory:

```bash
sudo mkdir -p /opt/traefik/errors
```

Create error page:

```bash
sudo nano /opt/traefik/errors/503.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>Service Unavailable</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #8B5CF6; }
    </style>
</head>
<body>
    <h1>503 - Service Temporarily Unavailable</h1>
    <p>We're performing maintenance. Please check back soon.</p>
</body>
</html>
```

Update Traefik config:

```yaml
traefik:
  volumes:
    # ... existing volumes
    - /opt/traefik/errors:/errors:ro
  labels:
    # ... existing labels
    - "traefik.http.middlewares.error-pages.errors.status=503"
    - "traefik.http.middlewares.error-pages.errors.service=error-pages-service"
    - "traefik.http.middlewares.error-pages.errors.query=/{status}.html"
    - "traefik.http.services.error-pages-service.loadbalancer.server.url=file:///errors"
```

### Gzip Compression

Enable compression:

```yaml
services:
  frontend:
    labels:
      # ... existing labels
      - "traefik.http.middlewares.gzip.compress=true"
      - "traefik.http.routers.frontend.middlewares=security-headers,gzip"
```

## Monitoring

### Access Logs

View Traefik access logs:

```bash
sudo tail -f /var/log/traefik/access.log
```

### Container Logs

```bash
# All services
sudo docker-compose -f docker-compose.traefik.yml logs -f

# Specific service
sudo docker logs -f traefik
sudo docker logs -f mymemorycard-backend
```

### Metrics with Prometheus

Update traefik.yml:

```yaml
metrics:
  prometheus:
    buckets:
      - 0.1
      - 0.3
      - 1.2
      - 5.0
    addEntryPointsLabels: true
    addServicesLabels: true
```

Add Prometheus to docker-compose:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(`prometheus.${DOMAIN}`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"
      - "traefik.http.routers.prometheus.tls.certresolver=letsencrypt"

volumes:
  prometheus_data:
```

## Backup and Restore

### Automated Backups

Create backup script:

```bash
sudo nano /opt/mymemorycard/backup-traefik.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/mymemorycard/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec mymemorycard-db pg_dump -U mymemorycard mymemorycard | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup Traefik certificates
cp /opt/traefik/acme.json $BACKUP_DIR/acme_$TIMESTAMP.json

# Backup environment
cp /opt/mymemorycard/.env $BACKUP_DIR/env_$TIMESTAMP

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "acme_*.json" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

Make executable and schedule:

```bash
sudo chmod +x /opt/mymemorycard/backup-traefik.sh
sudo crontab -e
```

Add:

```
0 2 * * * /opt/mymemorycard/backup-traefik.sh >> /var/log/mymemorycard-backup.log 2>&1
```

### Restore

```bash
# Stop services
sudo docker-compose -f docker-compose.traefik.yml down

# Restore database
gunzip -c /opt/mymemorycard/backups/db_TIMESTAMP.sql.gz | \
  docker exec -i mymemorycard-db psql -U mymemorycard -d mymemorycard

# Restore certificates
sudo cp /opt/mymemorycard/backups/acme_TIMESTAMP.json /opt/traefik/acme.json
sudo chmod 600 /opt/traefik/acme.json

# Start services
sudo docker-compose -f docker-compose.traefik.yml up -d
```

## Firewall Configuration

Using UFW:

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Maintenance

### Update Services

```bash
cd /opt/mymemorycard

# Pull latest code
sudo git pull

# Rebuild and restart
sudo docker-compose -f docker-compose.traefik.yml down
sudo docker-compose -f docker-compose.traefik.yml build
sudo docker-compose -f docker-compose.traefik.yml up -d
```

### Update Traefik

```bash
# Pull latest image
sudo docker pull traefik:v2.10

# Recreate container
sudo docker-compose -f docker-compose.traefik.yml up -d traefik
```

### Certificate Renewal

Traefik automatically renews certificates. To force renewal:

```bash
# Remove acme.json
sudo rm /opt/traefik/acme.json
sudo touch /opt/traefik/acme.json
sudo chmod 600 /opt/traefik/acme.json

# Restart Traefik
sudo docker-compose -f docker-compose.traefik.yml restart traefik
```

## Troubleshooting

### Certificate Issues

Check Traefik logs:

```bash
sudo docker logs traefik 2>&1 | grep -i acme
```

Verify domain DNS:

```bash
dig games.yourdomain.com
nslookup games.yourdomain.com
```

### 502 Bad Gateway

Check backend health:

```bash
sudo docker exec mymemorycard-backend curl http://localhost:3000/api/health
```

Check network:

```bash
sudo docker network inspect traefik-public
```

### Dashboard Not Accessible

Verify Traefik is running:

```bash
sudo docker ps | grep traefik
```

Check labels:

```bash
sudo docker inspect traefik | grep -A 20 Labels
```

## Performance Optimization

### Connection Pooling

Update backend environment:

```yaml
backend:
  environment:
    # ... existing vars
    DB_POOL_MIN: 2
    DB_POOL_MAX: 10
```

### Enable HTTP/3

Update traefik.yml:

```yaml
experimental:
  http3: true

entryPoints:
  websecure:
    address: ":443"
    http3: {}
```

### Caching Static Assets

Add caching middleware:

```yaml
services:
  frontend:
    labels:
      # ... existing labels
      - "traefik.http.middlewares.cache-control.headers.customResponseHeaders.Cache-Control=public, max-age=31536000"
      - "traefik.http.routers.frontend.middlewares=security-headers,cache-control"
```

## Security Best Practices

1. **Change default credentials** for Traefik dashboard
2. **Use strong passwords** for database and JWT
3. **Keep Traefik updated** to latest stable version
4. **Enable fail2ban** for SSH protection
5. **Regular backups** with off-site storage
6. **Monitor logs** for suspicious activity
7. **Use Docker secrets** for sensitive data in production

## Additional Resources

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Traefik Middlewares](https://doc.traefik.io/traefik/middlewares/overview/)
