# Backend — Rooms

A "room" is the thing you share a link to. One room = one `Y.Doc`. Rooms own members, access rules, and a pile of snapshots.

## The data model

```
rooms
  id          uuid, pk
  slug        short unique string (used in URLs)
  name        string, user-editable
  owner_id    fk → users
  visibility  "private" | "unlisted" | "public"
  allow_anon  bool (can anonymous guests edit?)
  created_at
  updated_at

room_members
  room_id     fk → rooms
  user_id     fk → users
  role        "owner" | "editor" | "viewer"
  created_at
  (room_id, user_id) is the primary key
```

## Visibility rules

- **private** — only listed members can open it. No guests even if `allow_anon = true`.
- **unlisted** — anyone with the link can open it. If `allow_anon = true`, they can edit without signing in; otherwise they must sign in first.
- **public** — listed in the (future) public gallery. Same access rules as unlisted otherwise.

In v1 we build private and unlisted. Public is a flag that exists in the schema but no UI yet.

## The ACL check

This runs at two points:
1. When issuing a room token (before WS).
2. On each WS frame, re-checked against a cached role (5-minute TTL).

```ts
function canOpen(user, room, member):
  if room.visibility === 'public' or room.visibility === 'unlisted':
    if member: return member.role
    if room.allow_anon: return 'guest' (editor-level if editor, else viewer)
    return 'viewer'
  if room.visibility === 'private':
    if !member: return null (403)
    return member.role
```

The cached role invalidates immediately when the server receives a `room-member-changed` pubsub event from Redis.

## API surface

```
GET    /api/rooms                 list rooms I'm a member of
POST   /api/rooms                 create a room { name }
GET    /api/rooms/:id             room details (with my role)
PATCH  /api/rooms/:id             update name, visibility, allow_anon
DELETE /api/rooms/:id             delete (owner only)
POST   /api/rooms/:id/token       issue realtime JWT
GET    /api/rooms/:id/members     list members (owner/editor can see)
POST   /api/rooms/:id/members     invite by email
PATCH  /api/rooms/:id/members/:uid  change role
DELETE /api/rooms/:id/members/:uid  remove member
```

All responses Zod-validated. Input too.

## Invitation flow

1. Owner submits email + role.
2. If that email matches an existing user, add them to `room_members` immediately and send a "you've been invited" email.
3. If not, create a row in `pending_invites (room_id, email, role, token, expires_at)` and email a signup link.
4. On first sign-in with a matching email, consume the invite and add to `room_members`.

Invites expire after 7 days. Not doing a dedicated invite-revoke UI in v1 — the owner can delete the pending invite row via the API.

## Deleting a room

- Owner-only.
- Cascades: delete `room_members`, `snapshots`, `update_log`, `audit_log`, `pending_invites`.
- No soft-delete. If someone wants their stuff back, they can re-create the room.

## Share links

The share link is just `https://canvasly.app/r/:slug`. The slug is a 10-char base62 id generated at room creation. It's not secret — the ACL is what gates access, not the URL.

For "unlisted + allow_anon", the URL is effectively the access control, so we rate-limit slug guessing: 20 attempts per IP per minute on `/r/:slug` before returning 429.

## Audit log (lightweight)

We log these:
- Room created / deleted / renamed
- Visibility changed
- Member invited / role changed / removed
- Snapshot manually restored

Not logging every shape edit — that's what Yjs is for. Keep the audit log to things that matter legally or for debugging access issues.

## Things to watch

- **Race on invite acceptance.** If two invite links arrive for the same email and the user clicks both, we need to dedupe. Use `ON CONFLICT DO NOTHING` on `room_members` insert.
- **Slug collisions.** With 10-char base62 at scale it's fine, but we still retry on unique-constraint violation (max 3 times) and return 500 after.
- **Role downgrade while connected.** If an editor gets demoted to viewer, the realtime server needs to drop their write capability within seconds. The 5-min ACL cache is too slow — use Redis pubsub `room:{id}:member-changed` to invalidate immediately.

## Files

- Routes: `apps/web/src/app/api/rooms/**`
- Prisma models: `packages/shared/prisma/schema.prisma`
- ACL logic: `packages/shared/src/acl.ts` (imported by both web and realtime)
- Slug generator: `apps/web/src/lib/slug.ts`
