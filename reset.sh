#!/bin/bash

# -----------------
# Color Constants
# -----------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# -----------------
# Helper Functions
# -----------------
print_step() {
    echo -e "${CYAN}> ${NC}${BOLD}$1${NC}"
}

print_success() {
    echo -e "${GREEN}v ${NC}$1"
}

print_error() {
    echo -e "${RED}x ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}! ${NC}$1"
}

# -----------------
# Splash Screen
# -----------------
clear
echo -e "${CYAN}${BOLD}"
cat << "EOF"
  ____  ____   ___   ____  ______    ___ 
 /    ||    \ /   \ |    \|      |  /  _]
|  o  ||  o  )     ||  D  )      | /  [_ 
|     ||   _/|  O  ||    /|_|  |_||    _]
|  _  ||  |  |     ||    \  |  |  |   [_ 
|  |  ||  |  |     ||  .  \ |  |  |     |
|__|__||__|   \___/ |__|\_| |__|  |_____|

by: brennocm (https://github.com/brennocm/aporte)
                                            
EOF
echo -e "${NC}"

print_warning "Initiating Controlled Reset of Aporte OSS..."
echo -e "  ${NC}This will clear the mathematical cache and rebuild containers."
echo -e "  ${NC}${GREEN}Your account, portfolios, and database are SAFE.${NC}"
echo ""

# 1. Stop all current containers
print_step "1/3 Stopping containers..."
docker compose stop

# 2. Delete only the container and image from Cache (Redis) to force flush
print_step "2/3 Clearing Cache (Redis)..."
docker compose rm -s -v -f redis

# 3. Rebuild the images and start
print_step "3/3 Rebuilding engine and starting infrastructure..."
docker compose down
docker compose up -d --build --force-recreate

echo ""
print_success "Reset completed successfully!"
echo -e "  ${NC}Status: Aporte is running again, fully refreshed."
echo -e "  ${NC}Link: ${CYAN}http://localhost:3000/${NC}"
echo ""
exit 0

