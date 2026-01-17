import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate SSL/TLS configuration in production
function validateDatabaseSecurity() {
  const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build"
  const databaseUrl = process.env.DATABASE_URL || ""

  // Skip validation for development/test/build environments
  if (isDevelopment || isBuildTime) {
    return
  }

  // In production, enforce SSL/TLS for database connections
  const hasSSL = databaseUrl.includes("sslmode=")
  const isLocalhost = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")

  // Allow localhost connections in production (for some deployment scenarios)
  // but warn about it
  if (isLocalhost) {
    console.warn(
      "⚠️  WARNING: Database connection is using localhost in production environment. " +
      "This is only acceptable for single-server deployments. " +
      "For cloud/distributed deployments, use a managed database with SSL."
    )
    return
  }

  // For remote databases in production, SSL is REQUIRED
  if (!hasSSL) {
    throw new Error(
      "❌ SECURITY ERROR: Database connection MUST use SSL/TLS in production. " +
      "Add ?sslmode=require (or verify-ca/verify-full) to your DATABASE_URL. " +
      "Example: postgresql://user:pass@host:5432/db?sslmode=require"
    )
  }

  // Check SSL mode strength
  if (databaseUrl.includes("sslmode=disable")) {
    throw new Error(
      "❌ SECURITY ERROR: SSL is explicitly disabled (sslmode=disable). " +
      "Production databases must use SSL. Use sslmode=require at minimum."
    )
  }

  // Warn about weak SSL modes
  if (databaseUrl.includes("sslmode=require") && !databaseUrl.includes("sslmode=verify")) {
    console.warn(
      "⚠️  SECURITY WARNING: Using sslmode=require skips certificate verification. " +
      "For better security, consider using sslmode=verify-ca or sslmode=verify-full."
    )
  }

  // Success - SSL is properly configured
  if (databaseUrl.includes("sslmode=verify-full")) {
    console.log("✅ Database security: SSL/TLS with full certificate verification enabled")
  } else if (databaseUrl.includes("sslmode=verify-ca")) {
    console.log("✅ Database security: SSL/TLS with CA verification enabled")
  } else {
    console.log("✅ Database security: SSL/TLS enabled (basic)")
  }
}

// Run validation before creating Prisma client
validateDatabaseSecurity()

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
