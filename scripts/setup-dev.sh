#!/bin/bash

echo "🚀 Setting up Synthora development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    echo "   Run: npm install -g pnpm"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🐳 Starting database services..."
docker compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🗄️ Setting up database..."
pnpm db:generate
pnpm db:push
pnpm db:seed

echo "✅ Development environment is ready!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update .env with your OpenAI API key (optional)"
echo "   2. Run 'pnpm dev' to start the development server"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📊 Database tools:"
echo "   - View data: pnpm db:studio"
echo "   - Reset DB: pnpm db:push --force-reset && pnpm db:seed"
echo ""
echo "🐳 Docker commands:"
echo "   - Stop services: docker compose down"
echo "   - View logs: docker compose logs -f"