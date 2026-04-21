import type { Tool, ToolContext } from "./index";
import { addShape, updateShape } from "../../yjs/doc";

let drawingId: string | null = null;
let startX = 0;
let startY = 0;

export const rectangleTool: Tool = {
  onPointerDown(ctx: ToolContext, w) {
    const id = crypto.randomUUID();
    drawingId = id;
    startX = w.x;
    startY = w.y;
    addShape(
      ctx.doc,
      {
        id,
        type: "rectangle",
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
  onPointerUp() {
    drawingId = null;
  },
};
