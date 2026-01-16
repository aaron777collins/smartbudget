import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    directUrl: process.env["DIRECT_URL"] || process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/smartbudget?schema=public",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/smartbudget?schema=public",
  },
});
