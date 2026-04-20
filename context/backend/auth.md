# Backend — Auth

Auth is handled by NextAuth. The only thing here that's actually interesting is how we bridge NextAuth's session cookie to the realtime server, which lives on a different origin and can't read that cookie.

## Providers

- **Google OAuth** — primary sign-in for most users.
- **Email magic link** — secondary, for people who don't want to OAuth.
- **Anonymous guest** — custom NextAuth credentials provider that creates a short-lived user with `is_guest = true`. Guests can only join rooms that have `allow_anonymous = true`.

No password sign-in. Not worth the support burden for a portfolio project.

## Session strategy

Database sessions, not JWTs. Reasons:
- We need to revoke sessions when a user is kicked from a room or deletes their account.
- Database sessions are trivial with the Prisma adapter.
- The one place we *do* use a JWT is the room token, which is signed and short-lived.

## Room tokens (the realtime handshake)

The realtime server can't read the NextAuth session cookie (different origin, even with credentials). So:

1. Client hits `POST /api/rooms/:id/token` on the Next.js app with its session cookie.
2. Server verifies the session, loads the user's role for that room.
3. If authorized, server returns a JWT with:
   ```
   {
     sub: user_id,
     room_id,
     role: "owner" | "editor" | "viewer" | "guest",
     exp: now + 60 seconds
   }
   ```
4. Client passes this JWT in the WS connection query string or subprotocol header.
5. Realtime server verifies the signature and expiry, then opens the connection.

**Key rule:** the token is scoped to a single room. A user with access to two rooms holds two tokens.

## The shared secret

Both services sign/verify the token with the same HMAC secret (env var `REALTIME_JWT_SECRET`). It's 32+ random bytes, lives in both services' env, and gets rotated manually when needed (no rotation automation in v1).

## Rate limiting on auth endpoints

- `/api/auth/signin/email` — 5 requests per IP per hour (Upstash Ratelimit).
- `/api/rooms/:id/token` — 30 requests per user per minute. If someone is re-requesting this more than once every two seconds, something's wrong on the client.

## Guest accounts

- Created on-demand when someone visits a room that allows anonymous and they don't have a session.
- Stored in `users` with `is_guest = true` and no email.
- Garbage-collected after 30 days of inactivity via a cron (later; not v1).
- Guests can't own rooms or invite others.

## Things that will bite us

- **Session cookie SameSite.** If we ever put the web app and the marketing site on different subdomains, we need `SameSite=Lax` and `Domain=.canvasly.app` (or equivalent). Default `Lax` on root domain is fine for now.
- **Magic link expiry.** NextAuth default is 24 hours; leaving it. Shorter makes testing annoying.
- **Token clock skew.** If the realtime server's clock drifts, valid tokens will look expired. Keep NTP on both hosts; not worrying about this further.

## What lives where

- NextAuth config: `apps/web/src/lib/auth.ts`
- Room token issuance: `apps/web/src/app/api/rooms/[id]/token/route.ts`
- JWT utilities (sign/verify): `packages/shared/src/jwt.ts`
- Guest session creation: `apps/web/src/lib/auth/guest.ts`
- Realtime token verification: `apps/realtime/src/auth.ts`
