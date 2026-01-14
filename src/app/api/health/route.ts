import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies.
 * Used by monitoring services, load balancers, and CI/CD pipelines.
 *
 * @returns Health status with checks for database, uptime, and memory
 */
export async function GET() {
  const startTime = Date.now()

  const checks: {
    status: string
    timestamp: string
    uptime: number
    environment: string
    version: string
    checks: {
      database: {
        status: string
        responseTime: number
        error?: string
      }
      memory: {
        status: string
        usage: number
        total?: number
        percentage?: number
        error?: string
      }
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      memory: { status: 'unknown', usage: 0 },
    },
  }

  // Check database connection
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime

    checks.checks.database = {
      status: 'healthy',
      responseTime: dbResponseTime,
    }
  } catch (error) {
    checks.status = 'unhealthy'
    checks.checks.database = {
      status: 'unhealthy',
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check memory usage
  try {
    const memoryUsage = process.memoryUsage()
    const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const memoryPercentage = (usedMemoryMB / totalMemoryMB) * 100

    checks.checks.memory = {
      status: memoryPercentage > 90 ? 'warning' : 'healthy',
      usage: usedMemoryMB,
      total: totalMemoryMB,
      percentage: Math.round(memoryPercentage),
    }

    if (memoryPercentage > 95) {
      checks.status = 'unhealthy'
    }
  } catch (error) {
    checks.checks.memory = {
      status: 'unknown',
      usage: 0,
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const totalResponseTime = Date.now() - startTime

  return NextResponse.json(
    {
      ...checks,
      responseTime: totalResponseTime,
    },
    {
      status: checks.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  )
}
