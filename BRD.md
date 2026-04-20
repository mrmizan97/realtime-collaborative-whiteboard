# Business Requirements Document (BRD)
## Collaborative Whiteboard (Figma-lite / Excalidraw-plus)

**Version:** 1.0
**Date:** 2026-04-20
**Status:** Draft

---

## 1. Executive Summary

A web-based collaborative whiteboard that lets multiple users draw, sketch, and diagram together in real time on an infinite canvas. The system solves the hard problem of conflict-free concurrent editing across unreliable networks using CRDTs, and differentiates itself from CRUD-style portfolio projects by proving mastery of real-time sync, presence, rendering performance, and offline-first architecture.

---

## 2. Goals and Non-Goals

### 2.1 Goals
- Real-time collaborative drawing with < 100ms perceived latency.
- Conflict-free concurrent edits using CRDTs (no "last write wins" data loss).
- Infinite pan/zoom canvas with smooth 60fps rendering up to ~10,000 shapes.
- Live presence: multi-cursor, user avatars, selection highlights.
- Offline support: edits made offline sync cleanly on reconnect.
- Export rooms to PNG and SVG.
- Shareable room links with role-based access (owner, editor, viewer).

### 2.2 Non-Goals (v1)
- Mobile-native apps (web-responsive is enough).
- Video/voice chat inside the room.
- Plugins / custom shape SDK.
- Enterprise SSO / SCIM.
- Version history beyond a 30-day audit trail.

---

## 3. Target Users

| Persona | Primary Need |
|---|---|
| Designer collaborating remotely | Fast sketching with a teammate on the same canvas |
| Engineer running a whiteboard interview | Shared canvas with low-friction onboarding |
| Educator running a live class | One host, many viewers, simple annotation |
| Product team doing a retro | Sticky notes, voting, grouping |

---

## 4. User Stories

### 4.1 Authentication & Rooms
- As a user, I can sign in with Google or email magic link.
- As a user, I can create a new whiteboard room and get a shareable URL.
- As a room owner, I can invite others as editor or viewer.
- As a guest, I can join a public room without signing in (read-only or anonymous edit based on room settings).

### 4.2 Canvas & Drawing
- As a user, I can pan (space+drag or trackpad) and zoom (pinch, ctrl+scroll) on an infinite canvas.
- As a user, I can draw rectangles, ellipses, diamonds, arrows, lines, free-hand strokes, and text.
- As a user, I can add sticky notes in multiple colors.
- As a user, I can select, move, resize, rotate, and delete shapes.
- As a user, I can multi-select with a drag rectangle.
- As a user, I can group/ungroup shapes.
- As a user, I can change stroke color, fill color, stroke width, opacity, and font size.
- As a user, I can undo/redo my own actions without undoing teammates' actions.
- As a user, I can copy/paste and duplicate shapes.
- As a user, I can snap to grid and align to other shapes.

### 4.3 Real-Time Collaboration
- As a user, I see other users' cursors with their names and colors.
- As a user, I see selection highlights when a teammate is editing a shape.
- As a user, I see a live list of who is currently in the room.
- As a user, my edits appear on other screens in under 100ms on a good connection.
- As a user, concurrent edits to the same shape never corrupt the document.

### 4.4 Offline & Sync
- As a user, I can keep drawing when my connection drops and my edits sync when I reconnect.
- As a user, shapes I created offline don't duplicate or clobber teammates' work on reconnect.

### 4.5 Export & Sharing
- As a user, I can export the entire canvas or a selection as PNG (transparent background toggle) or SVG.
- As a user, I can copy a read-only share link.
- As a room owner, I can revoke access.

### 4.6 History
- As a user, I can see a list of recent sessions and jump back to any point in the last 30 days (snapshot-based).

---

## 5. Functional Requirements

### 5.1 Document Model
- Document = ordered list of shapes + metadata (name, created_at, owner_id).
- Shape = { id, type, x, y, width, height, rotation, strokeColor, fillColor, strokeWidth, opacity, zIndex, groupId?, typeSpecific... }.
- All mutations go through the CRDT, not direct state writes.
- Yjs `Y.Doc` per room; shapes stored in a `Y.Map` keyed by shape id; each shape's mutable props live in a nested `Y.Map` so fine-grained changes merge cleanly.

### 5.2 Real-Time Transport
- Yjs y-websocket provider over a Node WebSocket server.
- Binary sync messages (update + awareness).
- Awareness channel broadcasts cursor position, selection, user info; ephemeral (not persisted).
- Server relays updates to room peers and persists them to Postgres on a debounce (every 2s or 50 updates, whichever first).

### 5.3 Persistence
- Postgres stores: users, rooms, room_members, snapshots (binary Yjs state vectors), audit_log.
- On room open: server sends the latest snapshot + replays updates since that snapshot.
- Every N updates OR T minutes: collapse updates into a new snapshot.
- Room data exportable as JSON (for backup / "download my data").

### 5.4 Rendering
- HTML Canvas 2D for shapes (SVG fallback only for export).
- Viewport culling: only render shapes within the visible viewport + a buffer.
- Dirty-rect redraw; requestAnimationFrame loop.
- Shape quadtree for hit-testing with > 500 shapes.
- DPR-aware rendering for retina screens.

### 5.5 Undo/Redo
- Per-user undo stack using Yjs `UndoManager` scoped to that user's origin.
- Undo never touches another user's edits.

### 5.6 Access Control
- Room visibility: private (members only) / unlisted (anyone with link) / public.
- Roles: owner, editor, viewer, anonymous-guest.
- Server authorizes every WebSocket connection against room ACL before accepting awareness/updates.

### 5.7 Export
- PNG: draw all visible shapes onto an offscreen canvas at configurable scale (1x/2x/3x), export via `toBlob`.
- SVG: serialize shape tree to SVG string, download as `.svg`.

---

## 6. Non-Functional Requirements

| Area | Target |
|---|---|
| Sync latency (p95, same region) | < 120ms round-trip |
| Canvas FPS | 60fps up to 5k shapes, 30fps up to 10k |
| Cold load time | < 2.5s TTI on a 4G connection |
| Concurrent users per room | 25 without degradation |
| Rooms per server instance | 500+ |
| Uptime target | 99.5% |
| Browsers | Latest Chrome, Firefox, Safari, Edge |
| Accessibility | Keyboard-navigable toolbar, ARIA labels, 4.5:1 contrast |
| Security | HTTPS/WSS only, CSRF-safe auth, rate limiting, per-room auth |

---

## 7. Technical Architecture

### 7.1 Stack
| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui | SEO for landing, edge-ready, modern stack |
| Canvas | HTML Canvas 2D | Proven at this scale; simpler than WebGL for v1 |
| CRDT | Yjs + y-indexeddb + y-websocket | Industry standard; battle-tested |
| Realtime server | Node.js + `ws` + y-websocket server hooks | Single dependency surface |
| DB | Postgres (Neon) | Managed, free tier, `bytea` for snapshots |
| ORM | Prisma or Drizzle | Type-safe migrations |
| Cache / pubsub | Redis (Upstash) | Multi-node WS fanout |
| File storage | Cloudflare R2 | Free egress for export caching |
| Auth | NextAuth (Google + email magic link) | Quick and standards-compliant |
| Hosting | Vercel (Next.js) + Fly.io or Railway (WS server) | Vercel functions can't hold WS; split the deploy |
| Observability | Sentry, Pino structured logs, simple Prometheus counters | Triage + capacity signals |

### 7.2 Key Flows

**Room open**
1. Client requests `/api/rooms/:id/token` → server validates ACL → returns short-lived JWT.
2. Client connects WSS to realtime server with JWT.
3. Server loads latest snapshot from Postgres, sends to client as Yjs sync step 1.
4. Client merges into local `Y.Doc` (which may already have offline edits from IndexedDB).
5. Awareness channel opens; presence visible within 500ms.

**Edit propagation**
1. User draws a shape → local Yjs update → IndexedDB write → WS send.
2. Server receives update → relays to all other peers in the room → appends to Postgres update log.
3. Every 2s debounce or 50 updates, server writes a new snapshot and GCs old updates.

**Reconnect after offline**
1. Client queues updates in IndexedDB while offline.
2. On reconnect, Yjs sync protocol exchanges state vectors; only missing updates are transferred both ways.
3. CRDT merge resolves all conflicts deterministically; no user-visible prompts.

### 7.3 Data Model (simplified)

```
users          (id, email, name, avatar_url, created_at)
rooms          (id, slug, name, owner_id, visibility, created_at)
room_members   (room_id, user_id, role, created_at)
snapshots      (id, room_id, yjs_state bytea, version, created_at)
update_log     (id, room_id, yjs_update bytea, origin_user_id, created_at)
audit_log      (id, room_id, user_id, action, payload_json, created_at)
```

---

## 8. UX Requirements

- Minimal, Excalidraw-inspired toolbar; keyboard shortcuts for every tool (R rectangle, O ellipse, T text, A arrow, P pen, V select, H pan).
- Command palette (cmd+k) for actions and room switching.
- Cursor colors auto-assigned from a 12-color palette; hashed on user id for stability.
- Toast notifications for connect/disconnect/save states.
- Onboarding: first-visit overlay with 4 tips; never shown again.
- Dark mode toggle; respects `prefers-color-scheme`.

---

## 9. Milestones

| Milestone | Scope | Duration |
|---|---|---|
| M1 — Canvas MVP | Infinite canvas, pan/zoom, rectangle + ellipse + pen tools, local-only (no sync) | Week 1 |
| M2 — Persistence | Postgres snapshots, room CRUD, auth, single-user save/load | Week 2 |
| M3 — Realtime sync | Yjs + y-websocket server, multi-user editing, presence cursors | Week 3 |
| M4 — Offline + polish | y-indexeddb, reconnect, undo/redo, remaining shape tools, text | Week 4 |
| M5 — Export + sharing | PNG/SVG export, share links, RBAC, audit log | Week 5 |
| M6 — Prod hardening | Rate limiting, Sentry, Playwright E2E, perf pass, README + demo video | Week 6 |

Total: **~6 weeks** part-time, 3 weeks full-time.

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CRDT state grows unboundedly | High | Performance degrades | Snapshot + update GC every N updates |
| WebSocket scale with many rooms | Medium | Server falls over | Horizontal scale; Redis pubsub for cross-node fanout |
| Canvas perf with many shapes | Medium | UX feels sluggish | Viewport culling, quadtree hit-test, dirty-rect redraw |
| Yjs learning curve | High | Slips timeline | Start with y-websocket demo, grow from there |
| Auth edge cases with anon guests | Medium | Security hole | Server-side ACL check on every WS frame origin |
| Browser compatibility for pointer events | Low | Drawing broken on some devices | Use pointer events polyfill, test on Safari/iOS |

---

## 11. Success Metrics

- **Technical**: ≥ 95% of user-visible updates applied in < 150ms; zero reproducible data-loss bugs; 60fps in 5k-shape test canvas.
- **Portfolio signal**: live demo URL, architecture diagram, 60s demo GIF in README, one blog post on "how Yjs works under the hood."
- **Adoption (stretch)**: 100 rooms created by unique users in the first 30 days after public share.

---

## 12. Open Questions

1. Do we support image uploads as canvas shapes in v1, or defer? *(Recommendation: defer — adds S3 complexity.)*
2. Is 30-day snapshot retention enough? *(Recommendation: yes for portfolio; mention in README that enterprise would need more.)*
3. Single-server vs. horizontal-scale from day one? *(Recommendation: single-server for v1; document the scale-out plan.)*

---

## 13. Appendix: References

- Yjs docs: https://docs.yjs.dev/
- Excalidraw architecture blog post (for visual + UX inspiration)
- Figma multiplayer blog post (for CRDT strategy context)
- "Building Local-First Software" (Kleppmann et al.) — for offline-first design rationale
