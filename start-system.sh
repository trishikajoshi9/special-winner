#!/bin/bash
# Unified Startup Script - Backend + Mobile

set -e

echo "🚀 LEAD AUTOMATION SYSTEM - STARTUP"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM="Linux";;
    Darwin*)    PLATFORM="Mac";;
    *)          PLATFORM="Unknown";;
esac

echo -e "${BLUE}Platform: $PLATFORM${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

echo ""

# Parse arguments
START_BACKEND=true
START_MOBILE=false
RUN_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --mobile)
            START_MOBILE=true
            shift
            ;;
        --no-backend)
            START_BACKEND=false
            shift
            ;;
        --tests)
            RUN_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --mobile        Also start mobile emulator"
            echo "  --no-backend    Skip backend startup"
            echo "  --tests         Run test suite after startup"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                   # Start backend only"
            echo "  $0 --mobile          # Start backend + mobile"
            echo "  $0 --mobile --tests  # Start all + run tests"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Start Backend
if [ "$START_BACKEND" = true ]; then
    echo -e "${YELLOW}Starting Backend Server...${NC}"
    echo "Port: http://localhost:3001"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    npm run dev &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend PID: $BACKEND_PID${NC}"

    # Wait for backend to be ready
    echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/system/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend Ready!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
fi

# Start Mobile
if [ "$START_MOBILE" = true ]; then
    echo ""
    echo -e "${YELLOW}Starting Mobile Development...${NC}"
    cd mobile
    echo "Press 'a' for Android or 'i' for iOS"
    echo ""
    npm start &
    MOBILE_PID=$!
    echo -e "${GREEN}✓ Mobile DevServer PID: $MOBILE_PID${NC}"
    cd ..
fi

# Run Tests
if [ "$RUN_TESTS" = true ]; then
    echo ""
    echo -e "${YELLOW}Running Test Suite...${NC}"
    sleep 3
    chmod +x run-tests.sh
    ./run-tests.sh
fi

# Display status
echo ""
echo "======================================"
echo -e "${GREEN}✓ SYSTEM STARTUP COMPLETE${NC}"
echo "======================================"
echo ""

if [ "$START_BACKEND" = true ]; then
    echo "Backend: http://localhost:3001"
    echo "Automation Dashboard: http://localhost:3001/automation"
    echo "API Docs: http://localhost:3001/api"
fi

if [ "$START_MOBILE" = true ]; then
    echo "Mobile: Expo running (press 'a' for Android)"
fi

echo ""
echo "To stop all services: Press Ctrl+C"
echo ""

# Wait for all background jobs
wait
