# Backend — Persistence

We persist two kinds of Yjs data: **snapshots** (the full state at a point in time) and **updates** (the incremental diffs between snapshots). Together they let us reconstruct any room's state and optionally walk its history.

## Why two tables instead of one

You could just keep appending updates forever and never snapshot. Yjs can replay them. But:

- Load time grows linearly with edit count. Bad.
- State grows unboundedly.
- One corrupted update poisons the whole replay.

You could also just overwrite a single row with the latest state. But then you can't jump back to an earlier point for the history feature, and you lose fine-grained audit ability.

So: snapshots + a trailing update log. Standard Yjs pattern.

## Schema

```
snapshots
  id           uuid, pk
  room_id      fk → rooms
  yjs_state    bytea  (Yjs encoded doc state)
  version      int    (monotonic per room)
  created_at

update_log
  id            uuid, pk
  room_id       fk → rooms
  snapshot_id   fk → snapshots  (the snapshot this update follows)
  yjs_update    bytea  (encoded update)
  origin_user   fk → users (nullable for guests)
  created_at

-- indexes
  snapshots(room_id, version desc)
  update_log(room_id, created_at)
```

## Write path

### On every Yjs update received by the realtime server:
1. Broadcast to peers (already done by y-websocket relay).
2. Push into an in-memory buffer for this room.
3. Start or reset the 2-second debounce timer.

### When debounce fires OR buffer hits 50 updates:
1. Take everything from the buffer (swap, don't await).
2. `INSERT ... VALUES` into `update_log` — one row per update, batched in a single SQL statement.
3. Increment the in-memory "updates since last snapshot" counter.
4. If counter ≥ 500, trigger a snapshot write (next step).

### Snapshot write:
1. Encode the current `Y.Doc` state via `Y.encodeStateAsUpdate(doc)`.
2. `INSERT` a new snapshots row with `version = prev + 1`.
3. In the same transaction, delete `update_log` rows where `snapshot_id` is the previous snapshot and `created_at <= snapshot.created_at`.
4. Reset the counter.

If any step fails, log it and retry with exponential backoff. Do not block the WS event loop.

## Read path

### On room open (first connection):
1. Fetch the latest snapshot for the room (`ORDER BY version DESC LIMIT 1`).
2. Fetch all `update_log` rows with that `snapshot_id`, ordered by `created_at`.
3. Apply snapshot to a fresh `Y.Doc`, then apply each update in order.
4. Hold that doc in memory for the room's lifetime.

### Sync with a joining client:
1. Client sends sync step 1 (their state vector).
2. Server computes the diff via `Y.encodeStateAsUpdate(doc, clientStateVector)`.
3. Server sends sync step 2 with the diff.
4. Client applies it. They're now in sync.

## History / time travel

For the "jump back 30 days" feature:

- Every snapshot is a restore point.
- We keep snapshots indefinitely for 30 days, then prune (future cron job).
- UI shows a list of snapshots by `created_at`.
- Clicking one loads that snapshot into a preview view (read-only).
- "Restore" creates a **new** snapshot that's a copy of the chosen one and makes it current. Original updates remain in the log, but new updates follow from the restored snapshot.

Not doing per-edit history. Granularity is snapshot-level.

## Garbage collection (future cron)

Not in v1, but sketching so I don't forget:

- Nightly job walks rooms with snapshots older than 30 days.
- Keeps: latest snapshot, one snapshot per day for the last 7 days, one per week beyond that.
- Deletes everything else in the same room.
- `update_log` rows are already collapsed into snapshots, so there's nothing to GC there.

## Backup strategy

Neon has PITR (point-in-time recovery) on the paid tier. On free tier we rely on daily backups.

For local dev: a `pnpm db:backup` script that `pg_dump`s to a gitignored folder. Handy for reproducing bugs.

## What this domain does NOT own

- Snapshot encoding/decoding logic — that's Yjs, we just call `encodeStateAsUpdate` and `applyUpdate`.
- Broadcast — that's `realtime.md`.
- The document's shape model — that's `frontend/canvas.md` defining the `Y.Map` structure.

## Gotchas I've already thought about

- **Big snapshots.** A busy room could hit MB-sized snapshots. Postgres `bytea` handles this fine but slow to fetch. Consider moving large snapshots to R2 at some size threshold (e.g. 1MB) in the future. Not v1.
- **Partial write.** If the snapshot insert succeeds but the update_log delete fails, you have duplicates. Wrap in a transaction and if it fails, don't update the "last snapshot" marker — try again next cycle.
- **Cold-start latency.** Fetching + replaying 500 updates on room open is slow. If we consistently see >200ms cold starts, lower the snapshot threshold from 500 to 100 updates.
- **Disk growth.** Updates are small but they add up. Monitor Postgres storage. Free tier Neon is 0.5GB; that's my first ceiling.

## Files

- `apps/realtime/src/persistence.ts` — write path
- `apps/realtime/src/loader.ts` — read path on room open
- `packages/shared/prisma/schema.prisma` — snapshots/update_log models
- `apps/web/src/app/api/rooms/[id]/history/route.ts` — history list for UI
- `apps/web/src/app/api/rooms/[id]/history/restore/route.ts` — restore endpoint
