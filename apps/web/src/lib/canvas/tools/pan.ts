import type { Tool } from "./index";

let panning = false;
let lastX = 0;
let lastY = 0;

export const panTool: Tool = {
  onPointerDown(_ctx, _w, e) {
    panning = true;
    lastX = e.clientX;
    lastY = e.clientY;
  },
  onPointerMove(ctx, _w, e) {
    if (!panning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const v = ctx.getViewport();
    ctx.setViewport({ ...v, x: v.x + dx, y: v.y + dy });
  },
  onPointerUp() {
    panning = false;
  },
};
