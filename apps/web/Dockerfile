# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl (required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/web
RUN npx prisma generate

# Build Next.js
# For NextAuth and Prisma validation during build
ENV AUTH_SECRET=dummy_secret_at_least_32_characters_long_for_build
ENV DATABASE_URL="file:./prisma/aporte.db"
RUN pnpm --filter web build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl (required for Prisma runtime on Alpine)
RUN apk add --no-cache openssl

# Copy necessary files from builder
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

# Copy Prisma schema and database for migrations/runtime
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

EXPOSE 3000

# Start script should handle migrations and start
CMD ["sh", "-c", "cd apps/web && echo 'Starting DB Sync...' && npx prisma db push --accept-data-loss && echo 'DB Sync Complete. Starting App...' && npm start"]
