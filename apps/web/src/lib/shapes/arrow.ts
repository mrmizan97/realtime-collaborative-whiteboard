import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";
import { getSharedShapeLookup } from "./registry";

function nearestEdgePoint(box: { x: number; y: number; w: number; h: number }, fromX: number, fromY: number) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = fromX - cx;
  const dy = fromY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const sx = dx === 0 ? Infinity : Math.abs((box.w / 2) / dx);
  const sy = dy === 0 ? Infinity : Math.abs((box.h / 2) / dy);
  const scale = Math.min(sx, sy);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function resolvedEndpoints(
  s: Extract<Shape, { type: "arrow" }>,
  shapesById?: Map<string, Shape> | null,
): { a: { x: number; y: number }; b: { x: number; y: number } } {
  const [x0, y0] = s.points[0] ?? [0, 0];
  const [x1, y1] = s.points[s.points.length - 1] ?? [0, 0];
  let a = { x: s.x + x0, y: s.y + y0 };
  let b = { x: s.x + x1, y: s.y + y1 };

  if (shapesById) {
    if (s.fromShapeId) {
      const from = shapesById.get(s.fromShapeId);
      if (from) {
        a = nearestEdgePoint(
          { x: from.x, y: from.y, w: from.width, h: from.height },
          b.x,
          b.y,
        );
      }
    }
    if (s.toShapeId) {
      const to = shapesById.get(s.toShapeId);
      if (to) {
        b = nearestEdgePoint(
          { x: to.x, y: to.y, w: to.width, h: to.height },
          a.x,
          a.y,
        );
      }
    }
  }
  return { a, b };
}

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "arrow" || s.points.length < 2) return;
  const { a, b } = resolvedEndpoints(s, getSharedShapeLookup());
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = s.strokeColor;
  ctx.fillStyle = s.strokeColor;
  ctx.lineWidth = s.strokeWidth;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const head = 10 + s.strokeWidth * 2;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 7), b.y - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 7), b.y - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "arrow" || s.points.length < 2) return "";
  const { a, b } = resolvedEndpoints(s, getSharedShapeLookup());
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" vector-effect="non-scaling-stroke" />`;
}
