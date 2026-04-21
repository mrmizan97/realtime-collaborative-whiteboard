"use client";
import type * as Y from "yjs";
import { listShapesInOrder } from "../yjs/doc";
import { buildQuadtree } from "./quadtree";
import { draw as drawShape } from "../shapes/registry";
import type { Viewport } from "./viewport";

export type RendererHandle = {
  stop: () => void;
  markDirty: () => void;
};

export function startRenderer(opts: {
  canvas: HTMLCanvasElement;
  doc: Y.Doc;
  getViewport: () => Viewport;
  getSize: () => { width: number; height: number; dpr: number };
}): RendererHandle {
  const { canvas, doc, getViewport, getSize } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");

  let dirty = true;
  let raf = 0;
  let destroyed = false;

  const onUpdate = () => {
    dirty = true;
  };
  doc.on("update", onUpdate);

  function frame() {
    if (destroyed) return;
    if (dirty) {
      const { width, height, dpr } = getSize();
      const v = getViewport();
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.scale(v.zoom, v.zoom);

      const shapes = listShapesInOrder(doc);
      const qt = buildQuadtree(shapes);
      const viewRect = {
        x: -v.x / v.zoom - 100,
        y: -v.y / v.zoom - 100,
        w: width / v.zoom + 200,
        h: height / v.zoom + 200,
      };
      const visible = qt.query(viewRect);
      for (const s of visible) drawShape(ctx, s, v);
      ctx.restore();
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  return {
    stop() {
      destroyed = true;
      cancelAnimationFrame(raf);
      doc.off("update", onUpdate);
    },
    markDirty() {
      dirty = true;
    },
  };
}
