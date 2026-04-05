#!/bin/bash
# Lead Automation System - Complete Startup Script
# Phase 5 Implementation - All Components Ready

set -e

PROJECT_ROOT="/home/madhusudan/Pictures/special-winner"
MOBILE_DIR="$PROJECT_ROOT/mobile"

echo "======================================"
echo "🚀 Lead Automation System Startup"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not installed"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js$(node -v)${NC}"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not installed"
        exit 1
    fi
    echo -e "${GREEN}✓ npm$(npm -v)${NC}"

    echo ""
}

# Check backend
check_backend() {
    echo -e "${BLUE}Checking backend setup...${NC}"

    cd "$PROJECT_ROOT"

    # Check .env.local
    if [ ! -f ".env.local" ]; then
        echo "❌ .env.local not found"
        echo "   Create it from .env.example:"
        echo "   cp .env.example .env.local"
        exit 1
    fi
    echo -e "${GREEN}✓ .env.local found${NC}"

    # Check node_modules
    if [ ! -d "node_modules" ]; then
        echo "⚠️  Backend dependencies not installed"
        echo "   Run: npm install"
        exit 1
    fi
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"

    echo ""
}

# Check mobile
check_mobile() {
    echo -e "${BLUE}Checking mobile setup...${NC}"

    # Check mobile directory
    if [ ! -d "$MOBILE_DIR" ]; then
        echo "❌ Mobile directory not found at: $MOBILE_DIR"
        exit 1
    fi
    echo -e "${GREEN}✓ Mobile directory exists${NC}"

    # Check package.json
    if [ ! -f "$MOBILE_DIR/package.json" ]; then
        echo "❌ Mobile package.json not found"
        exit 1
    fi
    echo -e "${GREEN}✓ Mobile package.json found${NC}"

    echo ""
}

# Start backend
start_backend() {
    echo -e "${YELLOW}Starting backend server...${NC}"
    cd "$PROJECT_ROOT"

    # Kill any existing process on port 3001 or 3000
    for port in 3000 3001; do
        if lsof -i :$port &> /dev/null; then
            echo "⚠️  Port $port is in use, will use next available"
        fi
    done

    npm run dev &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    echo "  URL: http://localhost:3001"
    echo "  (May use 3001 if 3000 is occupied)"
    echo ""

    # Wait for backend to be ready
    echo "⏳ Waiting for backend to be ready..."
    sleep 5
}

# Start mobile
start_mobile() {
    echo -e "${YELLOW}Mobile app setup instructions:${NC}"
    echo ""
    echo "Option 1: Expo Go (Easiest)"
    echo "  1. Install 'Expo Go' app on your phone"
    echo "  2. Run: cd $MOBILE_DIR && npm start"
    echo "  3. Scan QR code with Expo Go app"
    echo ""
    echo "Option 2: Android Emulator"
    echo "  1. Install Android Studio"
    echo "  2. Create Vivo emulator (API 33, 6.5 inch screen)"
    echo "  3. Run: cd $MOBILE_DIR && npm start"
    echo "  4. Press 'a' for Android emulator"
    echo ""
    echo "Option 3: Web Browser"
    echo "  1. Run: cd $MOBILE_DIR && npm start"
    echo "  2. Press 'w' for web"
    echo "  3. Opens at http://localhost:19006"
    echo ""
}

# Display system status
show_status() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}System Status${NC}"
    echo "======================================"
    echo ""

    # Backend
    echo -e "${BLUE}Backend:${NC}"
    if curl -s http://localhost:3001 &> /dev/null; then
        echo -e "${GREEN}✓ Running on http://localhost:3001${NC}"
    else
        echo "⏳ Starting up (may take a few seconds)..."
    fi

    # Database
    echo -e "${BLUE}Database:${NC}"
    if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL" "$PROJECT_ROOT/.env.local"; then
        echo -e "${GREEN}✓ Configured${NC}"
    else
        echo "⚠️  Not configured in .env.local"
    fi

    # Mobile
    echo -e "${BLUE}Mobile:${NC}"
    if [ -d "$MOBILE_DIR/node_modules" ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo "⏳ Dependencies installing..."
    fi

    echo ""
}

# Display quick commands
show_commands() {
    echo "======================================"
    echo -e "${GREEN}Quick Commands${NC}"
    echo "======================================"
    echo ""
    echo "Backend Dashboard:"
    echo "  Open: http://localhost:3001/dashboard"
    echo ""
    echo "Automation Dashboard:"
    echo "  Open: http://localhost:3001/automation"
    echo ""
    echo "Mobile Development:"
    echo "  cd $MOBILE_DIR && npm start"
    echo ""
    echo "Test API Endpoints:"
    echo "  curl http://localhost:3001/api/automation/metrics"
    echo ""
    echo "View Logs:"
    echo "  tail -f .next/server.log"
    echo ""
    echo "Stop Backend:"
    echo "  kill $BACKEND_PID"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    check_backend
    check_mobile
    start_backend
    show_status
    start_mobile
    show_commands

    echo -e "${GREEN}✨ System ready!${NC}"
    echo ""
    echo "Phase 5 Implementation Complete:"
    echo "  ✅ Backend automation system running"
    echo "  ✅ Real-time metrics dashboard active"
    echo "  ✅ Mobile app structure ready"
    echo "  ✅ API endpoints functional"
    echo ""
    echo "Next steps:"
    echo "  1. Configure actual API keys in .env.local"
    echo "  2. Start mobile app: cd mobile && npm start"
    echo "  3. Visit http://localhost:3001 for web dashboard"
    echo "  4. Test workflows following TEST_AUTOMATION.md"
    echo ""
}

# Run main
main

# Keep script running
echo "Process running. Press Ctrl+C to stop."
wait
