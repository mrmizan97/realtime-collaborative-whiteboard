"use client";
import type { Shape } from "@canvasly/shared";
import { draw } from "@/lib/shapes/registry";
import { allBounds, type Rect } from "./bounds";

export const MAX_DIM = 16384;

export async function exportPng(
  shapes: Shape[],
  opts: { scale?: number; transparent?: boolean; rect?: Rect } = {},
): Promise<Blob> {
  const rect = opts.rect ?? allBounds(shapes);
  if (!rect) throw new Error("nothing to export");
  const scale = opts.scale ?? 1;
  const w = Math.min(Math.round(rect.w * scale), MAX_DIM);
  const h = Math.min(Math.round(rect.h * scale), MAX_DIM);

  await document.fonts.ready;

  const canvas: HTMLCanvasElement | OffscreenCanvas =
    typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
  if ("width" in canvas && typeof canvas.width === "number") {
    (canvas as HTMLCanvasElement).width = w;
    (canvas as HTMLCanvasElement).height = h;
  }

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) throw new Error("2D context unavailable");

  if (!opts.transparent) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }

  ctx.scale(scale, scale);
  ctx.translate(-rect.x, -rect.y);
  for (const s of shapes) draw(ctx as CanvasRenderingContext2D, s, { x: 0, y: 0, zoom: 1 });

  return "convertToBlob" in canvas
    ? canvas.convertToBlob({ type: "image/png" })
    : new Promise((resolve, reject) =>
        (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
      );
}
