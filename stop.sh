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

print_warning "Initiating Aporte shutdown..."
echo ""

# Stop Docker Compose containers
print_step "Stopping containers..."
docker compose stop

echo ""
print_success "Aporte shut down successfully!"
echo -e "  ${NC}Memory and processing resources (CPU) have been fully released."
echo -e "  ${NC}To start again, run: ${CYAN}./start.sh${NC}"
echo ""
exit 0

