# Frontend — Rooms

The room management UI: listing, creating, sharing, and configuring rooms. Boring CRUD, mostly — the interesting part is the share flow.

## What this domain owns

- `/dashboard` — the list of rooms the user has access to.
- The "New room" dialog.
- The share dialog (link + role picker).
- Room settings drawer (name, visibility, member list, role changes).
- The "recently opened" shortcut list.

It does NOT own:
- The canvas itself — see `canvas.md`.
- Room state once opened (shapes, presence) — see `collaboration.md`.
- ACL enforcement — server's job. The client just renders what it's told.

## Dashboard

Server-component page. Fetches via `/api/rooms/mine` during render, streams the list.

Row shape:
```
{ id, slug, name, role, lastOpenedAt, memberCount, thumbnailUrl? }
```

- `lastOpenedAt` drives sort order by default.
- Thumbnails are generated server-side from the latest snapshot (stretch goal — v1 shows a colored initial tile).
- Empty state: big friendly "Create your first room" CTA.

The dashboard does NOT subscribe to realtime updates. If someone adds you to a room, you'll see it on next navigation. Polling on a dashboard is waste.

## Creating a room

Minimal dialog — just a name field. Everything else is picked up later in settings.

Flow:
1. `POST /api/rooms` with `{ name }`.
2. Server returns `{ id, slug }`.
3. Client navigates to `/r/:slug`.

No optimistic creation. The server generates the slug, and we want the canonical URL before showing the canvas.

## Share dialog

Three things in the share dialog:

1. **Link** with a copy button. URL includes the slug; role derives from visibility.
2. **Visibility selector**: `private` | `unlisted` | `public`.
3. **Member list** with role dropdowns and a "remove" action (owners only).

UX rules:
- Copying the link shows a toast. Keyboard-friendly (focus returns to the button).
- Changing visibility is an immediate `PATCH`, not a save-button flow. Toast confirms.
- Role changes and removes are immediate too, but show a native confirm for "remove".

## Settings drawer vs. page

The BRD says `/r/:slug/settings` is a route. I've been going back and forth — a drawer on the canvas is nicer (no context loss) but a route is more linkable.

Decision: **drawer for v1.** Route added later if we need deep-linking to settings. The drawer mounts the same components either way, so the migration is cheap.

## Recently opened

Stored in `localStorage` under `canvasly:recent`. Array of `{ id, slug, name, openedAt }`, capped at 10. Updated on room open. Shown on the dashboard above the full list for muscle memory.

This is UI convenience only — the server's `/api/rooms/mine` is always the source of truth for what you actually have access to.

## Things that will trip me up

- **Stale member list after someone's role changes.** The settings drawer fetches on open and doesn't subscribe to changes. If two owners edit roles simultaneously, the second owner sees stale data until they close and reopen the drawer. Acceptable for v1.
- **Copying links during SSR.** `navigator.clipboard` isn't available server-side — copy button needs `'use client'` and a `window` check.
- **Slug collisions on create.** Server handles retry; client just trusts the returned slug. Don't generate slugs on the client.
- **Dashboard over-fetching.** Server component caches with `revalidate: 0` because membership changes need to be immediate. Don't accidentally add ISR here.
- **Guest users on `/dashboard`.** Guests never get here (middleware blocks), but a signed-out owner viewing a shared link should also not be bounced to dashboard on sign-in — `callbackUrl` carries the room slug through.

## Invariants

- Server is the source of truth for membership and roles. The client renders what the API returns.
- Room creation is server-authoritative; no optimistic creation.
- The recent-rooms list is a UX shortcut, not an access list. Opening a room still goes through the server ACL.
- Visibility and role changes are immediate (no save button).

## Files (planned)

```
app/(app)/
├── dashboard/
│   ├── page.tsx                # server: fetch /api/rooms/mine
│   ├── RoomList.tsx            # client: sorts, filters
│   └── NewRoomDialog.tsx
└── r/[slug]/
    ├── page.tsx                # mounts the canvas
    ├── ShareDialog.tsx
    ├── SettingsDrawer.tsx
    └── MemberList.tsx

lib/rooms/
├── api.ts                      # fetch helpers
└── recent.ts                   # localStorage shortcut list
```
