import type { Shape } from "@canvasly/shared";
import type { Viewport } from "../canvas/viewport";

const CACHE = new Map<string, HTMLImageElement>();
const PENDING = new Set<string>();

function getImage(src: string, onLoad: () => void): HTMLImageElement | null {
  const cached = CACHE.get(src);
  if (cached && cached.complete) return cached;
  if (PENDING.has(src)) return null;
  PENDING.add(src);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    CACHE.set(src, img);
    PENDING.delete(src);
    onLoad();
  };
  img.onerror = () => PENDING.delete(src);
  img.src = src;
  return null;
}

export function draw(ctx: CanvasRenderingContext2D, s: Shape, _v: Viewport) {
  if (s.type !== "image") return;
  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.translate(s.x + s.width / 2, s.y + s.height / 2);
  ctx.rotate(s.rotation ?? 0);
  const img = getImage(s.src, () => {
    // trigger a redraw — caller reads the canvas each frame so next frame will pick it up
    // no-op here; the doc-update listener isn't needed
  });
  if (img) {
    ctx.drawImage(img, -s.width / 2, -s.height / 2, s.width, s.height);
  } else {
    // placeholder while loading
    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
    ctx.strokeStyle = "#D1D5DB";
    ctx.strokeRect(-s.width / 2, -s.height / 2, s.width, s.height);
  }
  ctx.restore();
}

export function toSvg(s: Shape): string {
  if (s.type !== "image") return "";
  return `<image x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" href="${s.src}" preserveAspectRatio="none" opacity="${s.opacity}" />`;
}
