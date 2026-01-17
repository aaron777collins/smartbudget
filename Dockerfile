FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy DATABASE_URL for build time (required by Prisma, not actually used during build)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma Client with correct binary target for Debian
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ARG NEXTAUTH_SECRET=build-time-secret-will-be-replaced-at-runtime
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install OpenSSL 3 for Prisma (Debian Bookworm uses OpenSSL 3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and binaries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules/.bin ./node_modules/.bin

# Create uploads directory
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Install gosu for user switching
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*

# Create startup script to run as root first for migrations
RUN echo '#!/bin/bash\n\
set -e\n\
if [ "$SKIP_MIGRATIONS" != "true" ]; then\n\
  echo "Running Prisma migrations as root..."\n\
  npx prisma migrate deploy || echo "Migration failed or already applied"\n\
else\n\
  echo "Skipping migrations (SKIP_MIGRATIONS=true)"\n\
fi\n\
echo "Switching to nextjs user..."\n\
exec gosu nextjs node server.js' > /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/app/start.sh"]
