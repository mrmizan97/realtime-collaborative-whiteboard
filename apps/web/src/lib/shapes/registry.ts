import type { Shape, ShapeType } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";
import { pointInShape } from "../canvas/hit-test";
import * as rect from "./rectangle";
import * as ellipse from "./ellipse";
import * as pen from "./pen";
import * as line from "./line";
import * as arrow from "./arrow";
import * as text from "./text";
import * as sticky from "./sticky";
import * as frame from "./frame";
import * as image from "./image";

export type ShapeModule = {
  draw: (ctx: CanvasRenderingContext2D, s: Shape, v: Viewport) => void;
  toSvg: (s: Shape) => string;
  hitTest?: (s: Shape, x: number, y: number) => boolean;
};

const modules: Record<ShapeType, ShapeModule> = {
  rectangle: rect,
  ellipse: ellipse,
  pen: pen,
  line: line,
  arrow: arrow,
  text: text,
  sticky: sticky,
  frame: frame,
  image: image,
};

for (const [k, m] of Object.entries(modules)) {
  if (typeof m.toSvg !== "function") {
    throw new Error(`Shape '${k}' missing toSvg implementation`);
  }
}

// Shared per-frame context for shape modules that need to resolve cross-shape
// references (e.g. arrows that attach to other shapes). Set by the renderer at
// the start of every frame and cleared after.
let sharedShapesById: Map<string, Shape> | null = null;
export function setSharedShapeLookup(map: Map<string, Shape> | null) {
  sharedShapesById = map;
}
export function getSharedShapeLookup(): Map<string, Shape> | null {
  return sharedShapesById;
}

export function getShapeModule(type: ShapeType): ShapeModule {
  return modules[type];
}

export function draw(ctx: CanvasRenderingContext2D, s: Shape, v: Viewport) {
  modules[s.type].draw(ctx, s, v);
}

export function hitTest(s: Shape, x: number, y: number): boolean {
  const custom = modules[s.type].hitTest;
  return custom ? custom(s, x, y) : pointInShape(s, x, y);
}

export function toSvg(s: Shape): string {
  return modules[s.type].toSvg(s);
}
