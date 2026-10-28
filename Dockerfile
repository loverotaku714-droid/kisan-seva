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
# CRITICAL: container runtimes (Render/k8s) inject HOSTNAME=<pod-name>, which makes
# Next.js standalone bind to the pod IP instead of 0.0.0.0 — public router then
# cannot connect and every request returns an instant 502. Force 0.0.0.0.
ENV HOSTNAME="0.0.0.0"
# SQLite lives on /app/db — mount a volume here for persistent data
ENV DATABASE_URL=file:/app/db/custom.db

EXPOSE 3000

# Ensure the db directory exists, sync schema (no-op when unchanged), then serve.
# Inline HOSTNAME=0.0.0.0 is a belt-and-suspenders override: runtime-injected
# HOSTNAME (pod name) can take precedence over the Dockerfile ENV on k8s.
CMD ["sh", "-c", "mkdir -p /app/db && bunx prisma db push --skip-generate && HOSTNAME=0.0.0.0 bun .next/standalone/server.js"]
