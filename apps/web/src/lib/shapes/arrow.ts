import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "arrow" || s.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.strokeStyle = s.strokeColor;
  ctx.fillStyle = s.strokeColor;
  ctx.lineWidth = s.strokeWidth;
  const [x0, y0] = s.points[0]!;
  const [x1, y1] = s.points[s.points.length - 1]!;
  const ax = s.x + x0, ay = s.y + y0;
  const bx = s.x + x1, by = s.y + y1;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();

  const angle = Math.atan2(by - ay, bx - ax);
  const head = 10 + s.strokeWidth * 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - head * Math.cos(angle - Math.PI / 7), by - head * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(bx - head * Math.cos(angle + Math.PI / 7), by - head * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "arrow" || s.points.length < 2) return "";
  const [x0, y0] = s.points[0]!;
  const [x1, y1] = s.points[s.points.length - 1]!;
  return `<g><line x1="${s.x + x0}" y1="${s.y + y0}" x2="${s.x + x1}" y2="${s.y + y1}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" vector-effect="non-scaling-stroke" /></g>`;
}
