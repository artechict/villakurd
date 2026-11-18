#!/usr/bin/env bash
# VillaKurd - CasaOS Auto Deploy Script
# Run: curl -fsSL https://raw.githubusercontent.com/artechict/villakurd/main/scripts/deploy-casaos.sh | bash
# Or: ./scripts/deploy-casaos.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Configuration
REPO_URL="https://github.com/artechict/villakurd.git"
INSTALL_DIR="/opt/villakurd"
COMPOSE_FILE="docker-compose.casaos.yml"
ENV_FILE=".env.prod"
ENV_EXAMPLE=".env.prod.example"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    log_warn "Running as root. This is fine for server setup."
fi

# Check Docker
check_docker() {
    log_info "Checking Docker..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Installing..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable --now docker
    fi
    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose not found. Installing..."
        curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    log_success "Docker & Compose ready"
}

# Check/Install git
check_git() {
    if ! command -v git &> /dev/null; then
        log_info "Installing git..."
        apt-get update && apt-get install -y git
    fi
}

# Generate secure random string
gen_secret() {
    openssl rand -hex 32
}

# Setup .env.prod
setup_env() {
    log_info "Setting up environment file..."
    cd "$INSTALL_DIR"

    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log_success "Created $ENV_FILE from example"
        else
            log_error "$ENV_EXAMPLE not found!"
            exit 1
        fi
    else
        log_info "$ENV_FILE already exists"
    fi

    # Auto-generate secrets if not set
    local secrets=(
        "DB_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "SESSION_SECRET"
        "ENCRYPTION_KEY"
        "MINIO_ROOT_PASSWORD"
        "GRAFANA_ADMIN_PASSWORD"
    )

    for secret in "${secrets[@]}"; do
        if grep -q "^${secret}=$" "$ENV_FILE" || grep -q "^${secret}=your_" "$ENV_FILE" || grep -q "^${secret}=CHANGE_ME" "$ENV_FILE"; then
            local new_value=$(gen_secret)
            sed -i "s|^${secret}=.*|${secret}=${new_value}|" "$ENV_FILE"
            log_info "Generated ${secret}"
        fi
    done

    log_warn "IMPORTANT: Edit $INSTALL_DIR/$ENV_FILE and add your real values for:"
    echo "  - Payment gateways (ASIAHAWALA_*, QICARD_*, ZAINCASH_*)"
    echo "  - SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS)"
    echo "  - Domain-specific settings"
    echo ""
    read -p "Press Enter after editing .env.prod, or Ctrl+C to edit now..." -r
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    cd "$INSTALL_DIR"
    docker compose -f "$COMPOSE_FILE" pull
    log_success "Images pulled"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    cd "$INSTALL_DIR"
    docker compose -f "$COMPOSE_FILE" --profile migrate up migrate
    log_success "Migrations completed"
}

# Start services
start_services() {
    log_info "Starting services..."
    cd "$INSTALL_DIR"
    docker compose -f "$COMPOSE_FILE" up -d
    log_success "Services started"
}

# Wait for health checks
wait_health() {
    log_info "Waiting for services to be healthy..."
    local services=("postgres" "redis" "elasticsearch" "minio" "backend" "frontend" "nginx")
    local timeout=300
    local start_time=$(date +%s)

    for service in "${services[@]}"; do
        log_info "Checking $service..."
        while true; do
            local health=$(docker inspect --format='{{.State.Health.Status}}' "villakurd-${service}" 2>/dev/null || echo "none")
            if [[ "$health" == "healthy" ]]; then
                log_success "$service is healthy"
                break
            elif [[ "$health" == "unhealthy" ]]; then
                log_error "$service is unhealthy"
                docker logs "villakurd-${service}" --tail 50
                exit 1
            fi

            if (( $(date +%s) - start_time > timeout )); then
                log_error "Timeout waiting for $service"
                exit 1
            fi
            sleep 5
        done
    done
    log_success "All services healthy"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    log_info "Setting up SSL certificates..."

    read -p "Enter your domain (e.g., villakurd.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        log_warn "No domain provided. Skipping SSL setup."
        return
    fi

    # Install certbot if needed
    if ! command -v certbot &> /dev/null; then
        log_info "Installing certbot..."
        apt-get update && apt-get install -y certbot
    fi

    # Stop nginx temporarily to free port 80
    cd "$INSTALL_DIR"
    docker compose -f "$COMPOSE_FILE" stop nginx

    # Get certificates
    certbot certonly --standalone -d "$DOMAIN" -d "api.$DOMAIN" -d "app.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || {
        log_error "Certbot failed. Restarting nginx..."
        docker compose -f "$COMPOSE_FILE" start nginx
        return 1
    }

    # Copy certificates to nginx ssl directory
    mkdir -p infrastructure/docker/nginx/ssl
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" infrastructure/docker/nginx/ssl/villakurd.com.crt
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" infrastructure/docker/nginx/ssl/villakurd.com.key

    # Restart nginx
    docker compose -f "$COMPOSE_FILE" start nginx

    # Setup auto-renewal
    (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --deploy-hook 'cd $INSTALL_DIR && docker compose -f $COMPOSE_FILE restart nginx'") | crontab -

    log_success "SSL certificates installed for $DOMAIN"
}

# Show status
show_status() {
    log_info "VillaKurd Status:"
    cd "$INSTALL_DIR"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log_info "Access URLs:"
    echo "  Frontend:  https://villakurd.com (or your domain)"
    echo "  API:       https://api.villakurd.com"
    echo "  MinIO:     http://localhost:9001"
    echo "  Grafana:   http://localhost:3001 (if monitoring enabled)"
    echo "  Prometheus: http://localhost:9090 (if monitoring enabled)"
}

# Main
main() {
    echo "=========================================="
    echo "  VillaKurd - CasaOS Auto Deploy"
    echo "=========================================="
    echo ""

    # Step 1: Check prerequisites
    check_docker
    check_git

    # Step 2: Clone or update repo
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log_info "Updating existing repository..."
        cd "$INSTALL_DIR"
        git fetch --all
        git reset --hard origin/main
        git pull origin main
    else
        log_info "Cloning repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi

    # Step 3: Setup environment
    setup_env

    # Step 4: Pull images
    pull_images

    # Step 5: Run migrations
    run_migrations

    # Step 6: Start services
    start_services

    # Step 7: Wait for health
    wait_health

    # Step 8: SSL (optional)
    read -p "Setup SSL with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi

    # Step 9: Show status
    show_status

    echo ""
    log_success "VillaKurd deployed successfully! 🎉"
    echo ""
    log_info "Next steps:"
    echo "  1. Edit $INSTALL_DIR/$ENV_FILE with payment gateway keys"
    echo "  2. Restart backend: docker compose -f $COMPOSE_FILE restart backend"
    echo "  3. Check logs: docker compose -f $COMPOSE_FILE logs -f backend"
    echo "  4. Auto-deploy on push: GitHub Actions will handle it"
}

# Run
main "$@"