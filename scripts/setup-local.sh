#!/bin/bash
# ITSON FSM Local Development Setup
# Sets up the entire development environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ITSON FSM Local Setup                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}▶ Checking Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL not found. You'll need to install it.${NC}"
    echo "  macOS: brew install postgresql@14"
    echo "  Ubuntu: sudo apt install postgresql-14"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ PostgreSQL $(psql --version | cut -d' ' -f3)${NC}"
fi

# Environment setup
echo ""
echo -e "${BLUE}▶ Environment Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your settings${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
fi

if [ ! -f server/.env ]; then
    echo "Creating server/.env file..."
    cat > server/.env << 'EOF'
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/itson_fsm_dev
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
EOF
    echo -e "${GREEN}✓ server/.env file created${NC}"
else
    echo -e "${YELLOW}⚠ server/.env file already exists${NC}"
fi

# Database setup
echo ""
echo -e "${BLUE}▶ Database Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

read -p "Create local database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DB_NAME="itson_fsm_dev"

    echo "Creating database: $DB_NAME"
    createdb "$DB_NAME" 2>/dev/null && echo -e "${GREEN}✓ Database created${NC}" || echo -e "${YELLOW}⚠ Database may already exist${NC}"

    echo "Running migrations..."
    cd server
    npm install --prefer-offline
    npm run migrate:latest
    cd ..
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Skipped database setup${NC}"
fi

# Install dependencies
echo ""
echo -e "${BLUE}▶ Installing Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Installing frontend dependencies..."
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo "Installing backend dependencies..."
cd server
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Completed Successfully!        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}To start development:${NC}"
echo ""
echo "1. Start backend:"
echo "   cd server && npm run dev"
echo ""
echo "2. Start frontend (in another terminal):"
echo "   npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:5173"
echo ""
echo -e "${BLUE}Demo credentials:${NC}"
echo "   admin@itsonfsm.com / password123"
echo "   manager@itsonfsm.com / password123"
echo "   supervisor@itsonfsm.com / password123"
echo ""
echo -e "${GREEN}✓ Happy coding!${NC}"
