# VillaKurd - Deployment Guide

> **Complete guide for deploying VillaKurd to production servers**

---

## 📋 Prerequisites

### Server Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 4 vCPUs | 8+ vCPUs |
| **RAM** | 8 GB | 16+ GB |
| **Storage** | 100 GB SSD | 200+ GB NVMe SSD |
| **Network** | 1 Gbps | 1+ Gbps |

### Required Services (External)
- **Domain Name** with DNS control (A record pointing to server IP)
- **SSL Certificates** (Let's Encrypt or paid)
- **Payment Gateway Accounts**: AsiaHawala, Qi Card, ZainCash
- **Email Service**: SendGrid, Mailgun, or SMTP server
- **SMS Provider**: Local Iraq provider (AsiaCell, Korek, etc.)
- **Mapbox Account**: For maps (free tier available)
- **Sentry Account**: Error tracking (free tier available)
- **GitHub Account**: For CI/CD and container registry

---

## 🚀 Quick Deployment (Automated)

### 1. Server Setup (Run once)
```bash
# As root on your server
curl -sSL https://raw.githubusercontent.com/your-org/villakurd/main/scripts/server-setup.sh | bash

# Or manually:
# chmod +x scripts/server-setup.sh && sudo ./scripts/server-setup.sh
```

This installs:
- Docker & Docker Compose
- UFW Firewall
- Fail2Ban
- Certbot (Let's Encrypt)
- System optimizations
- Creates `villakurd` user

### 2. Clone Repository
```bash
# Switch to app user
su - villakurd

# Clone
cd /opt/villakurd
git clone https://github.com/your-org/villakurd.git
cd villakurd
```

### 3. Configure Environment
```bash
# Copy production template
cp .env.example .env.prod

# Edit with your values (REQUIRED)
nano .env.prod
```

**Critical variables to set:**
```bash
# Domain
DOMAIN_NAME=villakurd.com

# Database (generate secure passwords!)
DB_PASSWORD=your_secure_db_password
ELASTIC_PASSWORD=your_elastic_password

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_64_chars_min
JWT_REFRESH_SECRET=your_refresh_secret_64_chars_min
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_min

# Payment Gateways (from your providers)
ASIA_HAWALA_MERCHANT_ID=xxx
ASIA_HAWALA_TERMINAL_ID=xxx
ASIA_HAWALA_PASSWORD=xxx
QI_CARD_MERCHANT_ID=xxx
QI_CARD_TERMINAL_ID=xxx
QI_CARD_PASSWORD=xxx
ZAIN_CASH_MERCHANT_ID=xxx
ZAIN_CASH_PASSWORD=xxx

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM="VillaKurd <noreply@villakurd.com>"

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
GRAFANA_PASSWORD=your_grafana_password

# Mapbox
MAPBOX_TOKEN=your_mapbox_token
```

### 4. SSL Certificates
```bash
# Get Let's Encrypt certificates
sudo certbot certonly --standalone \
  -d villakurd.com -d www.villakurd.com \
  --email admin@villakurd.com \
  --agree-tos --non-interactive

# Certificates will be in /etc/letsencrypt/live/villakurd.com/
# Nginx config expects them there
```

### 5. Deploy
```bash
# First deployment
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Run migrations
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec backend pnpm prisma migrate deploy

# Seed initial data (optional)
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec backend pnpm prisma db seed
```

### 6. Verify
```bash
# Check all services
docker-compose -f infrastructure/docker/docker-compose.prod.yml ps

# Health checks
curl https://villakurd.com/health
curl https://villakurd.com/api/v1/villas/search

# Logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f backend
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f frontend
```

---

## 🔄 Ongoing Deployments

### Automated (GitHub Actions)
Push to `main` branch → Auto-deploys to production
Push to `develop` branch → Auto-deploys to staging

### Manual Deployment
```bash
# On server
cd /opt/villakurd/villakurd
./scripts/deploy.sh production v1.2.3

# Or with latest
./scripts/deploy.sh production latest
```

### Rollback
```bash
# Automatic rollback on failure
# Or manual:
./scripts/deploy.sh production previous_version
```

---

## 🏗️ Infrastructure Details

### Docker Services (Production)
| Service | Port (Internal) | Purpose |
|---------|----------------|---------|
| **nginx** | 80, 443 | Reverse proxy, SSL termination, rate limiting |
| **backend** | 4000 | Fastify API |
| **frontend** | 3000 | Next.js App |
| **postgres** | 5432 | Primary database |
| **redis** | 6379 | Cache, sessions, queues |
| **elasticsearch** | 9200 | Search, analytics |
| **minio** | 9000/9001 | Object storage |
| **prometheus** | 9090 | Metrics collection |
| **grafana** | 3001 | Dashboards |
| **loki** | 3100 | Log aggregation |

### Network Architecture
```
Internet → Nginx (80/443) → [Backend API, Frontend]
                    ↓
            Internal Network (Docker)
                    ↓
        [PostgreSQL, Redis, Elasticsearch, MinIO]
```

### Data Persistence
All data stored in Docker volumes:
- `postgres_data` - Database
- `redis_data` - Cache/Queues
- `es_data` - Search indices
- `minio_data` - Uploaded files
- `prometheus_data` - Metrics
- `grafana_data` - Dashboards
- `loki_data` - Logs

---

## 🔐 Security Checklist

### Server Hardening
- [ ] UFW firewall configured (only 22, 80, 443 open)
- [ ] Fail2Ban active (SSH, Nginx)
- [ ] SSH key-only authentication (disable password)
- [ ] Non-root user for app (`villakurd`)
- [ ] Docker containers run as non-root
- [ ] Automatic security updates enabled

### Application Security
- [ ] Strong JWT secrets (64+ chars)
- [ ] Database passwords rotated
- [ ] Payment gateway credentials secured
- [ ] CORS restricted to your domain
- [ ] Rate limiting enabled
- [ ] Security headers via Nginx
- [ ] TLS 1.2+ only
- [ ] HSTS enabled

### Monitoring & Alerting
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards configured
- [ ] Loki collecting logs
- [ ] Sentry error tracking
- [ ] Uptime monitoring (UptimeRobot/Pingdom)
- [ ] SSL certificate expiry alerts

---

## 📊 Monitoring Access

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | https://villakurd.com/grafana | admin / ${GRAFANA_PASSWORD} |
| **Prometheus** | https://villakurd.com/prometheus | Internal only |
| **MinIO Console** | https://minio.villakurd.com | ${MINIO_ACCESS_KEY} / ${MINIO_SECRET_KEY} |
| **Elasticsearch** | Internal only | elastic / ${ELASTIC_PASSWORD} |
| **Sentry** | sentry.io | Your Sentry account |

---

## 🗄️ Backup Strategy

### Automated Backups (via deploy script)
- **Database**: Daily pg_dump compressed (kept 7 days)
- **Volumes**: Manual snapshots recommended
- **Config**: Git repository

### Manual Backup
```bash
# Database
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec -T postgres pg_dump -U villakurd villakurd | gzip > backup_$(date +%Y%m%d).sql.gz

# Full volume backup (stop services first)
docker-compose -f infrastructure/docker/docker-compose.prod.yml down
tar -czf villakurd_volumes_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/villakurd_*
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Restore
```bash
# Database
gunzip -c backup_20260115.sql.gz | docker-compose -f infrastructure/docker/docker-compose.prod.yml exec -T postgres psql -U villakurd villakurd
```

---

## 🔧 Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f [service_name]

# Check resources
docker stats

# Restart specific service
docker-compose -f infrastructure/docker/docker-compose.prod.yml restart backend
```

#### Database connection failed
```bash
# Check PostgreSQL logs
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs postgres

# Verify connection
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec postgres pg_isready -U villakurd
```

#### SSL certificate issues
```bash
# Renew certificates
sudo certbot renew --dry-run
sudo certbot renew

# Reload Nginx
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec nginx nginx -s reload
```

#### High memory usage
```bash
# Check container limits
docker stats --no-stream

# Adjust in docker-compose.prod.yml deploy.resources.limits.memory
```

#### Payment webhook failures
```bash
# Check backend logs for webhook errors
docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f backend | grep -i webhook

# Verify callback URLs in payment gateway dashboards match:
# https://villakurd.com/api/v1/payments/webhooks/asia-hawala
# https://villakurd.com/api/v1/payments/webhooks/qi-card
# https://villakurd.com/api/v1/payments/webhooks/zain-cash
```

---

## 📈 Scaling Guide

### Vertical Scaling (Increase Resources)
```yaml
# In docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G    # Increase
      cpus: '2.0'   # Increase
```

### Horizontal Scaling (Multiple Replicas)
```yaml
# For backend/frontend (stateless)
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
  restart_policy:
    condition: on-failure
```

### Database Scaling
- **Read Replicas**: Add PostgreSQL replicas for read-heavy queries
- **Connection Pooling**: Use PgBouncer (already configured in Prisma)
- **Partitioning**: Monthly partitions for `bookings` table (see schema)

### Cache Scaling
- **Redis Cluster**: For high availability
- **Redis Sentinel**: For automatic failover

### Search Scaling
- **Elasticsearch Cluster**: Multi-node for HA and performance
- **Index Sharding**: 3+ shards for `villas` index

---

## 🌍 Multi-Region (Future)

For expansion beyond Kurdistan:
1. **CDN**: Cloudflare for static assets
2. **Database**: Primary in Iraq, read replicas in region
3. **API**: Deploy backend to multiple regions
4. **DNS**: Geo-routing via Cloudflare/AWS Route53

---

## 📞 Support Contacts

| Issue | Contact |
|-------|---------|
| **Server/Infrastructure** | DevOps Team |
| **Application Bugs** | Backend/Frontend Team |
| **Payment Issues** | Payment Integration Team |
| **Security Incidents** | Security Team (security@villakurd.com) |
| **Domain/SSL** | Infrastructure Team |

---

## 📝 Maintenance Windows

| Task | Frequency | Window |
|------|-----------|--------|
| **Security Updates** | Weekly | Sunday 03:00-05:00 AST |
| **Database Maintenance** | Monthly | 1st Sunday 02:00-04:00 AST |
| **Certificate Renewal** | Auto (60 days) | N/A |
| **Log Rotation** | Daily | 00:00 AST |
| **Backup Verification** | Weekly | Saturday 01:00 AST |

---

## 🚀 Next Steps After Deployment

1. **Test critical flows**: Search → Villa Detail → Booking → Payment → Confirmation
2. **Configure payment gateways**: Test with sandbox, then production
3. **Set up monitoring alerts**: CPU > 80%, Memory > 85%, Disk > 90%, Error rate > 1%
4. **Create admin user**: `docker-compose exec backend pnpm prisma db seed` or manual
5. **Onboard first hosts**: Use your local network
6. **Launch marketing**: Soft launch → gather feedback → iterate

---

**Document Version**: 1.0  
**Last Updated**: 2026-11-18  
**Maintained by**: VillaKurd DevOps Team