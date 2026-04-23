"use client";
import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { Shape } from "@canvasly/shared";
import { listShapesInOrder } from "@/lib/yjs/doc";
import { useViewportStore } from "@/stores/viewport";

const W = 180;
const H = 130;

export function Minimap({ docRef }: { docRef: React.MutableRefObject<Y.Doc | null> }) {
  const viewport = useViewportStore((s) => s.viewport);
  const setViewport = useViewportStore((s) => s.setViewport);
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShapes(listShapesInOrder(doc)));
    };
    read();
    doc.on("update", read);
    return () => {
      doc.off("update", read);
      cancelAnimationFrame(raf);
    };
  }, [docRef]);

  if (shapes.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of shapes) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x + s.width > maxX) maxX = s.x + s.width;
    if (s.y + s.height > maxY) maxY = s.y + s.height;
  }
  const worldW = Math.max(1, maxX - minX);
  const worldH = Math.max(1, maxY - minY);
  const scale = Math.min(W / worldW, H / worldH) * 0.9;
  const offsetX = (W - worldW * scale) / 2 - minX * scale;
  const offsetY = (H - worldH * scale) / 2 - minY * scale;

  const viewW = window.innerWidth / viewport.zoom;
  const viewH = window.innerHeight / viewport.zoom;
  const viewWorldX = -viewport.x / viewport.zoom;
  const viewWorldY = -viewport.y / viewport.zoom;

  function jumpTo(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const wx = (px - offsetX) / scale;
    const wy = (py - offsetY) / scale;
    setViewport({
      ...viewport,
      x: window.innerWidth / 2 - wx * viewport.zoom,
      y: window.innerHeight / 2 - wy * viewport.zoom,
    });
  }

  return (
    <div
      onClick={jumpTo}
      className="absolute bottom-3 right-3 bg-white/90 backdrop-blur border border-neutral-200 rounded-md shadow-sm cursor-pointer select-none"
      style={{ width: W, height: H }}
      title="Click to jump"
    >
      <svg width={W} height={H}>
        {shapes.map((s) => (
          <rect
            key={s.id}
            x={s.x * scale + offsetX}
            y={s.y * scale + offsetY}
            width={Math.max(1, s.width * scale)}
            height={Math.max(1, s.height * scale)}
            fill={s.fillColor && s.fillColor !== "transparent" ? s.fillColor : "#D1D5DB"}
            stroke={s.strokeColor || "#6B7280"}
            strokeWidth={0.5}
          />
        ))}
        <rect
          x={viewWorldX * scale + offsetX}
          y={viewWorldY * scale + offsetY}
          width={Math.max(2, viewW * scale)}
          height={Math.max(2, viewH * scale)}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
