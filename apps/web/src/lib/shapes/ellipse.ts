import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "ellipse") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
  ctx.rotate(s.rotation ?? 0);
  ctx.beginPath();
  ctx.ellipse(0, 0, s.width / 2, s.height / 2, 0, 0, Math.PI * 2);
  if (s.fillColor !== "transparent") {
    ctx.fillStyle = s.fillColor;
    ctx.fill();
  }
  ctx.lineWidth = s.strokeWidth;
  ctx.strokeStyle = s.strokeColor;
  ctx.stroke();
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "ellipse") return "";
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${s.width / 2}" ry="${s.height / 2}" fill="${s.fillColor}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" vector-effect="non-scaling-stroke" transform="rotate(${(s.rotation ?? 0) * (180 / Math.PI)} ${cx} ${cy})" />`;
}
