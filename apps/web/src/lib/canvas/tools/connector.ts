import type { Tool } from "./index";
import { addShape, listShapesInOrder, updateShape } from "../../yjs/doc";
import { hitTest } from "../../shapes/registry";

let drawingId: string | null = null;
let originX = 0;
let originY = 0;
let fromShapeId: string | null = null;

function hitOne(ctx: { doc: import("yjs").Doc }, w: { x: number; y: number }): string | null {
  const shapes = listShapesInOrder(ctx.doc).reverse();
  for (const s of shapes) {
    if (s.type === "arrow" || s.type === "line" || s.type === "pen") continue;
    if (hitTest(s, w.x, w.y)) return s.id;
  }
  return null;
}

export const connectorTool: Tool = {
  onPointerDown(ctx, w) {
    const id = crypto.randomUUID();
    drawingId = id;
    originX = w.x;
    originY = w.y;
    fromShapeId = hitOne(ctx, w);
    addShape(
      ctx.doc,
      {
        id,
        type: "arrow",
        x: w.x,
        y: w.y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: "#3B82F6",
        fillColor: "transparent",
        strokeWidth: 2,
        opacity: 1,
        zIndex: 0,
        points: [
          [0, 0],
          [0, 0],
        ],
        fromShapeId,
      },
      ctx.origin,
    );
  },
  onPointerMove(ctx, w) {
    if (!drawingId) return;
    updateShape(
      ctx.doc,
      drawingId,
      {
        points: [
          [0, 0],
          [w.x - originX, w.y - originY],
        ],
        width: Math.abs(w.x - originX),
        height: Math.abs(w.y - originY),
      },
      ctx.origin,
    );
  },
  onPointerUp(ctx, w) {
    if (!drawingId) return;
    const target = hitOne(ctx, w);
    if (target && target !== fromShapeId) {
      updateShape(ctx.doc, drawingId, { toShapeId: target }, ctx.origin);
    }
    drawingId = null;
    fromShapeId = null;
  },
};
