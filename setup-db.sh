#!/bin/bash

# Dashboard Database Setup Script
# Run this to initialize PostgreSQL and migrations

echo "📊 Dashboard Database Setup"
echo "============================\n"

# Check if PostgreSQL is running
echo "1️⃣  Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL not running. Starting..."
    brew services start postgresql 2>/dev/null || sudo service postgresql start
    sleep 2
fi

# Create database if it doesn't exist
echo "2️⃣  Creating database..."
createdb dashboard_db 2>/dev/null || echo "Database already exists"

# Update .env.local DATABASE_URL (optional)
echo "3️⃣  Setting up environment..."
if grep -q "postgresql://user:password@localhost" .env.local; then
    echo "  Updating DATABASE_URL..."
    # You can update this to your actual postgres credentials
fi

# Run Prisma migrations
echo "4️⃣  Running Prisma migrations..."
npx prisma migrate deploy

# Optional: Seed database with sample data
read -p "Do you want to seed sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
fi

echo "\n✅ Database setup complete!"
echo "📍 You can now start the dashboard with: npm run dev"
