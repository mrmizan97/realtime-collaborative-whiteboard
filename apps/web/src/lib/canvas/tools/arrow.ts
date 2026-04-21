import type { Tool } from "./index";
import { addShape, updateShape } from "../../yjs/doc";

let drawingId: string | null = null;
let originX = 0;
let originY = 0;

export const arrowTool: Tool = {
  onPointerDown(ctx, w) {
    const id = crypto.randomUUID();
    drawingId = id;
    originX = w.x;
    originY = w.y;
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
        strokeColor: "#111111",
        fillColor: "transparent",
        strokeWidth: 2,
        opacity: 1,
        zIndex: 0,
        points: [
          [0, 0],
          [0, 0],
        ],
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
  onPointerUp() {
    drawingId = null;
  },
};
