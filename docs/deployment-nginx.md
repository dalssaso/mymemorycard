# Deployment with Nginx

> **Quick Start:** For the simplest deployment experience, use the pre-configured Docker Compose files
> in the [`/deploy`](../deploy/) directory. Run `cd deploy && docker compose up -d` after configuring
> your `.env` file. This guide covers manual server setup if you prefer to run Nginx directly on the host.

This guide covers deploying MyMemoryCard with Nginx as a reverse proxy, including SSL/TLS configuration with Let's Encrypt.

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

## Architecture

```
Internet → Nginx (Port 80/443) → Frontend (Port 5173) → Backend API (Port 3000) → PostgreSQL + Redis
```

## Quick Deployment

### 1. Server Setup

Update system packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install required packages:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
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

Update the following variables:

```bash
# Use strong passwords in production!
POSTGRES_PASSWORD=your-very-secure-database-password
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
RAWG_API_KEY=your-rawg-api-key

# Domain configuration
DOMAIN=games.yourdomain.com
```

### 3. Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/mymemorycard
```

Add the following configuration:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name games.yourdomain.com;

    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name games.yourdomain.com;

    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/games.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/games.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/mymemorycard-access.log;
    error_log /var/log/nginx/mymemorycard-error.log;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5173;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mymemorycard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Obtain SSL Certificate

Get Let's Encrypt certificate:

```bash
sudo certbot --nginx -d games.yourdomain.com
```

Follow the prompts to:
- Enter your email address
- Agree to Terms of Service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

### 5. Start Application

Start all services:

```bash
sudo docker-compose up -d
```

Check logs:

```bash
sudo docker-compose logs -f
```

### 6. Verify Deployment

Test the deployment:

```bash
# Check backend health
curl https://games.yourdomain.com/api/health

# Should return: {"status":"ok"}
```

Visit `https://games.yourdomain.com` in your browser.

## Production Docker Compose

Use the pre-configured production docker-compose file from the `deploy/` directory:

```bash
cd deploy
cp .env.example .env
# Edit .env with your configuration

docker compose up -d
```

The `deploy/docker-compose.yml` file uses pre-built images from GitHub Container Registry with pinned versions. See [`deploy/README.md`](../deploy/README.md) for full configuration options.

Key features of the production configuration:
- Pre-built multi-platform images (amd64/arm64)
- Health checks for all services
- Network isolation (internal network for databases)
- Nginx reverse proxy with SSL support

## Firewall Configuration

Configure UFW firewall:

```bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Monitoring and Logs

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/mymemorycard-access.log

# Error logs
sudo tail -f /var/log/nginx/mymemorycard-error.log
```

### Application Logs

```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
```

### Resource Usage

```bash
# Container stats
sudo docker stats

# Disk usage
sudo docker system df
```

## Backup Strategy

### Database Backups

Create automated backup script:

```bash
sudo nano /opt/mymemorycard/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/mymemorycard/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="mymemorycard-db"

mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME pg_dump -U mymemorycard mymemorycard | gzip > $BACKUP_DIR/mymemorycard_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "mymemorycard_*.sql.gz" -mtime +30 -delete

echo "Backup completed: mymemorycard_$TIMESTAMP.sql.gz"
```

Make executable and schedule:

```bash
sudo chmod +x /opt/mymemorycard/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
```

Add line:

```
0 2 * * * /opt/mymemorycard/backup.sh >> /var/log/mymemorycard-backup.log 2>&1
```

### Restore from Backup

```bash
# Stop application
cd /opt/mymemorycard
sudo docker-compose down

# Restore database
gunzip -c /opt/mymemorycard/backups/mymemorycard_TIMESTAMP.sql.gz | \
  docker exec -i mymemorycard-db psql -U mymemorycard -d mymemorycard

# Start application
sudo docker-compose up -d
```

## Maintenance

### Update Application

```bash
cd /opt/mymemorycard

# Pull latest changes
sudo git pull

# Rebuild and restart
sudo docker-compose down
sudo docker-compose build
sudo docker-compose up -d

# Check logs
sudo docker-compose logs -f
```

### Renew SSL Certificate

Certificates auto-renew via certbot systemd timer. To manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Clean Up Docker

```bash
# Remove unused images
sudo docker image prune -a

# Remove unused volumes
sudo docker volume prune

# Remove unused networks
sudo docker network prune
```

## Performance Tuning

### Nginx Configuration

Add to `/etc/nginx/nginx.conf` in `http` block:

```nginx
http {
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Connection limits
    client_max_body_size 10M;
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Apply rate limiting in server block:

```nginx
location /api {
    limit_req zone=api burst=20 nodelay;
    # ... rest of proxy config
}
```

### PostgreSQL Tuning

Edit PostgreSQL config in docker-compose.yml:

```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

## Troubleshooting

### Nginx Issues

**502 Bad Gateway**

Check backend is running:

```bash
sudo docker-compose ps
curl http://localhost:3000/api/health
```

Check Nginx error logs:

```bash
sudo tail -f /var/log/nginx/mymemorycard-error.log
```

**Certificate Issues**

Verify certificate:

```bash
sudo certbot certificates
```

Test SSL:

```bash
openssl s_client -connect games.yourdomain.com:443
```

### Application Issues

**Database Connection Failed**

Check PostgreSQL is running:

```bash
sudo docker-compose ps postgres
sudo docker-compose logs postgres
```

**High Memory Usage**

Check container stats:

```bash
sudo docker stats
```

Restart if needed:

```bash
sudo docker-compose restart backend
```

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Strong Passwords**
   - Database password: 32+ characters
   - JWT secret: 64+ characters

3. **Regular Backups**
   - Enable automated backups
   - Test restore process quarterly

4. **Monitor Logs**
   - Check logs regularly for suspicious activity
   - Set up log rotation

5. **Limit SSH Access**
   - Use SSH keys instead of passwords
   - Change default SSH port
   - Use fail2ban for brute-force protection

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
