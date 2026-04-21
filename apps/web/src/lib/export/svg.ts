import type { Shape } from "@canvasly/shared";
import { toSvg } from "@/lib/shapes/registry";
import { allBounds, type Rect } from "./bounds";

export function exportSvg(shapes: Shape[], rect?: Rect): string {
  const r = rect ?? allBounds(shapes);
  if (!r) throw new Error("nothing to export");
  const body = shapes.map(toSvg).join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.x} ${r.y} ${r.w} ${r.h}" width="${r.w}" height="${r.h}">
  ${body}
</svg>`;
}
