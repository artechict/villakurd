#!/bin/bash
# VillaKurd - Server Setup Script for Ubuntu 22.04/24.04
# Run as root: curl -sSL https://raw.githubusercontent.com/your-org/villakurd/main/scripts/server-setup.sh | bash
# OR: chmod +x server-setup.sh && sudo ./server-setup.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="${DOMAIN_NAME:-villakurd.com}"
EMAIL="${EMAIL:-admin@villakurd.com}"
SWAP_SIZE="${SWAP_SIZE:-4G}"
TIMEZONE="Asia/Baghdad"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

update_system() {
    log_info "Updating system packages..."
    apt-get update && apt-get upgrade -y
    log_success "System updated"
}

install_docker() {
    log_info "Installing Docker..."
    if ! command -v docker &> /dev/null; then
        # Install dependencies
        apt-get install -y ca-certificates curl gnupg lsb-release

        # Add Docker's official GPG key
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg

        # Add repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
            $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
            tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        # Enable and start Docker
        systemctl enable docker
        systemctl start docker

        log_success "Docker installed"
    else
        log_info "Docker already installed"
    fi
}

install_docker_compose() {
    log_info "Installing Docker Compose (standalone)..."
    if ! command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
        curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose installed"
    else
        log_info "Docker Compose already installed"
    fi
}

configure_swap() {
    log_info "Configuring swap (${SWAP_SIZE})..."
    if [ ! -f /swapfile ]; then
        fallocate -l ${SWAP_SIZE} /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        log_success "Swap configured"
    else
        log_info "Swap already exists"
    fi
}

configure_firewall() {
    log_info "Configuring UFW firewall..."
    apt-get install -y ufw

    # Default policies
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH (be careful!)
    ufw allow 22/tcp comment 'SSH'

    # Allow HTTP/HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'

    # Allow Docker internal network (adjust as needed)
    # ufw allow from 172.17.0.0/16

    # Enable firewall
    ufw --force enable
    log_success "Firewall configured"
}

configure_timezone() {
    log_info "Setting timezone to ${TIMEZONE}..."
    timedatectl set-timezone ${TIMEZONE}
    log_success "Timezone set"
}

install_monitoring_tools() {
    log_info "Installing monitoring tools..."
    apt-get install -y htop iotop nethogs ncdu jq curl wget git unzip
    log_success "Monitoring tools installed"
}

configure_limits() {
    log_info "Configuring system limits..."
    cat >> /etc/security/limits.conf << 'EOF'
# VillaKurd limits
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

    cat >> /etc/sysctl.conf << 'EOF'
# VillaKurd kernel tuning
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
fs.file-max = 2097152
EOF

    sysctl -p
    log_success "System limits configured"
}

setup_logrotate() {
    log_info "Configuring logrotate for Docker..."
    cat > /etc/logrotate.d/docker-containers << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
    maxsize 100M
    notifempty
}
EOF
    log_success "Logrotate configured"
}

create_app_user() {
    log_info "Creating application user..."
    if ! id "villakurd" &>/dev/null; then
        useradd -r -m -s /bin/bash -d /home/villakurd villakurd
        usermod -aG docker villakurd
        log_success "User 'villakurd' created and added to docker group"
    else
        log_info "User 'villakurd' already exists"
    fi
}

create_directories() {
    log_info "Creating application directories..."
    mkdir -p /opt/villakurd/{data,backups,logs,ssl}
    chown -R villakurd:villakurd /opt/villakurd
    chmod 750 /opt/villakurd
    log_success "Directories created"
}

install_certbot() {
    log_info "Installing Certbot for Let's Encrypt..."
    apt-get install -y certbot
    log_success "Certbot installed"
}

optimize_kernel() {
    log_info "Optimizing kernel parameters..."
    cat > /etc/sysctl.d/99-villakurd.conf << 'EOF'
# Network optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# File system
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512
EOF
    sysctl --system
    log_success "Kernel optimized"
}

setup_fail2ban() {
    log_info "Installing and configuring Fail2Ban..."
    apt-get install -y fail2ban

    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

    systemctl enable fail2ban
    systemctl start fail2ban
    log_success "Fail2Ban configured"
}

print_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Server Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Clone the repository:"
    echo "   cd /opt/villakurd && git clone https://github.com/your-org/villakurd.git"
    echo ""
    echo "2. Configure environment:"
    echo "   cd /opt/villakurd/villakurd && cp .env.example .env.prod"
    echo "   # Edit .env.prod with your production values"
    echo ""
    echo "3. Setup SSL certificates:"
    echo "   certbot certonly --standalone -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} --email ${EMAIL} --agree-tos --non-interactive"
    echo ""
    echo "4. Deploy application:"
    echo "   cd /opt/villakurd/villakurd && docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d"
    echo ""
    echo "5. Run database migrations:"
    echo "   docker-compose -f infrastructure/docker/docker-compose.prod.yml exec backend pnpm prisma migrate deploy"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "- Logout and login again for docker group changes to take effect"
    echo "- Ensure your domain DNS points to this server's IP"
    echo "- Configure your payment gateway callbacks to use https://${DOMAIN_NAME}/api/v1/payments/webhooks/"
    echo ""
}

main() {
    log_info "Starting VillaKurd server setup..."
    check_root
    update_system
    install_docker
    install_docker_compose
    configure_swap
    configure_firewall
    configure_timezone
    install_monitoring_tools
    configure_limits
    setup_logrotate
    create_app_user
    create_directories
    install_certbot
    optimize_kernel
    setup_fail2ban
    print_summary
}

main "$@"