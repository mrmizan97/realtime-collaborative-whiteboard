# Backend Overview

The backend is split into two deployables because Vercel's serverless functions can't hold a long-lived WebSocket. That's the only reason the split exists. If Vercel ever supports durable WS, we collapse it.

## The two services

### `apps/web` — Next.js API routes (on Vercel)

Handles anything that's short-lived and request-response:

- Auth (NextAuth handlers)
- Room CRUD (create, list, rename, delete, settings)
- Membership (invite, change role, revoke)
- Issuing short-lived JWTs for the realtime service
- Stripe or similar, if it ever happens (not in v1)

Treat it like a boring Next.js app. Postgres via Prisma. No WebSocket code here.

### `apps/realtime` — Node WebSocket server (on Fly.io or Railway)

Holds all the live connections. Responsibilities:

- Accept WSS connections, validate the JWT from `apps/web`
- Run a `y-websocket` server per room
- Relay Yjs updates between peers in the same room
- Relay awareness messages (cursors, selections) — never persist these
- Debounce snapshot writes to Postgres (every 2s or 50 updates)
- Enforce the room ACL on every frame (don't trust the JWT alone if it's cached)

Reads from the same Postgres database as `apps/web` — shared `packages/shared` has the Prisma schema and generated types.

## Shared pieces

`packages/shared` holds:
- Prisma schema and generated client
- Zod schemas for API contracts
- TypeScript types for shape data, user roles, etc.
- Small utilities that both services need (e.g. JWT signing/verification)

Both services import from this package so the types can't drift.

## Data flow — the 60-second tour

1. User signs in on the Next.js app → NextAuth sets a session cookie.
2. User opens a room → Next.js API route checks ACL, returns a short-lived JWT.
3. Client connects WSS to the realtime server with the JWT.
4. Realtime server verifies JWT, loads latest snapshot from Postgres, sends to client.
5. Client merges with local IndexedDB state; sends any queued offline updates.
6. Both sides exchange Yjs updates via WS as users edit.
7. Realtime server batches updates and writes a snapshot periodically.
8. Realtime server broadcasts awareness (cursors) to peers, never to DB.

## What the backend does NOT do

- No canvas rendering on the server (export is client-side in v1).
- No AI features, no image OCR, no "smart" shape recognition.
- No email sending beyond magic links (NextAuth handles that).
- No background workers in v1. If we add BullMQ, it's a new deployable.

## Rules I'm holding myself to

- Every WS frame is authorized, not just the initial handshake.
- Snapshots are immutable once written. New snapshot = new row.
- The update log is truncated only after a successful snapshot write.
- Prisma migrations are the source of truth; no manual schema changes in prod.
- Every API response is Zod-validated on the way out too, not just in.

## Where to look next

- Auth flows → `auth.md`
- Room CRUD and ACL → `rooms.md`
- Yjs, presence, fanout → `realtime.md`
- Snapshots and update log → `persistence.md`
- Server-side export (optional) → `export.md`
