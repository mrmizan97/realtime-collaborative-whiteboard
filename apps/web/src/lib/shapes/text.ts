import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";
import { drawMarkdownLines, toSvgTspans } from "./richText";

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "text") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation ?? 0);
  ctx.fillStyle = s.strokeColor;
  ctx.textBaseline = "top";
  const lines = s.text.split("\n");
  drawMarkdownLines(ctx, lines, s.fontSize, s.fontFamily, 0, 0);
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "text") return "";
  const lines = s.text.split("\n");
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : s.fontSize * 1.2;
      return `<tspan x="${s.x}" dy="${dy}">${toSvgTspans(line)}</tspan>`;
    })
    .join("");
  return `<text x="${s.x}" y="${s.y + s.fontSize}" font-size="${s.fontSize}" font-family="${s.fontFamily}" fill="${s.strokeColor}" opacity="${s.opacity}">${tspans}</text>`;
}
