# Frontend — Auth

Client-side auth is thin. NextAuth does the heavy lifting; the frontend just drives the UI and reads the session. See backend `auth.md` for the server half.

## What this domain owns

- The sign-in page and provider buttons.
- Session hydration into the app (via `SessionProvider`).
- The "current user" Zustand store (a light mirror of the session).
- Protected-route redirect logic.

It does NOT own:
- NextAuth handlers — those live in `app/api/auth/[...nextauth]/`.
- Room-level ACL — that's a backend concern (`rooms.md`).
- JWT issuance for the realtime server — client just requests it.

## Sign-in flow

1. User lands on `/sign-in` (or is bounced there from a protected route).
2. Two provider buttons: Google, email magic link.
3. On success, NextAuth sets its cookie and redirects back to `callbackUrl` (default `/dashboard`).
4. The `(app)` layout reads the session server-side and renders the app shell.

If the user lands on a protected route while unauthenticated, the middleware redirects to `/sign-in?callbackUrl=<original>`.

## Session handling

- **Server components** read the session with `auth()` (NextAuth v5 helper) — no hydration needed.
- **Client components** get the session via `useSession()` from `SessionProvider`, which we mount in the `(app)` layout only.
- A small Zustand store (`useUser`) mirrors `{ id, name, email, avatarUrl }` from the session for non-React consumers (e.g. the canvas awareness payload).

The Zustand mirror is set once on session load. It's not two-way — if NextAuth's session changes, we update the store; never the reverse.

## Protected routes

Everything under `(app)` requires a session. We enforce this in two places:

1. `middleware.ts` — catches unauthenticated requests and redirects before any rendering.
2. `(app)/layout.tsx` — server component calls `auth()` and redirects if null, as a belt-and-braces check.

Duplication is intentional. Middleware is fast but can be bypassed if misconfigured; the layout check is the backstop.

## Anonymous guests

Some rooms allow anonymous access (see backend `rooms.md` for the policy). On the client:

- Anonymous users skip sign-in and get a generated display name (`Guest-XXXX`) and a palette color.
- The guest identity lives in a signed cookie set by the API when they first hit a public room.
- Guests can never reach `/dashboard`; that's signed-in only.

UX: show a "Sign in to save your work" banner persistently on the canvas for guests.

## Realtime token

Before connecting to the realtime server, the client fetches a short-lived JWT:

```
GET /api/rooms/:id/token  → { token, expiresAt }
```

- Token lives ~60 seconds; we refresh ~15s before expiry.
- Token is passed in the WS connect URL as `?token=<jwt>`.
- If the server rejects it (1008), we fetch a fresh token and reconnect once. If that fails too, bounce to `/sign-in`.

Token refresh logic lives in `lib/yjs/provider.ts`, not here — this domain just owns the fetch helper.

## Sign-out

- Button in the user menu → `signOut({ callbackUrl: '/' })`.
- On sign-out we also clear the `useUser` Zustand store and the local IndexedDB room caches (see `offline.md`). Leaving cached docs behind on a shared machine is a real leak.

## Things that will trip me up

- **Using `useSession()` above the `(app)` layout.** `SessionProvider` only wraps `(app)`. Marketing routes don't have it; calling `useSession` there throws.
- **Reading the Zustand store before it's hydrated.** On first render, the store is empty. Either gate on `session.status === 'authenticated'` or read the session directly.
- **Trusting the client session on the realtime server.** We don't. The JWT is the handshake; every frame re-checks the cached role. See backend `realtime.md`.
- **Leaking the IndexedDB cache on sign-out.** IndexedDB is per-origin, not per-user. Two users sharing a laptop will see each other's cached rooms if we forget to purge.
- **Magic link emails in dev.** They go to the log, not email. Grep the realtime server logs or use Mailpit if we wire it up.

## Invariants

- Protected routes are enforced in middleware AND the layout. Never one or the other.
- The client never stores a long-lived auth token. Realtime JWTs live in memory only.
- Sign-out purges IndexedDB room caches.
- The `useUser` store is a read-only mirror of the NextAuth session.

## Files (planned)

```
app/
├── sign-in/
│   └── page.tsx          # provider buttons
├── api/auth/[...nextauth]/route.ts
└── (app)/layout.tsx      # SessionProvider + server-side auth guard

lib/auth/
├── client.ts             # fetch helpers: /token, /me
├── guest.ts              # anon guest identity handling
└── store.ts              # useUser Zustand store

middleware.ts             # redirect-to-sign-in
```
