"use client";
import { useEffect, useState } from "react";
import { useSelectionStore } from "@/stores/selection";
import { useViewportStore } from "@/stores/viewport";
import { worldToScreen } from "@/lib/canvas/viewport";
import type { Shape } from "@canvasly/shared";
import { listShapesInOrder, updateShape } from "@/lib/yjs/doc";
import { LOCAL_ORIGIN } from "@/lib/yjs/undo";
import type * as Y from "yjs";

export function SelectionHandles({ docRef }: { docRef: React.MutableRefObject<Y.Doc | null> }) {
  const ids = useSelectionStore((s) => s.ids);
  const viewport = useViewportStore((s) => s.viewport);
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const read = () => setShapes(listShapesInOrder(doc).filter((s) => ids.includes(s.id)));
    read();
    doc.on("update", read);
    return () => doc.off("update", read);
  }, [ids, docRef]);

  if (shapes.length === 0) return null;

  const minX = Math.min(...shapes.map((s) => s.x));
  const minY = Math.min(...shapes.map((s) => s.y));
  const maxX = Math.max(...shapes.map((s) => s.x + s.width));
  const maxY = Math.max(...shapes.map((s) => s.y + s.height));

  const a = worldToScreen(viewport, minX, minY);
  const b = worldToScreen(viewport, maxX, maxY);
  const left = a.x;
  const top = a.y;
  const width = b.x - a.x;
  const height = b.y - a.y;

  const handles = [
    { id: "tl", x: 0, y: 0, cursor: "nwse-resize" },
    { id: "tr", x: 1, y: 0, cursor: "nesw-resize" },
    { id: "bl", x: 0, y: 1, cursor: "nesw-resize" },
    { id: "br", x: 1, y: 1, cursor: "nwse-resize" },
  ];

  function onResize(handleId: string, e: React.PointerEvent) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const doc = docRef.current;
    if (!doc || shapes.length !== 1) return;
    const s = shapes[0]!;
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { x: s.x, y: s.y, w: s.width, h: s.height };

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / viewport.zoom;
      const dy = (ev.clientY - startY) / viewport.zoom;
      let nx = orig.x, ny = orig.y, nw = orig.w, nh = orig.h;
      if (handleId === "br") { nw = Math.max(1, orig.w + dx); nh = Math.max(1, orig.h + dy); }
      else if (handleId === "tr") { nw = Math.max(1, orig.w + dx); ny = orig.y + dy; nh = Math.max(1, orig.h - dy); }
      else if (handleId === "bl") { nx = orig.x + dx; nw = Math.max(1, orig.w - dx); nh = Math.max(1, orig.h + dy); }
      else if (handleId === "tl") { nx = orig.x + dx; ny = orig.y + dy; nw = Math.max(1, orig.w - dx); nh = Math.max(1, orig.h - dy); }
      updateShape(doc, s.id, { x: nx, y: ny, width: nw, height: nh }, LOCAL_ORIGIN);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onRotate(e: React.PointerEvent) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const doc = docRef.current;
    if (!doc || shapes.length !== 1) return;
    const s = shapes[0]!;
    const cxWorld = s.x + s.width / 2;
    const cyWorld = s.y + s.height / 2;
    const cScreen = worldToScreen(viewport, cxWorld, cyWorld);
    const startAngle = Math.atan2(e.clientY - cScreen.y, e.clientX - cScreen.x);
    const origRotation = s.rotation ?? 0;

    const move = (ev: PointerEvent) => {
      const a = Math.atan2(ev.clientY - cScreen.y, ev.clientX - cScreen.x);
      let next = origRotation + (a - startAngle);
      if (ev.shiftKey) {
        const step = Math.PI / 12; // 15°
        next = Math.round(next / step) * step;
      }
      updateShape(doc, s.id, { rotation: next }, LOCAL_ORIGIN);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500"
      style={{ left, top, width, height }}
    >
      {shapes.length === 1 && (
        <>
          {handles.map((h) => (
            <div
              key={h.id}
              onPointerDown={(e) => onResize(h.id, e)}
              className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 pointer-events-auto"
              style={{ left: h.x * width - 5, top: h.y * height - 5, cursor: h.cursor }}
            />
          ))}
          <div
            onPointerDown={onRotate}
            className="absolute w-3 h-3 rounded-full bg-white border-2 border-blue-500 pointer-events-auto"
            style={{ left: width / 2 - 6, top: -28, cursor: "grab" }}
            title="Rotate (shift = 15° steps)"
          />
          <div
            className="absolute pointer-events-none"
            style={{ left: width / 2, top: -20, width: 1, height: 14, background: "#3B82F6" }}
          />
        </>
      )}
    </div>
  );
}
