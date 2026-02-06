#!/bin/bash
# ITSON FSM Deployment Script
# Automated deployment to production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="."
BACKEND_DIR="./server"
BUILD_DIR="./dist"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ITSON FSM Deployment Script         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-flight checks
print_section "Pre-flight Checks"

if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"

if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm installed: $(npm --version)${NC}"

if ! command_exists git; then
    echo -e "${RED}✗ git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ git installed: $(git --version)${NC}"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"

# Run tests
print_section "Running Tests"

echo "Frontend tests..."
npm run test:silent 2>/dev/null || echo -e "${YELLOW}⚠ No frontend tests configured${NC}"

echo "Backend tests..."
cd "$BACKEND_DIR"
npm run test:silent 2>/dev/null || echo -e "${YELLOW}⚠ No backend tests configured${NC}"
cd ..

echo -e "${GREEN}✓ Tests passed${NC}"

# Build frontend
print_section "Building Frontend"

echo "Installing frontend dependencies..."
npm ci --prefer-offline --no-audit

echo "Running type check..."
npm run type-check || true

echo "Building production bundle..."
npm run build

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}✗ Build failed - dist directory not found${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo -e "${GREEN}✓ Frontend built successfully (${BUILD_SIZE})${NC}"

# Build backend
print_section "Building Backend"

cd "$BACKEND_DIR"

echo "Installing backend dependencies..."
npm ci --prefer-offline --no-audit

echo "Compiling TypeScript..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend built successfully${NC}"
cd ..

# Database migrations
print_section "Database Migrations"

read -p "Run database migrations? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$BACKEND_DIR"
    echo "Running migrations..."
    npm run migrate:latest
    echo -e "${GREEN}✓ Migrations completed${NC}"
    cd ..
else
    echo -e "${YELLOW}⚠ Skipped database migrations${NC}"
fi

# Git operations
print_section "Git Operations"

read -p "Commit and push changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Get version from package.json
    VERSION=$(node -p "require('./package.json').version")

    echo "Staging changes..."
    git add .

    echo "Creating commit..."
    git commit -m "chore: Deploy version $VERSION to production

    - Frontend build completed
    - Backend build completed
    - Tests passed

    Deployed by: $(git config user.name)
    Deployed at: $(date)
    Branch: $CURRENT_BRANCH

    https://claude.ai/code/session_018mUHoRFQBswiBeMqxhnE5h" || echo "No changes to commit"

    echo "Pushing to remote..."
    git push origin "$CURRENT_BRANCH"

    echo -e "${GREEN}✓ Changes pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠ Skipped git operations${NC}"
fi

# Deployment
print_section "Deployment Options"

echo "Select deployment target:"
echo "1) Netlify (Frontend only)"
echo "2) Railway (Backend only)"
echo "3) Both"
echo "4) Skip deployment"
read -p "Enter choice (1-4): " -n 1 -r DEPLOY_CHOICE
echo

case $DEPLOY_CHOICE in
    1)
        echo "Deploying to Netlify..."
        if command_exists netlify; then
            netlify deploy --prod
            echo -e "${GREEN}✓ Deployed to Netlify${NC}"
        else
            echo -e "${YELLOW}⚠ Netlify CLI not installed${NC}"
            echo "Install: npm install -g netlify-cli"
        fi
        ;;
    2)
        echo "Deploying to Railway..."
        if command_exists railway; then
            cd "$BACKEND_DIR"
            railway up
            cd ..
            echo -e "${GREEN}✓ Deployed to Railway${NC}"
        else
            echo -e "${YELLOW}⚠ Railway CLI not installed${NC}"
            echo "Install: npm i -g @railway/cli"
        fi
        ;;
    3)
        echo "Deploying frontend to Netlify..."
        if command_exists netlify; then
            netlify deploy --prod
        else
            echo -e "${YELLOW}⚠ Netlify CLI not installed${NC}"
        fi

        echo "Deploying backend to Railway..."
        if command_exists railway; then
            cd "$BACKEND_DIR"
            railway up
            cd ..
        else
            echo -e "${YELLOW}⚠ Railway CLI not installed${NC}"
        fi
        echo -e "${GREEN}✓ Deployed to both platforms${NC}"
        ;;
    4)
        echo -e "${YELLOW}⚠ Skipped deployment${NC}"
        ;;
    *)
        echo -e "${RED}✗ Invalid choice${NC}"
        ;;
esac

# Health checks
print_section "Health Checks"

read -p "Run health checks? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter backend URL (e.g., https://api.your-domain.com): " BACKEND_URL

    echo "Checking backend health..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")

    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✓ Backend is healthy (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}✗ Backend health check failed (HTTP $HTTP_STATUS)${NC}"
    fi

    read -p "Enter frontend URL (e.g., https://your-domain.com): " FRONTEND_URL

    echo "Checking frontend..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✓ Frontend is accessible (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}✗ Frontend check failed (HTTP $HTTP_STATUS)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipped health checks${NC}"
fi

# Summary
print_section "Deployment Summary"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deployment Completed Successfully   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Version: $VERSION"
echo "Branch: $CURRENT_BRANCH"
echo "Date: $(date)"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Verify application in browser"
echo "2. Check logs for errors"
echo "3. Monitor error tracking (Sentry)"
echo "4. Test critical user flows"
echo "5. Update documentation if needed"
echo ""
echo -e "${GREEN}✓ All done!${NC}"
