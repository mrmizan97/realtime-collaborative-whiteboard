import type { Tool } from "./index";
import { addShape, updateShape } from "../../yjs/doc";

let drawingId: string | null = null;
let originX = 0;
let originY = 0;
let points: [number, number, number][] = [];

export const penTool: Tool = {
  onPointerDown(ctx, w, e) {
    const id = crypto.randomUUID();
    drawingId = id;
    originX = w.x;
    originY = w.y;
    points = [[0, 0, e.pressure || 0.5]];
    addShape(
      ctx.doc,
      {
        id,
        type: "pen",
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
        points,
      },
      ctx.origin,
    );
  },
  onPointerMove(ctx, w, e) {
    if (!drawingId) return;
    points = [...points, [w.x - originX, w.y - originY, e.pressure || 0.5]];
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    updateShape(
      ctx.doc,
      drawingId,
      {
        points,
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      },
      ctx.origin,
    );
  },
  onPointerUp() {
    drawingId = null;
    points = [];
  },
};
