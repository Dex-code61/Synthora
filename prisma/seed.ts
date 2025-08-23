import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a sample repository
  const repository = await prisma.repository.upsert({
    where: { path: '/sample/repo' },
    update: {},
    create: {
      name: 'Sample Repository',
      path: '/sample/repo',
      lastAnalyzed: new Date()
    }
  })

  console.log('✅ Created sample repository:', repository.name)

  // Create sample commits
  const commits = await Promise.all([
    prisma.commit.upsert({
      where: { sha: 'abc123' },
      update: {},
      create: {
        repositoryId: repository.id,
        sha: 'abc123',
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        message: 'Initial commit',
        timestamp: new Date('2024-01-01'),
        filesChanged: 3,
        insertions: 100,
        deletions: 0
      }
    }),
    prisma.commit.upsert({
      where: { sha: 'def456' },
      update: {},
      create: {
        repositoryId: repository.id,
        sha: 'def456',
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        message: 'Add user authentication',
        timestamp: new Date('2024-01-02'),
        filesChanged: 5,
        insertions: 200,
        deletions: 10
      }
    })
  ])

  console.log('✅ Created sample commits:', commits.length)

  // Create sample file metrics
  const fileMetrics = await prisma.fileMetrics.upsert({
    where: {
      repositoryId_filePath: {
        repositoryId: repository.id,
        filePath: 'src/auth.ts'
      }
    },
    update: {},
    create: {
      repositoryId: repository.id,
      filePath: 'src/auth.ts',
      commitCount: 5,
      authorCount: 2,
      riskScore: 0.3,
      totalChanges: 15,
      bugCommits: 1,
      lastModified: new Date('2024-01-02')
    }
  })

  console.log('✅ Created sample file metrics for:', fileMetrics.filePath)

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })