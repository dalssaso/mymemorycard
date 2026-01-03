# Deployment with Caddy

> **Quick Start:** For the simplest deployment experience, use the pre-configured Docker Compose files
> in the [`/deploy`](../deploy/) directory. Run `cd deploy && docker compose -f docker-compose.caddy.yml up -d`
> after configuring your `.env` file. This guide covers manual server setup if you prefer to run Caddy directly on the host.

This guide covers deploying MyMemoryCard with Caddy as a reverse proxy. Caddy automatically handles SSL/TLS certificates with zero configuration.

## Image Versions

Production docker-compose files use pinned versions that are auto-updated on each release:

- Backend: `1.1.0` <!-- x-release-please-version -->
- Frontend: `1.1.0` <!-- x-release-please-version -->

Images are pulled from GitHub Container Registry:
```bash
ghcr.io/dalssaso/mymemorycard/backend:1.1.0
ghcr.io/dalssaso/mymemorycard/frontend:1.1.0
```

See the [release process documentation](./release-process.md) for more details.

## Prerequisites

- Ubuntu/Debian server (or similar Linux distribution)
- Domain name pointing to your server
- Docker and Docker Compose installed
- Root or sudo access

## Why Caddy?

- **Automatic HTTPS**: Zero-config SSL with Let's Encrypt
- **Simple Configuration**: Clean, readable Caddyfile syntax
- **HTTP/3 Support**: Built-in QUIC support
- **Zero Downtime Reloads**: Graceful configuration updates

## Architecture

```
Internet → Caddy (Port 80/443) → Frontend + Backend → PostgreSQL + Redis
```

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

Update variables:

```bash
POSTGRES_PASSWORD=your-very-secure-database-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
RAWG_API_KEY=your-rawg-api-key
DOMAIN=games.yourdomain.com
EMAIL=your-email@example.com
```

### 3. Create Caddyfile

Create Caddy configuration:

```bash
sudo nano /opt/mymemorycard/Caddyfile
```

Add the following configuration:

```caddy
# MyMemoryCard - Main Application
{$DOMAIN:localhost} {
    # Automatic HTTPS
    encode gzip zstd

    # Security headers
    header {
        # Enable HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"
        # Prevent MIME sniffing
        X-Content-Type-Options "nosniff"
        # XSS Protection
        X-XSS-Protection "1; mode=block"
        # Referrer Policy
        Referrer-Policy "strict-origin-when-cross-origin"
        # Remove server header
        -Server
    }

    # API routes
    handle /api/* {
        reverse_proxy backend:3000 {
            # Health check
            health_uri /api/health
            health_interval 10s
            health_timeout 5s
            
            # Headers
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Frontend
    handle {
        reverse_proxy frontend:5173 {
            # Headers
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Logging
    log {
        output file /var/log/caddy/access.log {
            roll_size 10mb
            roll_keep 10
        }
        format json
    }
}

# Optional: Metrics endpoint
:2019 {
    metrics /metrics
}
```

For a simpler configuration (Caddy's default security is already good):

```caddy
{$DOMAIN:localhost} {
    encode gzip
    
    reverse_proxy /api/* backend:3000
    reverse_proxy frontend:5173
    
    log {
        output file /var/log/caddy/access.log
    }
}
```

### 4. Use Production Docker Compose

Use the pre-configured production docker-compose file from the `deploy/` directory:

```bash
cd deploy
cp .env.example .env
# Edit .env with your configuration (DOMAIN, ACME_EMAIL required)

docker compose -f docker-compose.caddy.yml up -d
```

The `deploy/docker-compose.caddy.yml` file uses pre-built images from GitHub Container Registry with pinned versions. See [`deploy/README.md`](../deploy/README.md) for full configuration options.

Key features of the production configuration:
- Pre-built multi-platform images (amd64/arm64)
- Automatic HTTPS via Let's Encrypt
- HTTP/3 support
- Health checks for all services
- Network isolation (internal network for databases)

### 5. Verify Deployment

Caddy will automatically:
- Obtain SSL certificates from Let's Encrypt
- Configure HTTPS
- Set up HTTP to HTTPS redirects

Check logs:

```bash
docker compose -f docker-compose.caddy.yml logs -f caddy
```

Test the deployment:

```bash
# Health check
curl https://games.yourdomain.com/api/health

# Should return: {"status":"ok"}
```

Visit `https://games.yourdomain.com` in your browser.

Check certificate:

```bash
curl -vI https://games.yourdomain.com 2>&1 | grep -i "subject:"
```

## Advanced Configuration

### Rate Limiting

Create advanced Caddyfile with rate limiting:

```caddy
{$DOMAIN:localhost} {
    encode gzip

    # Rate limit API endpoints
    @api {
        path /api/*
    }
    
    handle @api {
        # 100 requests per minute per IP
        rate_limit {
            zone api {
                key {remote_host}
                events 100
                window 1m
            }
        }
        reverse_proxy backend:3000
    }

    handle {
        reverse_proxy frontend:5173
    }
}
```

Note: Rate limiting requires the `caddy-rate-limit` plugin. Use the extended Caddy image:

```yaml
caddy:
  image: caddy:2-builder-alpine AS builder
  # ... build with rate limit plugin
```

### IP Whitelisting

Restrict admin access:

```caddy
{$DOMAIN:localhost} {
    @admin {
        path /api/admin/*
    }

    handle @admin {
        # Only allow from specific IPs
        @allowed {
            remote_ip 192.168.1.0/24 1.2.3.4
        }
        handle @allowed {
            reverse_proxy backend:3000
        }
        handle {
            respond "Access Denied" 403
        }
    }

    # Other routes...
}
```

### Custom Error Pages

```caddy
{$DOMAIN:localhost} {
    handle_errors {
        rewrite * /{err.status_code}.html
        file_server {
            root /usr/share/caddy/errors
        }
    }

    # Your routes...
}
```

Create error pages:

```bash
sudo mkdir -p /opt/mymemorycard/errors
sudo nano /opt/mymemorycard/errors/404.html
```

Update docker-compose.caddy.yml:

```yaml
caddy:
  volumes:
    # ... existing volumes
    - ./errors:/usr/share/caddy/errors:ro
```

### Static Asset Caching

```caddy
{$DOMAIN:localhost} {
    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.woff *.woff2
    }

    handle @static {
        header Cache-Control "public, max-age=31536000, immutable"
        reverse_proxy frontend:5173
    }

    # Other routes...
}
```

### Basic Authentication

Protect specific routes:

```caddy
{$DOMAIN:localhost} {
    @protected {
        path /admin/*
    }

    handle @protected {
        basicauth {
            # user: admin, password: changeme
            # Generate with: caddy hash-password
            admin JDJhJDE0JEFCQzEyMy4uLg==
        }
        reverse_proxy backend:3000
    }

    # Other routes...
}
```

Generate password hash:

```bash
docker run --rm caddy:2-alpine caddy hash-password
```

### Multiple Domains

```caddy
# Main application
games.yourdomain.com {
    reverse_proxy /api/* backend:3000
    reverse_proxy frontend:5173
}

# API subdomain
api.yourdomain.com {
    reverse_proxy backend:3000
}

# Admin subdomain with auth
admin.yourdomain.com {
    basicauth {
        admin $2a$14$...
    }
    reverse_proxy backend:3000
}
```

## Monitoring

### Access Logs

View Caddy access logs:

```bash
sudo docker exec caddy tail -f /var/log/caddy/access.log
```

Logs are in JSON format for easy parsing:

```bash
sudo docker exec caddy cat /var/log/caddy/access.log | jq '.'
```

### Metrics

Caddy exposes Prometheus metrics on port 2019:

```bash
curl http://localhost:2019/metrics
```

### Container Stats

```bash
sudo docker stats
```

## Backup and Restore

### Automated Backups

Create backup script:

```bash
sudo nano /opt/mymemorycard/backup-caddy.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/mymemorycard/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec mymemorycard-db pg_dump -U mymemorycard mymemorycard | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup Caddy data (certificates, etc.)
docker run --rm -v mymemorycard_caddy_data:/data -v $BACKUP_DIR:/backup alpine \
    tar czf /backup/caddy_data_$TIMESTAMP.tar.gz -C /data .

# Backup configuration
cp /opt/mymemorycard/Caddyfile $BACKUP_DIR/Caddyfile_$TIMESTAMP
cp /opt/mymemorycard/.env $BACKUP_DIR/env_$TIMESTAMP

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "caddy_data_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

Make executable and schedule:

```bash
sudo chmod +x /opt/mymemorycard/backup-caddy.sh
sudo crontab -e
```

Add:

```
0 2 * * * /opt/mymemorycard/backup-caddy.sh >> /var/log/mymemorycard-backup.log 2>&1
```

### Restore

```bash
# Stop services
sudo docker-compose -f docker-compose.caddy.yml down

# Restore database
gunzip -c /opt/mymemorycard/backups/db_TIMESTAMP.sql.gz | \
  docker exec -i mymemorycard-db psql -U mymemorycard -d mymemorycard

# Restore Caddy data
docker run --rm -v mymemorycard_caddy_data:/data -v /opt/mymemorycard/backups:/backup alpine \
    tar xzf /backup/caddy_data_TIMESTAMP.tar.gz -C /data

# Start services
sudo docker-compose -f docker-compose.caddy.yml up -d
```

## Configuration Reload

Caddy supports zero-downtime configuration reloads:

```bash
# Edit Caddyfile
sudo nano /opt/mymemorycard/Caddyfile

# Reload configuration (no downtime)
sudo docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Or restart container:

```bash
sudo docker-compose -f docker-compose.caddy.yml restart caddy
```

## Firewall Configuration

Using UFW:

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp  # HTTP/3

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
sudo docker-compose -f docker-compose.caddy.yml down
sudo docker-compose -f docker-compose.caddy.yml build
sudo docker-compose -f docker-compose.caddy.yml up -d
```

### Update Caddy

```bash
# Pull latest image
sudo docker pull caddy:2-alpine

# Recreate container
sudo docker-compose -f docker-compose.caddy.yml up -d caddy
```

### View Certificate Info

```bash
# List certificates
sudo docker exec caddy caddy list-certificates

# Certificate details
sudo ls -la /var/lib/docker/volumes/mymemorycard_caddy_data/_data/caddy/certificates/
```

## Troubleshooting

### Certificate Issues

Check Caddy logs:

```bash
sudo docker logs caddy 2>&1 | grep -i acme
```

Verify domain points to server:

```bash
dig games.yourdomain.com
nslookup games.yourdomain.com
```

Test port 80 is accessible (required for ACME challenge):

```bash
curl -I http://games.yourdomain.com
```

### 502 Bad Gateway

Check backend is healthy:

```bash
sudo docker exec mymemorycard-backend curl http://localhost:3000/api/health
```

Check network connectivity:

```bash
sudo docker network inspect mymemorycard_caddy
```

Verify backend is on correct network:

```bash
sudo docker inspect mymemorycard-backend | grep -A 10 Networks
```

### Configuration Errors

Validate Caddyfile:

```bash
sudo docker run --rm -v /opt/mymemorycard/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```

Format Caddyfile:

```bash
sudo docker run --rm -v /opt/mymemorycard/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy fmt /etc/caddy/Caddyfile --overwrite
```

### HTTP/3 Not Working

Ensure UDP port 443 is open:

```bash
sudo ufw allow 443/udp
```

Check if HTTP/3 is enabled:

```bash
curl -I --http3 https://games.yourdomain.com
```

## Performance Optimization

### Enable HTTP/3 and QUIC

Already enabled by default in Caddy 2.

### Connection Pooling

Configure backend for better performance:

```yaml
backend:
  environment:
    # ... existing vars
    DB_POOL_MIN: 2
    DB_POOL_MAX: 20
```

### Compression Tuning

```caddy
{$DOMAIN:localhost} {
    # Customize compression
    encode {
        gzip 6
        zstd
        minimum_length 256
        match {
            header Content-Type text/*
            header Content-Type application/json*
            header Content-Type application/javascript*
            header Content-Type application/xml*
        }
    }

    # Your routes...
}
```

### Buffer Sizes

For large file uploads:

```caddy
{$DOMAIN:localhost} {
    request_body {
        max_size 50MB
    }

    # Your routes...
}
```

## Security Best Practices

1. **Automatic HTTPS**: Caddy handles this by default
2. **Strong passwords**: Use 32+ characters for database and JWT
3. **Regular updates**: Keep Caddy and applications updated
4. **Monitor logs**: Check access logs for suspicious activity
5. **Backup regularly**: Automated daily backups
6. **Limit SSH access**: Use SSH keys, disable password auth
7. **Security headers**: Already configured in Caddyfile above

## Why Choose Caddy?

### Advantages
- Simplest configuration of all reverse proxies
- Automatic HTTPS with zero configuration
- Built-in HTTP/3 support
- Zero-downtime reloads
- Better defaults out of the box
- Great documentation

### When to Use Alternatives
- **Nginx**: If you need maximum performance or very complex configurations
- **Traefik**: If you're using Docker labels for service discovery
- **HAProxy**: If you need advanced load balancing features

## Additional Resources

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Caddyfile Syntax](https://caddyserver.com/docs/caddyfile)
- [Caddy API](https://caddyserver.com/docs/api)
- [Caddy Community Forum](https://caddy.community/)
