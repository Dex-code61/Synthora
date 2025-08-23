import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRepositorySchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1)
})

export async function GET() {
  try {
    const repositories = await prisma.repository.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            commits: true,
            fileMetrics: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: repositories
    })
  } catch (error) {
    console.error('Failed to fetch repositories:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch repositories'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, path } = createRepositorySchema.parse(body)

    const repository = await prisma.repository.create({
      data: {
        name,
        path
      }
    })

    return NextResponse.json({
      success: true,
      data: repository
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create repository:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create repository'
    }, { status: 500 })
  }
}