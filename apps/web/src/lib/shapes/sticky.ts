import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";
import { drawMarkdownLines, toSvgTspans } from "./richText";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "sticky") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
  ctx.rotate(s.rotation ?? 0);
  ctx.fillStyle = s.color;
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#111";
  ctx.textBaseline = "top";
  const pad = 12;
  const lines = s.text.split("\n");
  drawMarkdownLines(ctx, lines, 14, "Inter, sans-serif", -s.width / 2 + pad, -s.height / 2 + pad, 1.3);
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "sticky") return "";
  const lines = s.text.split("\n");
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : 18;
      return `<tspan x="${s.x + 12}" dy="${dy}">${toSvgTspans(line)}</tspan>`;
    })
    .join("");
  return `<g>
    <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.color}" opacity="${s.opacity}" />
    <text y="${s.y + 14 + 12}" font-size="14" font-family="Inter, sans-serif" fill="#111">${tspans}</text>
  </g>`;
}
