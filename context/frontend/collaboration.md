# Frontend — Collaboration

How the client side of realtime works. The heavy lifting is Yjs; our job is to wire it up correctly and not fight it.

## What this domain owns

- The `Y.Doc` per room and its provider stack.
- The awareness instance (cursors, selections, presence).
- The `UndoManager` scoped to the current user.
- The client → server reconnect handshake behavior.
- Per-user color assignment for cursors.

It does NOT own:
- Shape rendering (see `canvas.md`).
- Room membership or room-level ACL (see `rooms.md` — that's a server concern the client just displays).
- Offline persistence (see `offline.md`).

## Y.Doc shape

```
root (Y.Doc)
├── shapes: Y.Map<shapeId, Y.Map<prop, value>>
├── order:  Y.Array<shapeId>              // z-order, top of array = frontmost
├── groups: Y.Map<groupId, Y.Array<shapeId>>
└── meta:   Y.Map<string, any>            // room name, background, etc.
```

Rules:
- Every shape's props live in a nested `Y.Map` so fine-grained changes merge cleanly.
- Never replace a nested `Y.Map`. Mutate it in place.
- Z-order changes rewrite the `order` array. That's fine — it's cheap.

The schema lives in `lib/yjs/doc.ts`. Don't access the doc's internal maps from anywhere else — everything goes through helpers in that file.

## Providers

Stacked in this order (outermost first):

1. `IndexeddbPersistence` — persists every update locally. See `offline.md`.
2. `WebsocketProvider` — syncs with the realtime server.

Both providers attach to the same `Y.Doc`. They don't know about each other; Yjs handles the merge.

Important: mount providers inside `useEffect`, not at module scope. Module-scope providers leak across route changes in dev.

## Awareness

Awareness is Yjs's ephemeral channel — perfect for cursors and selection highlights that should never be persisted.

Our awareness state per user:

```ts
{
  user: { id, name, avatarUrl, color },
  cursor: { x, y } | null,
  selection: string[],   // shape ids
  viewing: boolean,      // false if tab is hidden
}
```

- We write our own entry on mount.
- We update `cursor` on pointer move, **throttled to 30Hz** client-side. Server-side there's another limit at 60Hz per connection — don't rely on it, throttle first.
- We read other users' entries with `awareness.on('change', ...)` and store them in a local (non-Yjs) `Map` so the cursors overlay can render them.
- On tab visibility change, we flip `viewing: false` so other users' UIs can gray out our avatar.

## Undo/Redo

`UndoManager` with `trackedOrigins: new Set([localOrigin])`. Every local write tags its transaction with `localOrigin`; every remote update arrives with a different origin.

Consequence: **undo only touches your own edits.** A teammate moving the rectangle you drew is not something you can undo away, by design.

Rules:
- Every local write wraps in `doc.transact(fn, localOrigin)`.
- Remote writes (from the WS provider) never pass the local origin.
- Undo stack caps at 100 entries; after that we drop the oldest.

## Reconnect behavior

y-websocket handles reconnect for us. What we layer on top:

- Show a "Reconnecting…" toast after the socket has been down for >3s.
- On successful reconnect, dismiss the toast and briefly flash a "Synced" pill.
- If reconnect fails for >30s, show a banner with a manual "Retry" button.
- We do NOT show "offline" as an error. Offline is a first-class mode — see `offline.md`.

## Color assignment

Cursor colors come from a 12-color palette hashed on `user.id`. Stable across sessions, no negotiation needed. Helper in `lib/yjs/colors.ts`.

Do NOT negotiate colors via awareness. It works in the happy path and collapses under reconnect storms. Hash-based is boring and correct.

## Things that will trip me up

- **Writing shape props outside a transaction.** Every local mutation must be inside `doc.transact(fn, localOrigin)`, otherwise the UndoManager can't group them and remote peers see a flurry of one-prop updates instead of a single coherent change.
- **Subscribing to the whole doc in a component.** A `useSyncExternalStore` on the whole `Y.Doc` will re-render on every remote cursor move. Subscribe to the specific `Y.Map` or `Y.Array` you care about, or better: don't subscribe and let the canvas loop read directly.
- **Awareness state leaking across rooms.** Awareness is per-provider. If we reuse a provider across rooms (don't), the awareness channel will mix users. Always tear down and remount on room change.
- **`y-websocket` sync storms on open.** On first connect, sync step 1 can transfer a big state vector. Snapshot the doc server-side often enough (see backend `persistence.md`) that this stays fast.
- **Two tabs, same user.** Same `user.id` but different awareness clientIDs, so they show as two cursors. Either dedupe by user id in the overlay, or accept it. We accept it in v1.

## Invariants

- All canvas state is in the `Y.Doc`. Nothing duplicates it in React.
- Awareness is ephemeral — never write it to disk, never send it to the API.
- Local writes always carry `localOrigin`; remote writes never do.
- One `Y.Doc` per room, torn down on room unmount.

## Files (planned)

```
lib/yjs/
├── doc.ts              # Y.Doc schema, shape helpers
├── provider.ts         # WS + IndexedDB provider setup
├── awareness.ts        # awareness payload type + helpers
├── undo.ts             # UndoManager wiring
└── colors.ts           # palette + hash

hooks/
├── useYjsDoc.ts
├── useAwareness.ts
└── useUndoManager.ts

components/collab/
├── CursorsOverlay.tsx
├── PresenceAvatars.tsx
└── ReconnectToast.tsx
```
