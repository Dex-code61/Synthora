#!/usr/bin/env pwsh

Write-Host "🚀 Setting up Synthora development environment..." -ForegroundColor Green

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    Write-Host "   Visit: https://docs.docker.com/get-docker/" -ForegroundColor Yellow
    exit 1
}

# Check if pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm is not installed. Please install pnpm first." -ForegroundColor Red
    Write-Host "   Run: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
pnpm install

Write-Host "🐳 Starting database services..." -ForegroundColor Blue
docker compose up -d

Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🗄️ Setting up database..." -ForegroundColor Blue
pnpm db:generate
pnpm db:push
pnpm db:seed

Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update .env with your OpenAI API key (optional)" -ForegroundColor White
Write-Host "   2. Run 'pnpm dev' to start the development server" -ForegroundColor White
Write-Host "   3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📊 Database tools:" -ForegroundColor Cyan
Write-Host "   - View data: pnpm db:studio" -ForegroundColor White
Write-Host "   - Reset DB: pnpm db:push --force-reset && pnpm db:seed" -ForegroundColor White
Write-Host ""
Write-Host "🐳 Docker commands:" -ForegroundColor Cyan
Write-Host "   - Stop services: docker compose down" -ForegroundColor White
Write-Host "   - View logs: docker compose logs -f" -ForegroundColor White