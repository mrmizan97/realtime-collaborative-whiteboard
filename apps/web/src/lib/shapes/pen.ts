import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "pen" || s.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = s.strokeColor;
  ctx.lineWidth = s.strokeWidth;
  ctx.beginPath();
  const [x0, y0] = s.points[0]!;
  ctx.moveTo(s.x + x0, s.y + y0);
  for (let i = 1; i < s.points.length; i++) {
    const [x, y] = s.points[i]!;
    ctx.lineTo(s.x + x, s.y + y);
  }
  ctx.stroke();
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "pen" || s.points.length < 2) return "";
  const d = s.points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${s.x + x},${s.y + y}`)
    .join(" ");
  return `<path d="${d}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${s.opacity}" vector-effect="non-scaling-stroke" />`;
}
