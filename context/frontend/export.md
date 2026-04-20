# Frontend — Export

PNG and SVG export. Done entirely on the client in v1 — the server doesn't render. If we ever need headless rendering (scheduled exports, email previews), it moves server-side. See backend `export.md` for the placeholder.

## What this domain owns

- The export dialog (scope, format, scale, background).
- The offscreen canvas pipeline for PNG.
- The SVG serializer that walks the shape tree.
- Filename generation.

It does NOT own:
- Shape drawing logic — that's shared with the on-screen renderer via the shape registry (`canvas.md`).
- Any server calls — export is 100% client-side.

## Scope options

The dialog lets the user choose:

- **Entire canvas** — bounding box of all shapes.
- **Current viewport** — what's visible now.
- **Selection** — bounding box of selected shapes (disabled if nothing selected).

The bounding box is padded by 24px in world units so shapes don't hug the edge.

## PNG pipeline

1. Compute target rect in world coords from scope.
2. Compute output size: `rect.width * scale`, `rect.height * scale` (scale ∈ {1, 2, 3}).
3. Create an offscreen `OffscreenCanvas` (or `<canvas>` fallback) at that size.
4. Set transform so world coords map to `[0, 0, outW, outH]`.
5. Optionally fill background (white) or leave transparent.
6. Walk shapes in z-order, call `registry[type].draw(ctx, shape, exportViewport)`.
7. `toBlob('image/png')` → `URL.createObjectURL` → trigger download → revoke URL.

Reusing the same `draw` function as the on-screen renderer is the whole trick. No separate export renderer, no drift.

## SVG pipeline

1. Same scope/rect computation.
2. For each shape, call `registry[type].toSvg(shape)` which returns an SVG element string.
3. Wrap in `<svg viewBox="x y w h" xmlns="...">` with the computed rect.
4. `Blob(['<?xml?>' + svgString], { type: 'image/svg+xml' })` → download.

Every shape type must implement `toSvg`. If it doesn't, export throws at registration — not at export time. Registration check lives in `lib/shapes/registry.ts`.

## Scale

PNG export scale: 1x, 2x, 3x. UI shows `(1920×1080)` next to each option so the user knows the output size.

Cap at 16384×16384 (a rough browser canvas limit). If the user picks a scale that would exceed it, disable that option and show a helper note.

## Background

- PNG: checkbox for "Transparent background". Default off (white background).
- SVG: no background by default. If the user wants one, they can edit the SVG.

## Filename

`<room-slug>-<scope>-<YYYYMMDD-HHmm>.<ext>`

e.g. `team-retro-selection-20260420-1134.png`. Timezone is the user's local.

## Things that will trip me up

- **OffscreenCanvas not in Safari for a long time.** Feature-detect and fall back to a hidden `<canvas>`. Same drawing API; just slower by a few ms.
- **Fonts not loaded when exporting text shapes.** `document.fonts.ready` before starting the draw. Without this, text shapes export in the fallback font and no one tells you.
- **Retina double-draw.** The export canvas is NOT DPR-scaled. It's a pure world-to-pixel mapping. Don't copy the on-screen DPR scale into the export path.
- **SVG with stroke + transform.** If we apply a transform to the SVG group for rotation, stroke widths visually scale too. Use `vector-effect="non-scaling-stroke"` on shape strokes.
- **Free-hand pen strokes as SVG.** Path data can be large. Consider simplifying with RDP (Ramer–Douglas–Peucker) before serialization — not for correctness, for file size.
- **Clipboard export.** "Copy as PNG" is tempting. Browser support is patchy and it needs user-gesture context. Skip for v1; download only.

## Invariants

- On-screen and export renderers share the same `draw` function per shape type. No drift.
- Every shape type implements `toSvg` or the registry fails to load.
- Export is pure-client; no server round-trip.
- Fonts are loaded before any text shape draws.

## Files (planned)

```
lib/export/
├── png.ts              # offscreen canvas → PNG blob
├── svg.ts              # shape tree → SVG string
├── bounds.ts           # scope bounding box math
└── filename.ts

components/panels/
└── ExportDialog.tsx
```
