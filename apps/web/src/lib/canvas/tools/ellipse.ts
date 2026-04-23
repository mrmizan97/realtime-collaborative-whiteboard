import type { Tool } from "./index";
import { addShape, deleteShape, getShape, updateShape } from "../../yjs/doc";

const MIN_SIZE = 3;

let drawingId: string | null = null;
let startX = 0;
let startY = 0;

export const ellipseTool: Tool = {
  onPointerDown(ctx, w) {
    const id = crypto.randomUUID();
    drawingId = id;
    startX = w.x;
    startY = w.y;
    addShape(
      ctx.doc,
      {
        id,
        type: "ellipse",
        x: w.x,
        y: w.y,
        width: 1,
        height: 1,
        rotation: 0,
        strokeColor: "#111111",
        fillColor: "transparent",
        strokeWidth: 2,
        opacity: 1,
        zIndex: 0,
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
        x: Math.min(startX, w.x),
        y: Math.min(startY, w.y),
        width: Math.max(1, Math.abs(w.x - startX)),
        height: Math.max(1, Math.abs(w.y - startY)),
      },
      ctx.origin,
    );
  },
  onPointerUp(ctx) {
    if (!drawingId) return;
    const s = getShape(ctx.doc, drawingId);
    if (s && (s.width < MIN_SIZE || s.height < MIN_SIZE)) {
      deleteShape(ctx.doc, drawingId, ctx.origin);
    }
    drawingId = null;
  },
};
