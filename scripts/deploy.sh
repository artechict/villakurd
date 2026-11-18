#!/bin/bash
# VillaKurd - Production Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]
# Example: ./scripts/deploy.sh production v1.2.3

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
ENVIRONMENT="${1:-production}"
VERSION="${2:-latest}"
PROJECT_DIR="/opt/villakurd/villakurd"
COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="/opt/villakurd/backups"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_requirements() {
    log_info "Checking requirements..."
    command -v docker >/dev/null 2>&1 || { log_error "Docker not installed"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose not installed"; exit 1; }
    [[ -f "$ENV_FILE" ]] || { log_error "Environment file $ENV_FILE not found"; exit 1; }
    log_success "Requirements check passed"
}

backup_database() {
    log_info "Creating database backup..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/villakurd_db_${timestamp}.sql.gz"

    mkdir -p "$BACKUP_DIR"

    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U villakurd villakurd | gzip > "$backup_file"

    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        log_success "Database backup created: $backup_file"
        echo "$backup_file" > "${BACKUP_DIR}/latest_backup.txt"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

pull_images() {
    log_info "Pulling Docker images for version: $VERSION..."

    # Update image tags in docker-compose if version specified
    if [[ "$VERSION" != "latest" ]]; then
        export BACKEND_IMAGE="ghcr.io/your-org/villakurd/backend:${VERSION}"
        export FRONTEND_IMAGE="ghcr.io/your-org/villakurd/frontend:${VERSION}"
    fi

    docker-compose -f "$COMPOSE_FILE" pull
    log_success "Images pulled"
}

run_migrations() {
    log_info "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" exec -T backend pnpm prisma migrate deploy
    log_success "Migrations completed"
}

deploy_services() {
    log_info "Deploying services..."

    # Stop gracefully
    docker-compose -f "$COMPOSE_FILE" down --timeout 30

    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans

    log_success "Services deployed"
}

health_check() {
    log_info "Performing health checks..."
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "http://localhost/health" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    log_error "Health check failed after $max_attempts attempts"
    return 1
}

rollback() {
    log_warning "Rolling back to previous version..."
    local latest_backup=$(cat "${BACKUP_DIR}/latest_backup.txt" 2>/dev/null || echo "")

    if [[ -n "$latest_backup" && -f "$latest_backup" ]]; log_info "Restoring database from $latest_backup"
        gunzip -c "$latest_backup" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U villakurd villakurd
    fi

    docker-compose -f "$COMPOSE_FILE" down
    docker-compose -f "$COMPOSE_FILE" up -d
    log_success "Rollback completed"
}

cleanup_old() {
    log_info "Cleaning up old images and backups..."
    docker image prune -f --filter "until=72h"
    find "$BACKUP_DIR" -name "villakurd_db_*.sql.gz" -mtime +7 -delete
    log_success "Cleanup completed"
}

send_notification() {
    local status=$1
    local message=$2

    # Send to Slack/Discord/Telegram if webhook configured
    if [[ -n "${DEPLOY_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$DEPLOY_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"VillaKurd Deploy: $status - $message\"}" > /dev/null 2>&1 || true
    fi
}

main() {
    log_info "Starting VillaKurd deployment to $ENVIRONMENT (version: $VERSION)"

    cd "$PROJECT_DIR" || { log_error "Project directory not found"; exit 1; }

    check_requirements

    # Trap errors for rollback
    trap 'log_error "Deployment failed! Rolling back..."; rollback; send_notification "FAILED" "Deployment failed, rolled back"; exit 1' ERR

    backup_database
    pull_images
    run_migrations
    deploy_services
    health_check
    cleanup_old

    send_notification "SUCCESS" "Version $VERSION deployed to $ENVIRONMENT"
    log_success "Deployment completed successfully!"
}

main "$@"