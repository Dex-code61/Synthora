# Synthora - Git Repository Analysis

Synthora is a Kiro extension that analyzes Git repository history to reveal code evolution, technical decisions, and predict risk zones. The tool transforms Git metadata into narrative insights using AI, helping developers understand codebase evolution and team collaboration patterns.

## Features

- **Interactive Timeline**: Visualize commit history with interactive charts
- **AI-Generated Stories**: Get AI-powered narratives about file evolution
- **Risk Analysis**: Identify code hotspots and high-risk areas
- **Team Insights**: Analyze collaboration patterns and knowledge distribution
- **Semantic Search**: Search through commit messages and code using natural language
- **Kiro Integration**: Seamless integration with Kiro IDE

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with Redis for caching
- **AI**: OpenAI/Anthropic for story generation
- **Git Analysis**: simple-git library
- **Visualization**: Recharts

## Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Git
- OpenAI API key (optional, for AI features)

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd synthora
pnpm install
```

### 2. Set Up Development Environment

Start the database services:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Configure Environment

Copy the `.env` file and update with your settings:

```bash
# The .env file is already created with default values
# Update OPENAI_API_KEY if you want AI features
```

### 4. Set Up Database

Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database with sample data

## Project Structure

```
synthora/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── src/
│   ├── components/        # React components
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript type definitions
├── prisma/               # Database schema and migrations
├── docker-compose.yml    # Development services
└── .env                  # Environment variables
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/repositories` - List repositories
- `POST /api/repositories` - Create repository
- `POST /api/repositories/[id]/analyze` - Start analysis
- `GET /api/repositories/[id]/timeline` - Get timeline data
- `GET /api/repositories/[id]/hotspots` - Get risk analysis

## Development

### Database Management

View your data:
```bash
pnpm db:studio
```

Reset database:
```bash
pnpm db:push --force-reset
pnpm db:seed
```

### Docker Services

Stop services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.