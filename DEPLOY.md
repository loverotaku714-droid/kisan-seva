# 🚀 Deploying Kisan Seva Live

The site runs anywhere Node.js (or Docker) runs. Below are four paths, from easiest
to most flexible. All of them start from the GitHub repo — no code changes needed.

**Environment variables used in production:**

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | `file:/data/custom.db` | SQLite location (keep on a persistent disk) |
| `AUTH_SECRET` | recommended | any long random string | Signs login session cookies (falls back to a dev default) |
| `HOSTNAME` | recommended (Render) | `0.0.0.0` | Forces Next.js standalone to bind all interfaces — without it Render returns 502 |
| `ZAI_API_KEY` | for AI answers | your key | Enables voice answers (`/api/ask`) + photo diagnosis (`/api/diagnose`). Without it those features return a friendly fallback |
| `ZAI_BASE_URL` | optional | `https://api.z.ai/api/paas/v4` | Any OpenAI-compatible endpoint (this default = Z.ai public API) |
| `ZAI_MODEL` | optional | `glm-4.5-air` | Text-chat model (server default if omitted) |
| `ZAI_VISION_MODEL` | optional | `glm-5v-turbo` | Vision model for the Crop Doctor |
| `NODE_ENV` | auto | `production` | Set automatically by most hosts |

---

## Option A — Railway (easiest full-stack host)

Railway runs the build + keeps SQLite data on a volume.

1. Go to [railway.com](https://railway.com) → **New Project → Deploy from GitHub repo** → pick `kisan-seva`
2. Railway auto-detects Next.js. Add these settings:
   - **Build command:** `npm install && npx prisma generate && npm run build`
   - **Start command:** `mkdir -p /data && DATABASE_URL=file:/data/custom.db npx prisma db push --skip-generate && DATABASE_URL=file:/data/custom.db node .next/standalone/server.js`
3. **Variables:** add `AUTH_SECRET` (any long random string)
4. **Volumes:** add a volume mounted at `/data` (so the database survives restarts)
5. **Settings → Networking → Generate Domain** → your public URL 🎉

## Option B — Render

1. Go to [render.com](https://render.com) → **New → Web Service** → connect the GitHub repo
2. **Runtime:** Docker (it will use the included `Dockerfile`) — or if you prefer the Node runtime, set:
   - **Build command:** `npm install && npx prisma generate && npm run build`
   - **Start command:** `npm run start` (starts with plain `node` — no bun needed)
3. **Environment:** `DATABASE_URL=file:/opt/render/project/src/db/custom.db`, `AUTH_SECRET=…`
4. Deploy → public URL.

> Note: on Render's free tier the filesystem is ephemeral — the database resets on
> each deploy/restart. Fine for demos; use Option A or D for persistent data.

## Option C — Vercel (best CDN, but read the caveat)

1. Go to [vercel.com/new](https://vercel.com/new) → **Import** the GitHub repo
2. Vercel auto-detects Next.js — just add env var `AUTH_SECRET`
3. Deploy.

> ⚠️ **Caveat:** Vercel is serverless — there is no persistent disk, so the SQLite
> file (accounts, saved questions) resets on every deploy. Voice/AI/weather/bulletin
> features work perfectly; only stored data is ephemeral. For full persistence on
> Vercel, migrate Prisma to [Turso](https://turso.tech) (libSQL) or Postgres first.

## Option D — Docker (any VPS / Fly.io / your own server)

A production `Dockerfile` is included:

```bash
docker build -t kisan-seva .
docker run -d -p 3000:3000 -v kisan-db:/app/db -e AUTH_SECRET=change-me kisan-seva
```

Then open `http://<your-server>:3000`. Put Nginx/Caddy in front for HTTPS, or push
the image to Fly.io / Google Cloud Run / Azure Container Apps.

## Option E — Render Blueprint (zero-config)

A `render.yaml` blueprint is included: on Render choose **New + → Blueprint**
instead of Web Service — Render reads `render.yaml` and configures the Docker
runtime, health check and environment variables automatically.

---

## Speech recognition note

Farmers' **microphone input (STT)** uses the browser Web Speech API, which Chrome
and Edge provide over **HTTPS** — all four options above serve HTTPS automatically.
Typed questions work in every browser as a fallback, and spoken answers (TTS) work
everywhere.
