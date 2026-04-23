import type { Tool } from "./index";
import { addShape } from "../../yjs/doc";

export const imageTool: Tool = {
  onPointerDown(ctx, w) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const img = new Image();
        img.onload = () => {
          const maxW = 600;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const width = img.width * scale;
          const height = img.height * scale;
          const id = crypto.randomUUID();
          addShape(
            ctx.doc,
            {
              id,
              type: "image",
              x: w.x - width / 2,
              y: w.y - height / 2,
              width,
              height,
              rotation: 0,
              strokeColor: "#111111",
              fillColor: "transparent",
              strokeWidth: 0,
              opacity: 1,
              zIndex: 0,
              src,
            },
            ctx.origin,
          );
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  },
  onPointerMove() {},
  onPointerUp() {},
};
