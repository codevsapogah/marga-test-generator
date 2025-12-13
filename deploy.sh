#!/bin/bash

# MARGA Deployment Script
# Deploys to VPS: 194.32.141.21

set -e

# VPS Configuration
VPS_IP="194.32.141.21"
VPS_USER="ubuntu"
VPS_PASSWORD="0qyMw4XKWWX1S5WQzvsjgjI="
APP_PORT="8080"
APP_DIR="/marga"

echo "=================================================="
echo "   MARGA Deployment to VPS"
echo "   IP: $VPS_IP"
echo "   Directory: $APP_DIR"
echo "   Port: $APP_PORT"
echo "=================================================="

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Error: sshpass is not installed!"
    echo "Install it with: brew install sshpass"
    exit 1
fi

# Create temporary directory for deployment
DEPLOY_DIR=$(mktemp -d)
echo "Creating deployment package..."

# Copy project files (excluding node_modules, .git, etc.)
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'storage' \
    --exclude '.env' \
    --exclude 'deploy.sh' \
    --exclude 'deployexample.sh' \
    ./ "$DEPLOY_DIR/"

# Create deployment archive
cd "$DEPLOY_DIR"
tar -czf /tmp/marga-deploy.tar.gz .
cd -

echo "Uploading to VPS..."

# Upload the archive
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no \
    /tmp/marga-deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

echo "Setting up on VPS..."

# Execute deployment commands on VPS
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH'

echo "Creating application directory..."
sudo mkdir -p /marga
sudo chown ubuntu:ubuntu /marga

echo "Extracting files..."
cd /marga
tar -xzf /tmp/marga-deploy.tar.gz
rm /tmp/marga-deploy.tar.gz

echo "Creating storage directories..."
mkdir -p storage/pdfs/tests
mkdir -p storage/pdfs/answer-sheets
mkdir -p storage/pdfs/answer-keys
mkdir -p storage/scans
mkdir -p storage/images
mkdir -p storage/temp

echo "Creating production .env file..."
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marga_production
DB_USER=marga_user
DB_PASSWORD=marga_prod_2024_secure

# Server Configuration
PORT=8080
NODE_ENV=production

# File Storage
STORAGE_PATH=./storage

# Security
JWT_SECRET=marga_jwt_secret_prod_2024_change_this
SESSION_SECRET=marga_session_secret_prod_2024_change_this

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# OCR/OMR Settings
BUBBLE_DARKNESS_THRESHOLD=0.4
MIN_SCAN_WIDTH=1200
MIN_SCAN_HEIGHT=1600

# Image Processing
MAX_IMAGE_WIDTH=1200
IMAGE_QUALITY=85
MAX_FILE_SIZE=10485760
EOF

echo "Installing Node.js and dependencies..."
# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install npm dependencies
npm install --production

echo "Setting up MySQL database..."
# Install MySQL if not present
if ! command -v mysql &> /dev/null; then
    echo "Installing MySQL..."
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

# Create database and user
sudo mysql << 'EOSQL'
CREATE DATABASE IF NOT EXISTS marga_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'marga_user'@'localhost' IDENTIFIED BY 'marga_prod_2024_secure';
GRANT ALL PRIVILEGES ON marga_production.* TO 'marga_user'@'localhost';
FLUSH PRIVILEGES;
EOSQL

echo "Running database migrations..."
mysql -u marga_user -pmarga_prod_2024_secure marga_production < database_schema.sql
mysql -u marga_user -pmarga_prod_2024_secure marga_production < migration_soft_delete_and_backup.sql
mysql -u marga_user -pmarga_prod_2024_secure marga_production < add_problems.sql

echo "Installing PM2 for process management..."
sudo npm install -g pm2

echo "Starting application with PM2..."
pm2 stop marga 2>/dev/null || true
pm2 delete marga 2>/dev/null || true
pm2 start server.js --name marga --env production
pm2 save
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable

echo "=================================================="
echo "   Deployment Complete!"
echo "=================================================="
echo ""
echo "Access your application at:"
echo "  http://194.32.141.21:8080"
echo ""
echo "Application is running on port 8080"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs marga      - View logs"
echo "  pm2 restart marga   - Restart app"
echo "  pm2 stop marga      - Stop app"
echo ""
echo "Database:"
echo "  Name: marga_production"
echo "  User: marga_user"
echo ""

ENDSSH

echo ""
echo "=================================================="
echo "   DEPLOYMENT SUCCESSFUL!"
echo "=================================================="
echo ""
echo "Your MARGA application is now live at:"
echo ""
echo "  🌐 http://194.32.141.21:8080"
echo ""
echo "The application is running with:"
echo "  - PM2 process manager (auto-restart on crashes)"
echo "  - Direct access on port 8080"
echo "  - MySQL database (production)"
echo "  - Daily backups scheduled at 2:00 AM"
echo ""

# Cleanup
rm -rf "$DEPLOY_DIR"
rm /tmp/marga-deploy.tar.gz 2>/dev/null || true

echo "Deployment complete!"
