import type { Tool } from "./index";
import { addShape, deleteShape, getShape, updateShape } from "../../yjs/doc";

const MIN_SIZE = 40;

let drawingId: string | null = null;
let startX = 0;
let startY = 0;

export const frameTool: Tool = {
  onPointerDown(ctx, w) {
    const id = crypto.randomUUID();
    drawingId = id;
    startX = w.x;
    startY = w.y;
    addShape(
      ctx.doc,
      {
        id,
        type: "frame",
        x: w.x,
        y: w.y,
        width: MIN_SIZE,
        height: MIN_SIZE,
        rotation: 0,
        strokeColor: "#9CA3AF",
        fillColor: "transparent",
        strokeWidth: 1,
        opacity: 1,
        zIndex: -1,
        label: "Frame",
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
