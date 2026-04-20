# Backend — Realtime

This is where the interesting problems live. The realtime server's job is to keep every connected client's `Y.Doc` in sync with every other client in the same room, and to persist the state without blocking the live path.

## What a connection looks like

1. Client does `GET /api/rooms/:id/token` on the Next.js app, gets a 60-second JWT.
2. Client opens `wss://realtime.canvasly.app/?token=<jwt>&room=<id>`.
3. Server verifies the JWT, pulls the user's role from it (no DB hit here — we trusted `apps/web`).
4. Server finds or creates the in-memory room object, attaches the socket.
5. Server performs the Yjs sync handshake: sync step 1 → sync step 2 → awareness exchange.
6. Client and server exchange updates for as long as the socket is open.

## The in-memory room

Each active room has one entry in a `Map<roomId, Room>` on the server. The `Room` holds:

- The `Y.Doc` (authoritative copy for this process)
- A `Set<Connection>` of currently joined sockets
- The awareness object
- A debounce timer for snapshot writes
- An update counter (reset on snapshot write)

Rooms are created on first connection and destroyed when the last connection leaves and the debounce flush finishes.

## Message types

The `y-websocket` protocol gives us:
- `0x00` — sync step 1 (state vector exchange)
- `0x01` — sync step 2 (missing updates)
- `0x02` — update (the normal "here's a change" frame)
- `0x01` on awareness channel — cursor/presence

We don't invent new message types. If we need one, we pack it inside a Yjs `Y.Map` called `meta` so it rides the normal sync path.

## Authorization on every frame

The JWT got them in the door. But we also re-check on every write frame:

- Role cached per-connection when the socket opened.
- On `room:{id}:member-changed` Redis pubsub event, we invalidate and re-fetch.
- Viewers can send awareness but can't send updates. If they try, we close the socket with a 1008 policy-violation code.

## Awareness (cursors, selections)

- Broadcast to every other peer in the room.
- Never persisted. Ever. Awareness disappears when the user disconnects.
- Throttled on the client to 30Hz. Server passes through as-is.
- Payload contains: `{ user_id, name, color, cursor: {x,y}, selection: [shapeId...] }`.

## Persistence hooks

Two triggers cause a snapshot write:
1. 50 updates received since the last snapshot.
2. 2 seconds elapsed since the last update (debounce).

Whichever fires first. Snapshot write is async; updates keep flowing while it happens. See `persistence.md` for the exact write logic.

## Horizontal scale — how we'd do it (not v1)

Single node can hold a few hundred rooms easily. Once that's not enough:

- Use Redis pubsub as the fanout bus.
- Each node subscribes to `room:{id}:updates` for the rooms it has connections for.
- When a node receives an update, it publishes to Redis in addition to broadcasting locally.
- Other nodes with connections to that room receive via Redis and relay.
- Route clients to the node that already has their room open (sticky-session at the LB, or consistent hash).

All in `realtime.md` as future work; v1 is a single node.

## Failure modes

| Scenario | What happens |
|---|---|
| Client drops connection | Awareness entry expires after 30s. Room stays alive. |
| Last client leaves | After snapshot flush, room object is GC'd from memory. |
| Server crashes | Unflushed updates in memory are lost. Client re-sends on reconnect (Yjs is tolerant). Worst case: ~2 seconds of edits lost. |
| Postgres down | Snapshot writes fail silently and retry every 5s. In-memory state keeps working. If Postgres stays down >5min, we drop new connections. |
| Redis down (future) | Degrade to single-node behavior. Log loudly. |

## Metrics we care about

- Active connections (gauge)
- Active rooms (gauge)
- Updates per second (counter)
- Snapshot writes (counter, with success/failure labels)
- Snapshot write latency (histogram)
- WS connect failures by reason (counter)

Prometheus-style, scraped by a simple endpoint. Grafana Cloud free tier for dashboards.

## Things that will trip me up

- **Memory leaks in `Y.Doc`.** Yjs updates accumulate inside the doc unless you snapshot and re-create. Snapshot process needs to produce a fresh doc from the encoded state vector, not keep the old one around.
- **Awareness flood.** One misbehaving client sending 1000 cursor updates/sec can starve the room. Server-side rate limit at 60Hz per connection.
- **Auth cache staleness.** See `rooms.md` — invalidate on member change via pubsub.
- **Slow Postgres writes blocking the event loop.** Never `await` the snapshot write inline with a WS message handler. Always fire-and-forget with a queue.

## Files (planned)

```
apps/realtime/
├── src/
│   ├── server.ts          # HTTP + WS server setup
│   ├── auth.ts            # JWT verify
│   ├── room.ts            # Room class (in-memory state)
│   ├── persistence.ts     # snapshot/update log writers
│   ├── awareness.ts       # awareness throttling
│   ├── metrics.ts         # Prometheus counters/gauges
│   └── logger.ts          # Pino
├── Dockerfile
└── fly.toml (or railway.toml)
```
