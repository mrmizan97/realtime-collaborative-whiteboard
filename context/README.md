# Context Docs

These are the per-domain notes I keep so I don't have to re-figure things out every time I come back to a part of the codebase. They're written for me (and anyone else touching this) — not for a stakeholder. Expect opinions.

Each file covers one domain: what it owns, what lives in it, what the invariants are, and the stuff I've already tripped on so I don't do it again.

## Layout

```
context/
├── backend/
│   ├── overview.md       # how the backend pieces fit together
│   ├── auth.md           # sessions, sign-in, room tokens
│   ├── rooms.md          # room CRUD, membership, ACL
│   ├── realtime.md       # Yjs WebSocket server, presence, fanout
│   ├── persistence.md    # snapshots, update log, GC
│   └── export.md         # optional server-side rendering for exports
└── frontend/
    ├── overview.md       # app shell, routing, where state lives
    ├── canvas.md         # rendering, viewport, shape system
    ├── collaboration.md  # Yjs client, awareness, cursors
    ├── auth.md           # sign-in UI and session handling
    ├── rooms.md          # room list, create, share, settings
    ├── export.md         # PNG + SVG export on the client
    └── offline.md        # IndexedDB provider, reconnect behavior
```

## How to use these

- Starting work in a domain? Read its file first.
- Adding a new concept? Update the file. Don't let them drift.
- Invariants are non-negotiable. If you're about to break one, stop and think.
