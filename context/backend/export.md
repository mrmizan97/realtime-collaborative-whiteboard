# Backend — Export

V1 does exports client-side. This file exists to document why, and to sketch what server-side export would look like when we need it.

## V1: client-side only

- User clicks "Export PNG" or "Export SVG" in the room.
- Client iterates over all shapes in the `Y.Doc`, draws them to an offscreen canvas (PNG) or serializes to SVG string, and triggers a download.
- No server round-trip. No S3. No background job.

This is fine because:
- The client already has the document in memory.
- Exports happen one user at a time, rarely.
- PNG generation from a few thousand shapes takes <500ms on a decent laptop.

See `frontend/export.md` for the client-side details.

## When we'd move it server-side

- **Preview thumbnails.** If the room list needs a thumbnail for each room, we can't render 50 canvases on the client every time you open the dashboard.
- **Shareable OG images.** Public room links want a social preview image.
- **Exports from headless automation.** Someone wants a nightly PDF of a specific board.
- **Very large boards.** 10k+ shapes where the client canvas chokes.

Trigger is "one of these things matters enough to justify the complexity." Not in v1.

## How server-side export would work

When we build it:

1. **Service choice.** Separate Node process, probably in `apps/export/`. Not inside `apps/realtime` — we don't want a heavy CPU task next to the WS event loop.
2. **Rendering.** Use `node-canvas` (Cairo-based) — matches the browser's Canvas 2D API closely enough that the drawing code can be shared with the frontend via `packages/shared/src/render.ts`.
3. **Queue.** BullMQ with Redis. Producer is an API route on `apps/web`; consumer is `apps/export`. Jobs are small: `{ room_id, version, format, scale }`.
4. **Output.** Write to Cloudflare R2 under a content-addressed key (hash of room state + params), return a signed URL.
5. **Cache.** If the content hash already exists in R2, skip the render and return the existing URL.

## Shared render code

The dream is that the same draw function produces identical pixels in browser and Node. To get there:

- All drawing goes through a `drawShape(ctx, shape)` function in `packages/shared/src/render.ts`.
- That function calls only Canvas 2D APIs that exist in both environments.
- Font loading is the tricky bit — `node-canvas` needs `registerFont` with a font file; browser uses CSS. Abstract this into a `loadFont` helper per env.

## SVG export

SVG is easier than PNG because it's just a string. Same draw function but outputs SVG tags instead of canvas calls. In practice we'd write a parallel `drawShapeSVG(doc, shape)` that appends to a string builder.

## Formats I'm not supporting in v1

- PDF — not needed for portfolio. If needed later, render to PNG and wrap in a PDF via `pdf-lib`.
- Figma import/export — out of scope.
- JSON — already exportable via "download my data" in the room settings (future).

## Why not Puppeteer

Puppeteer works and some teams use it for server-side canvas exports. I'd rather not:

- Heavy (Chromium is 200MB+).
- Slow cold start.
- Hard to cap memory reliably under load.

Node-canvas is boring and predictable. Picking that unless we hit a weird blocker.

## Files (when we build it)

```
apps/export/
├── src/
│   ├── worker.ts         # BullMQ consumer
│   ├── render-png.ts     # wraps render.ts with node-canvas
│   ├── render-svg.ts     # wraps render.ts outputting SVG
│   ├── upload.ts         # R2 client
│   └── cache.ts          # content-hash lookup
packages/shared/src/
└── render.ts             # the shared shape-to-ctx function
```
