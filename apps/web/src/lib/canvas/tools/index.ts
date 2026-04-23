export type ToolName =
  | "select"
  | "pan"
  | "rectangle"
  | "ellipse"
  | "pen"
  | "arrow"
  | "line"
  | "text"
  | "sticky"
  | "frame"
  | "image"
  | "connector";

export type ToolContext = {
  doc: import("yjs").Doc;
  origin: unknown;
  getViewport: () => import("../viewport").Viewport;
  setViewport: (v: import("../viewport").Viewport) => void;
};

export type Tool = {
  onPointerDown(ctx: ToolContext, world: { x: number; y: number }, e: PointerEvent): void;
  onPointerMove(ctx: ToolContext, world: { x: number; y: number }, e: PointerEvent): void;
  onPointerUp(ctx: ToolContext, world: { x: number; y: number }, e: PointerEvent): void;
};
