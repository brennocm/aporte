#!/bin/bash

# --- APORTE Open Source: Startup Script ---

# -----------------
# Color Constants
# -----------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

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
echo -e "  ${BOLD}The Open Source Wealth Simulation Engine${NC}"
echo -e "  ----------------------------------------"
echo ""

# -----------------
# Execution Start
# -----------------

print_step "Performing system checks..."

# 1. Check for Docker
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not installed or not running."
    echo -e "  Please install Docker Desktop to continue: ${CYAN}https://www.docker.com/${NC}"
    exit 1
fi
print_success "Docker Engine is active."

# 2. Configure .env automatically
print_step "Verifying environment configuration..."
if [ ! -f .env ]; then
    print_warning "No .env file found. Generating from template..."
    cp .env.example .env
    print_success "Environment profile (.env) created."
else
    print_success "Environment profile (.env) found."
fi

# 3. Generate secure AUTH_SECRET if still using placeholder
if grep -q "sua_chave_secreta" .env; then
    print_step "Securing authentication layer..."
    NEW_SECRET=$(openssl rand -base64 32)
    
    # OS compatible sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/AUTH_SECRET=.*/AUTH_SECRET=$NEW_SECRET/" .env
    else
        sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=$NEW_SECRET|" .env
    fi
    print_success "Cryptographic keys generated and injected."
fi

echo ""
print_step "Igniting the Aporte containers..."
echo -e "  ${NC}This phase builds the Math Engine and Web Layer."
echo -e "  ${NC}Depending on your internet speed, this ${BOLD}may take a few minutes.${NC}"
echo ""

# 4. Start Containers
if docker compose up --build -d; then
    echo ""
    echo -e "${GREEN}${BOLD}=======================================================${NC}"
    echo -e "${GREEN}${BOLD}                 APORTE IS ONLINE                      ${NC}"
    echo -e "${GREEN}${BOLD}=======================================================${NC}"
    echo ""
    echo -e "  ${BOLD}Launch URL${NC}    ${CYAN}http://localhost:3000/${NC}"
    echo -e "  ${BOLD}Status${NC}        Containers running in background."
    echo ""
    echo -e "  ${NC}To monitor server logs in real-time, run:"
    echo -e "  ${NC}docker compose logs -f"
    echo ""
else
    echo ""
    echo -e "${RED}${BOLD}=======================================================${NC}"
    echo -e "${RED}${BOLD}             FAILED TO START APORTE                    ${NC}"
    echo -e "${RED}${BOLD}=======================================================${NC}"
    echo ""
    print_error "The build process failed. See the errors above for details."
    echo -e "  ${NC}You can also check logs with: ${BOLD}docker compose logs${NC}"
    echo ""
    exit 1
fi
