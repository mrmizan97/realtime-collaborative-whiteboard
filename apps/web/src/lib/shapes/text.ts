import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "text") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation ?? 0);
  ctx.font = `${s.fontSize}px ${s.fontFamily}`;
  ctx.fillStyle = s.strokeColor;
  ctx.textBaseline = "top";
  const lines = s.text.split("\n");
  lines.forEach((line, i) => ctx.fillText(line, 0, i * s.fontSize * 1.2));
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "text") return "";
  const esc = s.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<text x="${s.x}" y="${s.y + s.fontSize}" font-size="${s.fontSize}" font-family="${s.fontFamily}" fill="${s.strokeColor}" opacity="${s.opacity}">${esc}</text>`;
}
