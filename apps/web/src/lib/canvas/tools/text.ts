import type { Tool } from "./index";
import { addShape } from "../../yjs/doc";

export const textTool: Tool = {
  onPointerDown(ctx, w) {
    const id = crypto.randomUUID();
    const initial = window.prompt("Text:", "");
    if (!initial) return;
    addShape(
      ctx.doc,
      {
        id,
        type: "text",
        x: w.x,
        y: w.y,
        width: 200,
        height: 24,
        rotation: 0,
        strokeColor: "#111111",
        fillColor: "transparent",
        strokeWidth: 1,
        opacity: 1,
        zIndex: 0,
        text: initial,
        fontSize: 16,
        fontFamily: "Inter, sans-serif",
      },
      ctx.origin,
    );
  },
  onPointerMove() {},
  onPointerUp() {},
};
