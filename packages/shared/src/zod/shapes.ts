import { z } from "zod";

const base = {
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  strokeColor: z.string().default("#111111"),
  fillColor: z.string().default("transparent"),
  strokeWidth: z.number().default(1),
  opacity: z.number().min(0).max(1).default(1),
  zIndex: z.number().int().default(0),
  groupId: z.string().nullable().optional(),
};

export const rectangleShape = z.object({ ...base, type: z.literal("rectangle") });
export const ellipseShape = z.object({ ...base, type: z.literal("ellipse") });
export const arrowShape = z.object({
  ...base,
  type: z.literal("arrow"),
  points: z.array(z.tuple([z.number(), z.number()])),
  fromShapeId: z.string().nullable().optional(),
  toShapeId: z.string().nullable().optional(),
});
export const lineShape = z.object({
  ...base,
  type: z.literal("line"),
  points: z.array(z.tuple([z.number(), z.number()])),
});
export const penShape = z.object({
  ...base,
  type: z.literal("pen"),
  points: z.array(z.tuple([z.number(), z.number(), z.number()])),
});
export const textShape = z.object({
  ...base,
  type: z.literal("text"),
  text: z.string(),
  fontSize: z.number().default(16),
  fontFamily: z.string().default("Inter, sans-serif"),
});
export const stickyShape = z.object({
  ...base,
  type: z.literal("sticky"),
  text: z.string(),
  color: z.string().default("#FFF59D"),
});
export const frameShape = z.object({
  ...base,
  type: z.literal("frame"),
  label: z.string().default("Frame"),
});
export const imageShape = z.object({
  ...base,
  type: z.literal("image"),
  src: z.string(), // data: URL or https URL
  alt: z.string().optional(),
});

export const shape = z.discriminatedUnion("type", [
  rectangleShape,
  ellipseShape,
  arrowShape,
  lineShape,
  penShape,
  textShape,
  stickyShape,
  frameShape,
  imageShape,
]);
export type Shape = z.infer<typeof shape>;
export type ShapeType = Shape["type"];
