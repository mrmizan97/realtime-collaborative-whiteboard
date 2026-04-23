import type { Tool } from "./index";
import { listShapesInOrder, updateShape } from "../../yjs/doc";
import { hitTest } from "../../shapes/registry";
import { useSelectionStore } from "@/stores/selection";
import { useSnapStore } from "@/stores/snap";
import { computeSnap } from "../snap";

type DragEntry = { id: string; startX: number; startY: number; w: number; h: number };
let drags: DragEntry[] | null = null;
let startWorld: { x: number; y: number } | null = null;
let marquee: { x: number; y: number } | null = null;

function shapeFullyInside(
  s: { x: number; y: number; width: number; height: number },
  box: { x: number; y: number; width: number; height: number },
) {
  return (
    s.x >= box.x &&
    s.y >= box.y &&
    s.x + s.width <= box.x + box.width &&
    s.y + s.height <= box.y + box.height
  );
}

export const selectTool: Tool = {
  onPointerDown(ctx, w, e) {
    const shapes = listShapesInOrder(ctx.doc).reverse();
    for (const s of shapes) {
      if (hitTest(s, w.x, w.y)) {
        const sel = useSelectionStore.getState();
        const additive = e.shiftKey;
        if (!sel.ids.includes(s.id)) sel.toggle(s.id, additive);
        let ids = useSelectionStore.getState().ids;
        const all = listShapesInOrder(ctx.doc);
        const map = Object.fromEntries(all.map((x) => [x.id, x]));

        // If any of the dragged shapes is a frame, drag its contents too.
        const extras = new Set<string>();
        for (const id of ids) {
          const sh = map[id];
          if (sh?.type === "frame") {
            for (const other of all) {
              if (ids.includes(other.id)) continue;
              if (other.type === "frame") continue;
              if (shapeFullyInside(other, sh)) extras.add(other.id);
            }
          }
        }
        if (extras.size > 0) ids = [...ids, ...Array.from(extras)];

        drags = ids.map((id) => ({
          id,
          startX: map[id]?.x ?? 0,
          startY: map[id]?.y ?? 0,
          w: map[id]?.width ?? 0,
          h: map[id]?.height ?? 0,
        }));
        startWorld = w;
        return;
      }
    }
    if (!e.shiftKey) useSelectionStore.getState().clear();
    marquee = w;
  },
  onPointerMove(ctx, w) {
    if (drags && startWorld) {
      let dx = w.x - startWorld.x;
      let dy = w.y - startWorld.y;

      if (drags.length > 0) {
        const draggedIds = new Set(drags.map((d) => d.id));
        const others = listShapesInOrder(ctx.doc).filter((s) => !draggedIds.has(s.id));
        const primary = drags[0]!;
        const moving = {
          x: primary.startX + dx,
          y: primary.startY + dy,
          w: primary.w,
          h: primary.h,
        };
        const zoom = ctx.getViewport().zoom;
        const snap = computeSnap(moving, others, zoom);
        dx += snap.dx;
        dy += snap.dy;
        useSnapStore.getState().set(snap.lines);
      }

      for (const d of drags) {
        updateShape(ctx.doc, d.id, { x: d.startX + dx, y: d.startY + dy }, ctx.origin);
      }
      return;
    }
    if (marquee) {
      const x = Math.min(marquee.x, w.x);
      const y = Math.min(marquee.y, w.y);
      const x2 = Math.max(marquee.x, w.x);
      const y2 = Math.max(marquee.y, w.y);
      const hits = listShapesInOrder(ctx.doc)
        .filter((s) => !(s.x + s.width < x || s.x > x2 || s.y + s.height < y || s.y > y2))
        .map((s) => s.id);
      useSelectionStore.getState().set(hits);
    }
  },
  onPointerUp() {
    drags = null;
    startWorld = null;
    marquee = null;
    useSnapStore.getState().clear();
  },
};
