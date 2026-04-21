import type { Tool } from "./index";
import { addShape } from "../../yjs/doc";

export const stickyTool: Tool = {
  onPointerDown(ctx, w) {
    const id = crypto.randomUUID();
    const initial = window.prompt("Sticky note:", "") ?? "";
    addShape(
      ctx.doc,
      {
        id,
        type: "sticky",
        x: w.x - 80,
        y: w.y - 80,
        width: 160,
        height: 160,
        rotation: 0,
        strokeColor: "#111111",
        fillColor: "transparent",
        strokeWidth: 0,
        opacity: 1,
        zIndex: 0,
        text: initial,
        color: "#FFF59D",
      },
      ctx.origin,
    );
  },
  onPointerMove() {},
  onPointerUp() {},
};
