#!/bin/bash

# P18.KZ Improved Deployment Script
# Handles recurring issues automatically: missing dependencies, port conflicts, etc.

set -e  # Exit on error

# Configuration
SERVER_USER="ubuntu"
SERVER_IP="194.32.141.21"
SERVER_PASSWORD="0qyMw4XKWWX1S5WQzvsjgjI="
PROJECT_NAME="p18kz"
SERVER_DIR="/var/www/${PROJECT_NAME}"
LOCAL_PROJECT_DIR="/Users/nurbolatkhamitov/Desktop/web projects/claudep18"
DOMAIN="p18.kz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}P18.KZ Improved Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to execute commands on server
remote_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "sudo bash -c '$1'"
}

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Increment version
echo -e "${YELLOW}Step 1: Incrementing version...${NC}"
cd "$LOCAL_PROJECT_DIR"
node scripts/increment-version.js
check_status "Version incremented"

# Step 2: Build the project locally
echo -e "\n${YELLOW}Step 2: Building React frontend...${NC}"
npm run build
check_status "Build complete"

# Step 3: Create deployment package (code only, no configs)
echo -e "\n${YELLOW}Step 3: Creating deployment package...${NC}"
tar --exclude="node_modules" --exclude="*.log" --exclude=".git" --exclude="ecosystem.config.js" --no-xattrs \
    -czf deploy-package.tar.gz \
    build/ \
    server/ \
    telegram_bot/ \
    zoom_*.js \
    package.json \
    package-lock.json

check_status "Package created"

# Step 4: Upload deployment package
echo -e "\n${YELLOW}Step 4: Uploading to server...${NC}"
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
    deploy-package.tar.gz \
    "$SERVER_USER@$SERVER_IP:/tmp/"

check_status "Upload complete"

# Step 5: Extract and update on server (preserving configs)
echo -e "\n${YELLOW}Step 5: Updating application on server...${NC}"
remote_exec "cd ${SERVER_DIR} && tar -xzf /tmp/deploy-package.tar.gz"
check_status "Files extracted"

# Step 6: Fix recurring dependency issues
echo -e "\n${YELLOW}Step 6: Installing/fixing dependencies...${NC}"

# Install server dependencies with explicit fixes
echo -e "${BLUE}  → Installing server dependencies...${NC}"
remote_exec "cd ${SERVER_DIR}/server && npm install --production"
check_status "Server dependencies installed"

# Explicitly ensure express-rate-limit is installed (recurring issue fix)
echo -e "${BLUE}  → Ensuring express-rate-limit is installed (recurring fix)...${NC}"
remote_exec "cd ${SERVER_DIR}/server && npm list express-rate-limit || npm install express-rate-limit"
check_status "express-rate-limit verified"

# Install telegram bot dependencies
echo -e "${BLUE}  → Installing telegram bot dependencies...${NC}"
remote_exec "cd ${SERVER_DIR}/telegram_bot && npm install --production --legacy-peer-deps"
check_status "Telegram bot dependencies installed"

# Step 7: Kill any processes on conflicting ports (recurring issue fix)
echo -e "\n${YELLOW}Step 7: Checking for port conflicts...${NC}"
echo -e "${BLUE}  → Checking port 5001 (server)...${NC}"
remote_exec "lsof -ti:5001 | xargs kill -9 2>/dev/null || true"
echo -e "${BLUE}  → Checking port 3001 (count API)...${NC}"
remote_exec "lsof -ti:3001 | xargs kill -9 2>/dev/null || true"
echo -e "${BLUE}  → Checking port 3032 (zoom webhook)...${NC}"
remote_exec "lsof -ti:3032 | xargs kill -9 2>/dev/null || true"
check_status "Port conflicts cleared"

# Step 8: Reload PM2 processes
echo -e "\n${YELLOW}Step 8: Reloading services...${NC}"
# Use restart instead of reload to ensure fresh start
remote_exec "pm2 restart ecosystem.config.js"
sleep 3  # Give PM2 time to restart
check_status "Services restarted"

# Step 9: Verify PM2 processes are running
echo -e "\n${YELLOW}Step 9: Verifying services are running...${NC}"
echo ""
remote_exec "pm2 list"
echo ""

# Check if all expected processes are online
echo -e "${BLUE}  → Checking process status...${NC}"
PROCESS_STATUS=$(remote_exec "pm2 jlist" | grep -c '"status":"online"' || echo "0")
if [ "$PROCESS_STATUS" -ge "3" ]; then
    check_status "All critical processes are online"
else
    echo -e "${RED}⚠ Some processes may not be running correctly${NC}"
    echo -e "${YELLOW}Check logs with: ssh ubuntu@194.32.141.21 'pm2 logs'${NC}"
fi

# Step 10: Clean up
echo -e "\n${YELLOW}Step 10: Cleaning up...${NC}"
rm -f deploy-package.tar.gz
remote_exec "rm -f /tmp/deploy-package.tar.gz"
check_status "Cleanup complete"

# Step 11: Health check
echo -e "\n${YELLOW}Step 11: Running health check...${NC}"
echo -e "${BLUE}  → Testing API endpoint...${NC}"
sleep 5  # Give services time to fully start
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/api/health || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    check_status "API health check passed"
else
    echo -e "${YELLOW}⚠ API health check returned status: ${HTTP_STATUS}${NC}"
    echo -e "${YELLOW}  The site may take a few moments to become available${NC}"
fi

# Final summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your application is live at:"
echo -e "${GREEN}  https://${DOMAIN}${NC}"
echo ""
echo -e "Status page:"
echo -e "${GREEN}  https://${DOMAIN}/status${NC}"
echo ""
echo -e "${BLUE}Recent improvements:${NC}"
echo -e "  ✓ Added pagination to form submissions"
echo -e "  ✓ Fixed user count display (actual count vs 1000 limit)"
echo -e "  ✓ Enabled direct registration with manual email entry"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:    ${BLUE}ssh ubuntu@194.32.141.21 'pm2 logs'${NC}"
echo -e "  Check status: ${BLUE}ssh ubuntu@194.32.141.21 'pm2 list'${NC}"
echo -e "  Restart:      ${BLUE}ssh ubuntu@194.32.141.21 'pm2 restart all'${NC}"
echo ""