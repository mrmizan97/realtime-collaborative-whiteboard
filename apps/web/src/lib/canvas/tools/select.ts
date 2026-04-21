import type { Tool } from "./index";
import { listShapesInOrder, updateShape } from "../../yjs/doc";
import { hitTest } from "../../shapes/registry";
import { useSelectionStore } from "@/stores/selection";

type DragEntry = { id: string; startX: number; startY: number };
let drags: DragEntry[] | null = null;
let startWorld: { x: number; y: number } | null = null;
let marquee: { x: number; y: number } | null = null;

export const selectTool: Tool = {
  onPointerDown(ctx, w, e) {
    const shapes = listShapesInOrder(ctx.doc).reverse();
    for (const s of shapes) {
      if (hitTest(s, w.x, w.y)) {
        const sel = useSelectionStore.getState();
        const additive = e.shiftKey;
        if (!sel.ids.includes(s.id)) sel.toggle(s.id, additive);
        const ids = useSelectionStore.getState().ids;
        const map = Object.fromEntries(shapes.map((x) => [x.id, x]));
        drags = ids.map((id) => ({
          id,
          startX: map[id]?.x ?? 0,
          startY: map[id]?.y ?? 0,
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
      const dx = w.x - startWorld.x;
      const dy = w.y - startWorld.y;
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
  },
};
