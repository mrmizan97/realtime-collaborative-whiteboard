# Canvasly

Real-time collaborative whiteboard. See `BRD.md` for requirements, `context/` for domain docs.

## Stack
- **apps/web** — Next.js 15 + NextAuth + Drizzle (Postgres). Deploy to Vercel.
- **apps/realtime** — Node + `ws` + Yjs. Deploy to Fly.io / Railway.
- **packages/shared** — Drizzle schema, Zod contracts, JWT helpers, seed scripts.

## One-command setup (local dev)

Requires: Node ≥ 20, **pnpm**, **Docker Desktop**.

```bash
cp .env.example .env          # defaults match docker-compose.yml
pnpm setup                    # install, start postgres, migrate, seed
pnpm dev:realtime             # terminal 1 — :4000
pnpm dev:web                  # terminal 2 — :3000
```

Then open **http://localhost:3000/sign-in**.

### Manual steps (if `pnpm setup` is too opinionated)

```bash
pnpm install
pnpm db:up           # starts Postgres in Docker (port 5432)
pnpm db:generate     # generate Drizzle SQL migrations
pnpm db:migrate      # apply them
pnpm db:seed         # create dummy users + rooms + sample shapes
```

## Dummy credentials

The seed script enables a dev-only email+password provider (gated by `DEV_CREDENTIALS_LOGIN=true` in `.env`). **Turn this off in any real environment.**

| Role  | Email                 | Password |
|-------|-----------------------|----------|
| Admin | `admin@canvasly.dev`  | `admin123` |
| User  | `alice@canvasly.dev`  | `user123`  |
| User  | `bob@canvasly.dev`    | `user123`  |
| User  | `carol@canvasly.dev`  | `user123`  |

## Seeded rooms

| Slug              | Visibility | Owner | Members                                  |
|-------------------|-----------|-------|------------------------------------------|
| `/r/team-retro`   | unlisted  | admin | alice (editor), bob (editor), carol (viewer) |
| `/r/design-sprint`| private   | alice | admin (editor), bob (viewer)             |
| `/r/public-demo`  | public    | admin | anyone with the link can view            |

Each room is pre-populated with a few shapes (stored as a Yjs binary snapshot in the `snapshots` table), so the canvas is not empty on first open.

## Common commands

```bash
pnpm db:up           # start Postgres container
pnpm db:down         # stop Postgres container
pnpm db:studio       # Drizzle Studio (browser DB inspector)
pnpm db:seed         # re-seed (idempotent — safe to re-run)
pnpm db:reset        # wipe all tables (careful)
```

## Multi-user test

1. Sign in as `admin@canvasly.dev` in browser A → navigate to `/r/team-retro`.
2. Open browser B (or incognito), sign in as `alice@canvasly.dev` → same room.
3. Draw, move, edit — updates sync in both tabs. Kill realtime server to test offline mode; restart to see IndexedDB catch up.

## Layout

```
apps/
├── web/        # Next.js app (auth, API, dashboard, canvas UI)
└── realtime/   # WebSocket server (Yjs relay, snapshot persistence)
packages/
└── shared/     # db schema, zod, jwt, password, seed scripts
context/        # domain context docs — read before touching a domain
```
