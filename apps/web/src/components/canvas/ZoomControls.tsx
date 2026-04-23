"use client";
import { useEffect, useRef } from "react";
import type * as Y from "yjs";
import { useViewportStore } from "@/stores/viewport";
import { listShapesInOrder } from "@/lib/yjs/doc";
import { Minus, Plus, Maximize2 } from "lucide-react";

function fitToContent(doc: Y.Doc) {
  const shapes = listShapesInOrder(doc);
  if (shapes.length === 0) return { x: 0, y: 0, zoom: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of shapes) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
  }
  const worldW = maxX - minX;
  const worldH = maxY - minY;
  const pad = 80;
  const zoom = Math.max(0.1, Math.min(2, Math.min((window.innerWidth - pad * 2) / worldW, (window.innerHeight - pad * 2) / worldH)));
  return {
    zoom,
    x: window.innerWidth / 2 - (minX + worldW / 2) * zoom,
    y: window.innerHeight / 2 - (minY + worldH / 2) * zoom,
  };
}

export function ZoomControls({ docRef }: { docRef: React.MutableRefObject<Y.Doc | null> }) {
  const viewport = useViewportStore((s) => s.viewport);
  const setViewport = useViewportStore((s) => s.setViewport);
  const docRefLatest = useRef(docRef);
  docRefLatest.current = docRef;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "1" && !e.ctrlKey && !e.metaKey) {
        setViewport({ x: 0, y: 0, zoom: 1 });
      } else if (e.key === "0" && !e.ctrlKey && !e.metaKey) {
        const doc = docRefLatest.current.current;
        if (doc) setViewport(fitToContent(doc));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setViewport]);

  return (
    <div className="absolute bottom-3 left-3 bg-white border border-neutral-200 rounded-md shadow-sm flex items-center text-sm">
      <button
        onClick={() => setViewport({ ...viewport, zoom: Math.max(0.1, Number((viewport.zoom / 1.2).toFixed(4))) })}
        className="px-2 py-1.5 hover:bg-neutral-100"
        title="Zoom out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
        className="px-2 py-1.5 hover:bg-neutral-100 font-mono min-w-[48px]"
        title="Reset zoom (1)"
      >
        {Math.round(viewport.zoom * 100)}%
      </button>
      <button
        onClick={() => setViewport({ ...viewport, zoom: Math.min(4, Number((viewport.zoom * 1.2).toFixed(4))) })}
        className="px-2 py-1.5 hover:bg-neutral-100"
        title="Zoom in"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => {
          const doc = docRef.current;
          if (doc) setViewport(fitToContent(doc));
        }}
        className="px-2 py-1.5 hover:bg-neutral-100 border-l border-neutral-200"
        title="Fit to content (0)"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
