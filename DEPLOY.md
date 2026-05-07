# Canvasly — Production deployment

Live free-tier deploy across **Vercel** (web) + **Render** (realtime WebSocket) + **Neon** (Postgres).

## 🌐 Live URLs

| Component | URL |
|---|---|
| Web app | https://canvasly-web-two.vercel.app |
| Sign-in | https://canvasly-web-two.vercel.app/sign-in |
| Realtime WS | wss://canvasly-realtime.onrender.com |

## 👤 Seeded users

The dev-credentials provider is enabled in production for testing. Random
passwords are injected at seed time via `SEED_ADMIN_PASSWORD` /
`SEED_USER_PASSWORD` env vars (see Neon section). Passwords themselves are
**not committed** — get them from whoever ran the most recent seed.

| Email | Role |
|---|---|
| `admin@canvasly.dev` | admin (owner of `team-retro`, `public-demo`) |
| `alice@canvasly.dev` | user (owner of `design-sprint`) |
| `bob@canvasly.dev` | user (member of `team-retro`) |
| `carol@canvasly.dev` | user (member of `team-retro`) |

## 🏗️ Architecture

```
                                            ┌────────────────────┐
   user browser  ──── HTTPS ──────────────► │  Vercel  apps/web  │
       │                                    │  (Next.js 15 SSR)  │
       │                                    └─────────┬──────────┘
       │                                              │
       │                                              ▼
       │                                    ┌────────────────────┐
       │                                    │      Neon PG       │
       │                                    │   (ap-southeast-1) │
       │                                    └─────────▲──────────┘
       │                                              │
       │  WSS  ──────────────────────────────►┌────────────────────┐
       └──────────────────────────────────────│ Render apps/realtime│
                                              │ (ws + Yjs relay)   │
                                              └────────────────────┘
```

- Web reads/writes app data through Drizzle ORM directly to Neon
- Realtime hydrates Yjs docs from Neon snapshots, broadcasts updates over WebSockets, persists snapshots back to Neon
- Auth handshake: web mints a short-lived JWT (signed with `JWT_SECRET`), browser passes it to realtime over WS query string, realtime verifies with the same secret

## 🔐 Environment variables

**No real values are committed.** Set these in each platform's dashboard.

### Vercel (apps/web)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (use the `-pooler.` host) |
| `NEXTAUTH_SECRET` | 32+ random bytes, base64. `openssl rand -base64 32` |
| `JWT_SECRET` | **MUST match** the Render value exactly |
| `DEV_CREDENTIALS_LOGIN` | `"true"` to expose the dev login provider on prod (insecure for real use) |
| `AUTH_TRUST_HOST` | `"true"` so NextAuth trusts the Vercel host header |
| `NEXT_PUBLIC_REALTIME_URL` | `wss://<render-domain>` — exposed to the client bundle |

Optional:
- `NEXTAUTH_URL` — only needed if `AUTH_TRUST_HOST` is unset
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — enables Google sign-in button

### Render (apps/realtime)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Same Neon pooled connection string as Vercel |
| `JWT_SECRET` | Same value as Vercel |
| `NODE_VERSION` | `20` |
| `NODE_ENV` | `production` |

Render auto-injects `$PORT`; the server reads it via the `REALTIME_PORT ?? PORT` fallback.

### Neon (one-time seed)

When running `pnpm db:seed` against the production DB, set:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `SEED_ADMIN_PASSWORD` | Random password for `admin@canvasly.dev` |
| `SEED_USER_PASSWORD` | Random password for `alice/bob/carol@canvasly.dev` |

Seed script prints the credentials it used. **Save them somewhere safe — they're not stored anywhere else.**

## ⚙️ Deploy commands

### Web (Vercel) — CLI deploy

The Vercel project has no GitHub integration; deploys are triggered by CLI from a local checkout.

```bash
# from repo root
vercel deploy --prod \
  --token=<VERCEL_TOKEN> \
  --scope=<VERCEL_TEAM_ID> \
  --yes
```

Project config (set via API once at create-time):
- `rootDirectory: "apps/web"`
- `framework: "nextjs"`
- `buildCommand`, `installCommand`, `outputDirectory`: all auto-detected
- `ssoProtection: null` (so the deployment is publicly reachable)

### Realtime (Render) — git auto-deploy

Render is connected to the GitHub repo (`mrmizan97/realtime-collaborative-whiteboard`) and auto-deploys on push to whichever branch is configured.

Build command:
```
corepack enable && pnpm install --frozen-lockfile=false --prod=false && pnpm --filter @canvasly/shared build && pnpm --filter @canvasly/realtime build
```

Start command:
```
node apps/realtime/dist/server.js
```

Manual redeploy:
```bash
curl -X POST -H "Authorization: Bearer <RENDER_TOKEN>" \
  https://api.render.com/v1/services/<SERVICE_ID>/deploys \
  -d '{"clearCache":"do_not_clear"}'
```

### Database (Neon) — migrations + seed

```bash
cd packages/shared

# create / update schema
DATABASE_URL=<neon-url> pnpm db:migrate

# (re)seed users + rooms
DATABASE_URL=<neon-url> \
  SEED_ADMIN_PASSWORD=<random> \
  SEED_USER_PASSWORD=<random> \
  pnpm db:seed
```

## ⚠️ Known limitations of the free-tier deploy

- **Render free tier auto-sleeps** after ~15 min of no traffic. First WS connect after sleep takes ~30 s while the dyno wakes.
- **`DEV_CREDENTIALS_LOGIN=true` in production** is intentionally insecure — anyone who learns a seeded password can log in. Acceptable for a demo, not for real users. Disable by unsetting the env var and relying on Google OAuth or magic-link sign-in instead.
- **No origin check on the realtime WS server** — it accepts connections from any origin. Add an `Origin` header check in `apps/realtime/src/server.ts` if you publish a real domain.
- **Public anonymous room access** — middleware currently forces auth on `/r/*`, including `public` rooms. The BRD says guests should view public rooms without signing in; not yet implemented.
