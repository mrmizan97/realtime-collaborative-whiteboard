# Frontend — Canvas

This is the hot path. Every millisecond here shows up as jank, so the rules are stricter than the rest of the app. React is kept at arm's length on purpose.

## What this domain owns

- The `<canvas>` element and its 2D context.
- The viewport (pan, zoom, DPR).
- The shape registry — how each shape type draws and hit-tests itself.
- The render loop (`requestAnimationFrame`).
- The quadtree used for hit-testing and viewport culling.
- Input handling for the canvas (pointer events → tool → shape mutation).

It does NOT own:
- The shape data itself. That lives in Yjs (`lib/yjs/doc.ts`). See `collaboration.md`.
- Selection UI (selection box, handles). Those are DOM overlays in `components/canvas/`.
- Toolbar state. Zustand store, `hooks/useTool.ts`.

## The render loop

One loop, one canvas, one `requestAnimationFrame`. The loop:

1. Read the current viewport (pan, zoom) from the Zustand store — a single non-reactive read, not a subscription.
2. Ask the quadtree for shapes intersecting the viewport rect + buffer.
3. Clear the dirty rect (or full clear if zoom changed).
4. For each visible shape, call `registry[shape.type].draw(ctx, shape, viewport)`.
5. Draw overlays (selection rects, hover outlines) into the same canvas.
6. Schedule the next frame.

The loop doesn't know about React. It's mounted in a `useEffect` in `useCanvas.ts` and stays alive until unmount.

## Why we read Yjs directly each frame

The temptation is to subscribe to Yjs changes and re-render on change. We don't. The `Y.Doc` is the source of truth and the render loop reads from it directly. This has two benefits:

- No "update event → React setState → next frame" latency.
- No risk of stale state if a Yjs update lands mid-frame.

We use a dirty flag that Yjs sets via `doc.on('update', ...)` to skip frames when nothing changed. No dirty flag → skip the clear/draw, just return.

## Viewport

```
viewport = { x, y, zoom }
screen → world:  (sx - x) / zoom, (sy - y) / zoom
world  → screen: wx * zoom + x,   wy * zoom + y
```

Keep this in one place (`lib/canvas/viewport.ts`). Every tool, every hit test, every overlay position goes through these helpers. Do not reinvent the math inline.

## The quadtree

- Rebuilt incrementally as shapes move/resize.
- Leaf capacity: 8 shapes. Beyond that, subdivide.
- Used for two things only: viewport culling and hit-testing.
- Below ~500 shapes, the quadtree is overhead — we still use it for consistency.

Quadtree is not in Yjs. It's a local index rebuilt from Yjs state. If it drifts, rebuild from scratch rather than patching.

## Shape registry

Each shape type is a module that exports:

```ts
{
  create(point, tool): ShapePartial,
  draw(ctx, shape, viewport): void,
  hitTest(shape, point): boolean,
  bounds(shape): Rect,
  resize(shape, handle, delta): ShapePartial,
}
```

Registry is in `lib/shapes/registry.ts`. Add a new shape → add a new module + register it. No special cases elsewhere.

## Input handling

Pointer events only. No mousedown/touchstart branching — pointer events unify both. Capture on pointerdown so we don't lose the stream if the pointer leaves the canvas mid-drag.

Flow:
1. `pointerdown` → ask active tool to start an interaction.
2. `pointermove` → tool accumulates, writes to Yjs if appropriate.
3. `pointerup` → tool commits, undo-manager captures the transaction.

The tool is a small state machine object. See `lib/canvas/tools/`.

## DPR and crispness

- `canvas.width = cssWidth * dpr`, same for height.
- `ctx.scale(dpr, dpr)` once after resize.
- All coordinates stay in CSS pixels after that scale. Don't multiply by DPR anywhere else.

## Things that will trip me up

- **Reading Zustand in the loop.** Use `useStore.getState()` inside the RAF callback, not the reactive hook. Reactive reads re-render React every frame — defeats the whole point.
- **Transform state on the ctx.** Always `ctx.save()` / `ctx.restore()` around per-shape transforms. Bleeding transforms across shapes is a nightmare to debug.
- **Resize ResizeObserver thrash.** Debounce the resize handler by one frame. Otherwise a window drag fires 100 resizes/sec and the quadtree rebuilds every one.
- **Hit-testing rotated shapes.** Do it in the shape's local space — rotate the test point, not the shape's bounds. `lib/shapes/util.ts` has the helper.
- **Floating point drift on zoom.** After many zoom operations, coords drift. Clamp zoom to discrete steps (0.1, 0.125, ..., 4.0) or round to 4 decimals after each op.

## Invariants

- React never owns canvas state. If it did, two sources of truth exist and they'll disagree.
- The render loop runs exactly once per canvas mount.
- Shape mutations go through Yjs; nothing writes to local shape state behind Yjs's back.
- The viewport is per-user and ephemeral; it does not belong in Yjs.

## Files (planned)

```
lib/canvas/
├── renderer.ts        # the RAF loop
├── viewport.ts        # pan/zoom math + screen/world helpers
├── quadtree.ts        # spatial index
├── hit-test.ts        # shared hit-test helpers
└── tools/
    ├── index.ts
    ├── select.ts
    ├── rectangle.ts
    ├── ellipse.ts
    ├── pen.ts
    ├── text.ts
    └── pan.ts

lib/shapes/
├── registry.ts
├── rectangle.ts
├── ellipse.ts
├── arrow.ts
├── line.ts
├── pen.ts
├── text.ts
└── sticky.ts

components/canvas/
├── Canvas.tsx         # mounts the canvas + overlays
├── SelectionHandles.tsx
└── CursorsOverlay.tsx
```
