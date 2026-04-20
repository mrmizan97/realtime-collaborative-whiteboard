# Frontend — Offline

The promise: you can keep drawing when the network dies, and your edits sync cleanly when you reconnect. Yjs makes this almost free — our job is mostly to not screw it up.

## What this domain owns

- The `IndexeddbPersistence` provider.
- The "offline" / "reconnecting" / "synced" UI indicator.
- Cache eviction policy for old rooms.
- Sign-out cache purge (coordinated with `auth.md`).

It does NOT own:
- The WebSocket reconnect logic — that's `y-websocket`'s job; we just observe it. See `collaboration.md`.
- Any API caching — we don't do offline for `/api/*` routes.

## How it works (the Yjs version)

1. `IndexeddbPersistence(roomId, doc)` attaches to the `Y.Doc` on mount.
2. Every update to the doc is written to IndexedDB via the provider.
3. On next load, the provider hydrates the doc from IndexedDB *before* the WS provider connects.
4. When WS connects, Yjs's sync protocol exchanges state vectors and ships only the diffs both ways.

The CRDT handles merges. There's no "conflict resolution" UI because there are no conflicts — that's the whole point of Yjs.

## Provider order

```ts
const doc = new Y.Doc()
const local = new IndexeddbPersistence(roomId, doc)
await local.whenSynced               // <— matters
const ws = new WebsocketProvider(wsUrl, roomId, doc, { params: { token } })
```

We `await local.whenSynced` before opening WS. Otherwise a fast network can push an old state from the server before IndexedDB hydrates, and the user sees their own offline edits "disappear" for a few ms. Yjs would eventually merge them back, but the flicker is ugly.

## Storage model

IndexedDB database: `y-indexeddb`. Object stores per room. Each update is a row; `IndexeddbPersistence` also writes a periodic compacted state to keep row counts bounded.

We don't touch the DB directly. All reads/writes go through the provider.

## Connection status

A single Zustand store exposes `{ status: 'online' | 'reconnecting' | 'offline', sinceMs }`. It's driven by the WS provider's `status` events plus a timer:

- `connected` → `online`.
- `disconnected` → after 3s → `reconnecting`.
- `disconnected` → after 30s → `offline`.

The UI shows:
- `online`: nothing (maybe a small green dot).
- `reconnecting`: toast "Reconnecting…" with the elapsed time.
- `offline`: persistent banner "You're offline. Edits are saved locally." + a "Retry" button.

Never say "your changes might be lost". They won't. Yjs has this.

## Cache eviction

We don't want the IndexedDB to grow forever. Policy:

- Rooms not opened in 30 days → purge on next app load.
- Cap total IndexedDB usage at 200MB (estimated via `navigator.storage.estimate()`). If over, evict oldest rooms until under 150MB.
- User can manually "Clear cache" from settings (signs out of IndexedDB only; doesn't sign the user out).

Eviction runs on app load, not continuously. It's a one-shot check in `useEffect` at the top of the `(app)` layout.

## Sign-out

On sign-out: purge every room's IndexedDB entry. Same browser may be used by another person next. See `auth.md`.

## Things that will trip me up

- **Opening the same room in two tabs.** Yjs handles it via `BroadcastChannel` — both tabs see each other's edits even without WS. Good. But: both tabs write to IndexedDB. Provider handles the coordination, but it's worth knowing.
- **Private/incognito mode.** IndexedDB may be ephemeral or disabled. Feature-detect on mount; if unavailable, downgrade gracefully — show a "Private mode: edits won't save if you disconnect" notice and continue with just the WS provider.
- **Quota errors mid-edit.** If we hit the origin quota, `IndexedDB` writes start failing silently. Listen for `storage` errors on the provider and show a quota banner with the "Clear cache" action.
- **Hydrating before provider attach.** Don't call `doc.getMap('shapes')` and read values before `whenSynced`. You'll see an empty doc and the canvas will flash empty.
- **Long offline → 10MB+ update backlog.** On reconnect, the Yjs sync can transfer a chunky payload. It's fine, but show the "Syncing…" state instead of "Synced" until the provider reports `synced: true`.
- **Clock drift.** We don't use wall-clock time for anything ordering-related. Don't start.

## Invariants

- IndexedDB hydration completes before WS connects.
- No conflict-resolution UI exists or should ever exist. Yjs is authoritative.
- Sign-out purges the IndexedDB cache.
- Offline is a normal operating mode, not an error state.

## Files (planned)

```
lib/offline/
├── provider.ts         # IndexeddbPersistence setup + whenSynced helper
├── status.ts           # connection status store (online/reconnecting/offline)
├── eviction.ts         # quota check + old-room purge
└── purge.ts            # sign-out cache clear

components/collab/
└── ConnectionBanner.tsx
```
