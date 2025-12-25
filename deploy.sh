#!/bin/bash

##############################################################################
# PyATS Web App - Native Ubuntu Deployment Script
# Supports: Ubuntu 20.04, 22.04, 24.04
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="pyats-webapp"
INSTALL_DIR="/opt/${APP_NAME}"
APP_USER="pyats"
BACKEND_PORT=8000
FRONTEND_PORT=80

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  PyATS Web App - Deployment Script${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}" 
   exit 1
fi

# Detect Ubuntu version
echo -e "${YELLOW}[1/12] Checking Ubuntu version...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
    echo "Detected: $OS $VER"
else
    echo -e "${RED}Cannot detect OS version${NC}"
    exit 1
fi

# Check prerequisites
echo -e "${YELLOW}[2/12] Checking prerequisites...${NC}"
command -v apt >/dev/null 2>&1 || { echo -e "${RED}apt not found${NC}"; exit 1; }

# Update system
echo -e "${YELLOW}[3/12] Updating system packages...${NC}"
apt update -qq

# Install system dependencies
echo -e "${YELLOW}[4/12] Installing system dependencies...${NC}"
apt install -y python3 python3-pip python3-venv nginx sqlite3 curl git build-essential libssl-dev \
    openssh-client sshpass telnet iputils-ping net-tools

# Install Node.js 18 (if not present)
echo -e "${YELLOW}[5/12] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Create application user
echo -e "${YELLOW}[6/12] Creating application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -m -s /bin/bash "$APP_USER"
    echo "User $APP_USER created"
else
    echo "User $APP_USER already exists"
fi

# Copy application files
echo -e "${YELLOW}[7/12] Installing application files...${NC}"
mkdir -p "$INSTALL_DIR"
cp -r backend frontend config scripts "$INSTALL_DIR/"
chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"

# Setup Python backend
echo -e "${YELLOW}[8/12] Setting up Python backend...${NC}"
cd "$INSTALL_DIR/backend"
sudo -u "$APP_USER" python3 -m venv venv
sudo -u "$APP_USER" bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"

# Initialize database
echo -e "${YELLOW}[9/12] Initializing database...${NC}"
mkdir -p "$INSTALL_DIR/data"
chown "$APP_USER:$APP_USER" "$INSTALL_DIR/data"
sudo -u "$APP_USER" bash -c "source $INSTALL_DIR/backend/venv/bin/activate && cd $INSTALL_DIR/backend && python3 -m app.core.init_db"

# Build frontend
echo -e "${YELLOW}[10/12] Building frontend...${NC}"
cd "$INSTALL_DIR/frontend"
sudo -u "$APP_USER" npm install
sudo -u "$APP_USER" npm run build

# Setup systemd service
echo -e "${YELLOW}[11/12] Configuring systemd service...${NC}"
cat > /etc/systemd/system/${APP_NAME}.service <<EOF
[Unit]
Description=PyATS Web Application
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$INSTALL_DIR/backend
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$INSTALL_DIR/backend/venv/bin"
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${APP_NAME}.service
systemctl start ${APP_NAME}.service

# Configure Nginx
echo -e "${YELLOW}[12/12] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root $INSTALL_DIR/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Application installed at: ${GREEN}$INSTALL_DIR${NC}"
echo -e "Database location: ${GREEN}$INSTALL_DIR/data/pyats.db${NC}"
echo ""
echo -e "Access the application at:"
echo -e "  ${GREEN}http://$SERVER_IP${NC}"
echo -e "  ${GREEN}http://localhost${NC} (if local)"
echo ""
echo -e "Service management:"
echo -e "  Status:  ${YELLOW}systemctl status $APP_NAME${NC}"
echo -e "  Restart: ${YELLOW}systemctl restart $APP_NAME${NC}"
echo -e "  Logs:    ${YELLOW}journalctl -u $APP_NAME -f${NC}"
echo ""
echo -e "Default credentials:"
echo -e "  Username: ${GREEN}admin${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"
echo -e "  ${RED}Change password after first login!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Access the web interface"
echo -e "2. Upload or generate a testbed file"
echo -e "3. Test device connectivity"
echo ""
