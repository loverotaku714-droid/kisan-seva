# Kisan Seva — production container (bun + Next.js standalone + SQLite)
FROM oven/bun:1

WORKDIR /app

# 1) Install dependencies (cached layer — only re-runs when lockfile changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2) Copy the application source
COPY . .

# 3) Generate the Prisma client and build the standalone app
RUN bunx prisma generate && bun run build

ENV NODE_ENV=production
ENV PORT=3000
# SQLite lives on /app/db — mount a volume here for persistent data
ENV DATABASE_URL=file:/app/db/custom.db

EXPOSE 3000

# Ensure the db directory exists, sync schema (no-op when unchanged), then serve
CMD ["sh", "-c", "mkdir -p /app/db && bunx prisma db push --skip-generate && bun .next/standalone/server.js"]
