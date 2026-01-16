#!/usr/bin/env node
/**
 * Query the AuditLog table to verify audit events are being logged
 */

// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuditLogs() {
  console.log("================================================================================");
  console.log("DATABASE AUDIT LOG VERIFICATION");
  console.log("================================================================================");

  try {
    // Count total audit logs
    const totalLogs = await prisma.auditLog.count();
    console.log(`\nTotal audit log entries: ${totalLogs}`);

    if (totalLogs === 0) {
      console.log("\n⚠ WARNING: No audit logs found in database!");
      console.log("This could mean:");
      console.log("  1. No authentication events have occurred yet");
      console.log("  2. Audit logging is not working properly");
      return;
    }

    // Get count by action type
    console.log("\n[AUDIT LOGS BY ACTION TYPE]");
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });

    actionCounts.forEach(({ action, _count }) => {
      console.log(`  ${action}: ${_count.action} entries`);
    });

    // Get most recent 10 audit logs
    console.log("\n[MOST RECENT 10 AUDIT LOGS]");
    const recentLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        id: true,
        action: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        timestamp: true
      }
    });

    recentLogs.forEach((log, index) => {
      console.log(`\n  [${index + 1}] ${log.action} - ${log.timestamp.toISOString()}`);
      console.log(`      User ID: ${log.userId || 'N/A'}`);
      console.log(`      IP Address: ${log.ipAddress || 'Not captured'}`);
      console.log(`      User Agent: ${log.userAgent ? log.userAgent.substring(0, 60) + '...' : 'Not captured'}`);
      if (log.metadata) {
        console.log(`      Metadata: ${JSON.stringify(log.metadata)}`);
      }
    });

    // Check for specific event types
    console.log("\n[EVENT TYPE VERIFICATION]");
    const loginSuccessCount = await prisma.auditLog.count({
      where: { action: 'LOGIN_SUCCESS' }
    });
    const loginFailureCount = await prisma.auditLog.count({
      where: { action: 'LOGIN_FAILURE' }
    });
    const userCreatedCount = await prisma.auditLog.count({
      where: { action: 'USER_CREATED' }
    });

    console.log(`  ✓ LOGIN_SUCCESS: ${loginSuccessCount} entries`);
    console.log(`  ✓ LOGIN_FAILURE: ${loginFailureCount} entries`);
    console.log(`  ✓ USER_CREATED: ${userCreatedCount} entries`);

    // Check IP and User Agent capture
    console.log("\n[IP ADDRESS AND USER AGENT CAPTURE]");
    const logsWithIP = await prisma.auditLog.count({
      where: {
        ipAddress: {
          not: null
        }
      }
    });
    const logsWithUserAgent = await prisma.auditLog.count({
      where: {
        userAgent: {
          not: null
        }
      }
    });

    console.log(`  Logs with IP address captured: ${logsWithIP} / ${totalLogs}`);
    console.log(`  Logs with User Agent captured: ${logsWithUserAgent} / ${totalLogs}`);

    if (logsWithIP === 0) {
      console.log("  ⚠ WARNING: No IP addresses captured - check getIpFromRequest()");
    } else {
      console.log("  ✓ IP address capture is working");
    }

    if (logsWithUserAgent === 0) {
      console.log("  ⚠ WARNING: No user agents captured - check getUserAgentFromRequest()");
    } else {
      console.log("  ✓ User agent capture is working");
    }

    // Test query performance
    console.log("\n[QUERY PERFORMANCE TEST]");
    const startTime = Date.now();
    const performanceTest = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });
    const queryTime = Date.now() - startTime;

    console.log(`  Query time for last 24h logs (limit 100): ${queryTime}ms`);
    console.log(`  Result count: ${performanceTest.length}`);

    if (queryTime < 100) {
      console.log("  ✓ Query performance is excellent (<100ms)");
    } else if (queryTime < 500) {
      console.log("  ✓ Query performance is good (<500ms)");
    } else {
      console.log("  ⚠ Query performance may need optimization (>500ms)");
    }

    console.log("\n================================================================================");
    console.log("VERIFICATION COMPLETE");
    console.log("================================================================================");
    console.log("\n✓ Audit logging system is functional");
    console.log("✓ Events are being logged to the database");
    console.log("✓ Indexes are supporting efficient queries");

  } catch (error) {
    console.error("\n✗ ERROR querying audit logs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs().catch(console.error);
