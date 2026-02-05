#!/bin/bash

##############################################################################
# ITSON FSM - Quick Preview Script
# Shows the application running locally without backend
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   ITSON FSM - Application Preview${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies found${NC}"
fi

# Create .env for preview
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating preview environment...${NC}"
    cat > .env <<EOF
VITE_API_URL=http://localhost:5000/api
VITE_ANTHROPIC_API_KEY=
VITE_AI_PROVIDER=claude
EOF
    echo -e "${GREEN}✓ Environment configured${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Starting Preview Server...${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${CYAN}The application will open in your browser.${NC}"
echo -e "${CYAN}This is a FRONTEND-ONLY preview.${NC}"
echo ""
echo -e "${YELLOW}Note: Backend features will show mock data${NC}"
echo -e "${YELLOW}For full functionality, deploy with backend${NC}"
echo ""
echo -e "${GREEN}Access the preview at:${NC}"
echo -e "  ${CYAN}http://localhost:5173${NC}"
echo ""
echo -e "${GREEN}Demo Credentials:${NC}"
echo -e "  Email:    ${CYAN}admin@itsonfsm.com${NC}"
echo -e "  Password: ${CYAN}password123${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the preview server${NC}"
echo ""
echo -e "${BLUE}================================================${NC}"
echo ""

# Start dev server
npm run dev
