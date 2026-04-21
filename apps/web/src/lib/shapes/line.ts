import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "line" || s.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = s.strokeColor;
  ctx.lineWidth = s.strokeWidth;
  ctx.beginPath();
  const [x0, y0] = s.points[0]!;
  ctx.moveTo(s.x + x0, s.y + y0);
  const [x1, y1] = s.points[s.points.length - 1]!;
  ctx.lineTo(s.x + x1, s.y + y1);
  ctx.stroke();
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "line" || s.points.length < 2) return "";
  const [x0, y0] = s.points[0]!;
  const [x1, y1] = s.points[s.points.length - 1]!;
  return `<line x1="${s.x + x0}" y1="${s.y + y0}" x2="${s.x + x1}" y2="${s.y + y1}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" vector-effect="non-scaling-stroke" />`;
}
