import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "rectangle") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
  ctx.rotate(s.rotation ?? 0);
  if (s.fillColor !== "transparent") {
    ctx.fillStyle = s.fillColor;
    ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
  }
  ctx.lineWidth = s.strokeWidth;
  ctx.strokeStyle = s.strokeColor;
  ctx.strokeRect(-s.width / 2, -s.height / 2, s.width, s.height);
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "rectangle") return "";
  return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.fillColor}" stroke="${s.strokeColor}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" vector-effect="non-scaling-stroke" transform="rotate(${(s.rotation ?? 0) * (180 / Math.PI)} ${s.x + s.width / 2} ${s.y + s.height / 2})" />`;
}
