#!/usr/bin/env node
/**
 * Check rate limiting audit logs
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Checking audit logs for rate limiting events...\n")

  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 50
  })

  console.log(`Total audit logs: ${recentLogs.length}\n`)

  const loginSuccesses = recentLogs.filter(log => log.action === 'LOGIN_SUCCESS')
  const loginFailures = recentLogs.filter(log => log.action === 'LOGIN_FAILURE')
  const userCreated = recentLogs.filter(log => log.action === 'USER_CREATED')

  console.log(`LOGIN_SUCCESS: ${loginSuccesses.length}`)
  console.log(`LOGIN_FAILURE: ${loginFailures.length}`)
  console.log(`USER_CREATED: ${userCreated.length}`)

  // Check for rate limit failures
  console.log("\nLogin failures (last 10):")
  loginFailures.slice(0, 10).forEach((log, idx) => {
    const metadata = log.metadata || {}
    console.log(`  ${idx + 1}. ${log.timestamp.toISOString()}`)
    console.log(`     Reason: ${JSON.stringify(metadata)}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
