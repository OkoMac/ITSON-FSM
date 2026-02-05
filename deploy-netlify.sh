#!/bin/bash

# Netlify Deployment Script for ITSON FSM Platform
# Mobile-friendly deployment with multiple options

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     ITSON FSM Platform - Netlify Deployment          ║
║     Mobile-Optimized PWA Deployment                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check Node.js version
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required. Current: v$(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check if git repo is clean
echo -e "${YELLOW}[2/5] Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
    echo -e "${CYAN}Commit them before deploying? (y/n)${NC}"
    read -r response
    if [ "$response" = "y" ]; then
        echo -e "${CYAN}Enter commit message:${NC}"
        read -r commit_msg
        git add .
        git commit -m "$commit_msg"
        git push
        echo -e "${GREEN}✓ Changes committed and pushed${NC}"
    fi
else
    echo -e "${GREEN}✓ Git working tree clean${NC}"
fi

# Display deployment options
echo -e "${YELLOW}[3/5] Choose deployment method:${NC}"
echo ""
echo -e "  ${CYAN}1)${NC} GitHub Integration (Recommended - Easy!)"
echo -e "     ${BLUE}→ Deploy automatically from GitHub${NC}"
echo -e "     ${BLUE}→ Best for continuous deployment${NC}"
echo ""
echo -e "  ${CYAN}2)${NC} Netlify CLI (For developers)"
echo -e "     ${BLUE}→ Deploy from command line${NC}"
echo -e "     ${BLUE}→ Requires Netlify login${NC}"
echo ""
echo -e "  ${CYAN}3)${NC} Netlify Drop (Drag & Drop)"
echo -e "     ${BLUE}→ Upload build folder manually${NC}"
echo -e "     ${BLUE}→ No CLI or Git required${NC}"
echo ""
echo -e "  ${CYAN}4)${NC} View Deployment Guide"
echo -e "     ${BLUE}→ Complete deployment documentation${NC}"
echo ""
echo -e "  ${CYAN}5)${NC} Exit"
echo ""
echo -e -n "${CYAN}Select option (1-5): ${NC}"
read -r option

case $option in
    1)
        echo -e "${GREEN}[4/5] GitHub Integration Deployment${NC}"
        echo ""
        echo -e "${YELLOW}Steps to deploy via GitHub:${NC}"
        echo ""
        echo -e "1. ${CYAN}Go to Netlify:${NC} https://app.netlify.com"
        echo -e "2. ${CYAN}Click:${NC} 'Add new site' → 'Import an existing project'"
        echo -e "3. ${CYAN}Choose:${NC} GitHub"
        echo -e "4. ${CYAN}Select:${NC} OkoMac/ITSON-FSM repository"
        echo -e "5. ${CYAN}Configure:${NC}"
        echo ""
        echo -e "   ${BLUE}Build command:${NC}     npm run build"
        echo -e "   ${BLUE}Publish directory:${NC} dist"
        echo -e "   ${BLUE}Base directory:${NC}    (leave empty)"
        echo ""
        echo -e "6. ${CYAN}Add environment variables:${NC}"
        echo ""
        echo -e "   ${BLUE}VITE_API_URL:${NC}         https://api.itsonfsm.com/api"
        echo -e "   ${BLUE}VITE_AI_PROVIDER:${NC}     claude"
        echo -e "   ${BLUE}NODE_VERSION:${NC}         18"
        echo -e "   ${BLUE}NPM_FLAGS:${NC}            --legacy-peer-deps"
        echo ""
        echo -e "7. ${CYAN}Click:${NC} 'Deploy site'"
        echo ""
        echo -e "${GREEN}Your site will be live in 2-3 minutes!${NC}"
        echo ""
        echo -e "${CYAN}Opening Netlify in browser...${NC}"
        echo -e "${YELLOW}(If on mobile, copy this URL: https://app.netlify.com/start)${NC}"
        ;;

    2)
        echo -e "${GREEN}[4/5] Netlify CLI Deployment${NC}"
        echo ""

        # Check if netlify CLI is installed
        if ! command -v netlify &> /dev/null; then
            echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
            npm install -g netlify-cli
        fi

        # Check if logged in
        if ! netlify status &> /dev/null; then
            echo -e "${YELLOW}Please login to Netlify${NC}"
            echo -e "${CYAN}This will open a browser window for authentication${NC}"
            echo ""
            netlify login
        fi

        # Check if site exists
        if [ ! -f ".netlify/state.json" ]; then
            echo -e "${YELLOW}Initializing new Netlify site...${NC}"
            netlify init
        fi

        # Build the project
        echo -e "${YELLOW}[5/5] Building project...${NC}"
        npm run build

        # Deploy
        echo -e "${YELLOW}Deploying to Netlify...${NC}"
        netlify deploy --prod

        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        netlify open:site
        ;;

    3)
        echo -e "${GREEN}[4/5] Netlify Drop Deployment${NC}"
        echo ""
        echo -e "${YELLOW}Building project for manual upload...${NC}"

        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo -e "${CYAN}Installing dependencies...${NC}"
            npm install --legacy-peer-deps
        fi

        # Build
        npm run build

        echo ""
        echo -e "${GREEN}✓ Build complete!${NC}"
        echo ""
        echo -e "${YELLOW}Manual deployment steps:${NC}"
        echo ""
        echo -e "1. ${CYAN}Go to:${NC} https://app.netlify.com/drop"
        echo -e "2. ${CYAN}Drag and drop${NC} the ${BLUE}'dist'${NC} folder"
        echo -e "3. ${CYAN}Wait${NC} for upload to complete"
        echo -e "4. ${CYAN}Your site will be live!${NC}"
        echo ""
        echo -e "${BLUE}Build folder location:${NC} $(pwd)/dist"
        echo ""
        echo -e "${CYAN}Opening file browser to dist folder...${NC}"
        echo -e "${YELLOW}(If on mobile, the dist folder is ready to upload)${NC}"
        ;;

    4)
        echo -e "${GREEN}[4/5] Opening Deployment Guide${NC}"
        echo ""
        if [ -f "NETLIFY_DEPLOYMENT.md" ]; then
            cat NETLIFY_DEPLOYMENT.md
        else
            echo -e "${RED}Deployment guide not found${NC}"
        fi
        ;;

    5)
        echo -e "${CYAN}Exiting...${NC}"
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment process complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. ${CYAN}Test your site on mobile${NC}"
echo -e "2. ${CYAN}Add to home screen (iOS/Android)${NC}"
echo -e "3. ${CYAN}Test PWA offline functionality${NC}"
echo -e "4. ${CYAN}Set up custom domain (optional)${NC}"
echo ""
echo -e "${BLUE}Need help? Check: NETLIFY_DEPLOYMENT.md${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""
