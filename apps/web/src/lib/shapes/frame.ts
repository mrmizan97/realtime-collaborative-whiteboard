import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "frame") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
  ctx.rotate(s.rotation ?? 0);

  // label strip
  ctx.fillStyle = "#E5E7EB";
  ctx.fillRect(-s.width / 2, -s.height / 2 - 22, s.width, 22);
  ctx.fillStyle = "#374151";
  ctx.font = "12px Inter, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(s.label ?? "Frame", -s.width / 2 + 8, -s.height / 2 - 11);

  // frame body
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
  ctx.strokeStyle = "#9CA3AF";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(-s.width / 2, -s.height / 2, s.width, s.height);
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "frame") return "";
  const label = (s.label ?? "Frame")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<g>
  <rect x="${s.x}" y="${s.y - 22}" width="${s.width}" height="22" fill="#E5E7EB" />
  <text x="${s.x + 8}" y="${s.y - 7}" font-size="12" font-family="Inter, sans-serif" fill="#374151">${label}</text>
  <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="rgba(255,255,255,0.4)" stroke="#9CA3AF" stroke-width="1" />
</g>`;
}
