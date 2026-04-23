"use client";
import { useSnapStore } from "@/stores/snap";
import { useViewportStore } from "@/stores/viewport";
import { worldToScreen } from "@/lib/canvas/viewport";

export function SnapGuides() {
  const lines = useSnapStore((s) => s.lines);
  const viewport = useViewportStore((s) => s.viewport);
  if (lines.length === 0) return null;
  return (
    <svg className="pointer-events-none absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
      {lines.map((line, i) => {
        if (line.axis === "x") {
          const { x } = worldToScreen(viewport, line.pos, 0);
          const y1 = worldToScreen(viewport, 0, line.from).y;
          const y2 = worldToScreen(viewport, 0, line.to).y;
          return <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke="#EC4899" strokeWidth="1" strokeDasharray="3 3" />;
        }
        const { y } = worldToScreen(viewport, 0, line.pos);
        const x1 = worldToScreen(viewport, line.from, 0).x;
        const x2 = worldToScreen(viewport, line.to, 0).x;
        return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#EC4899" strokeWidth="1" strokeDasharray="3 3" />;
      })}
    </svg>
  );
}
