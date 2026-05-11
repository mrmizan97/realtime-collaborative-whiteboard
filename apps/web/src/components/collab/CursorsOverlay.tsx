"use client";
import { useAwarenessStore } from "@/stores/awareness";
import { useViewportStore } from "@/stores/viewport";
import { worldToScreen } from "@/lib/canvas/viewport";

export function CursorsOverlay() {
  const peers = useAwarenessStore((s) => s.peers);
  const viewport = useViewportStore((s) => s.viewport);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from(peers.values()).map((p) => {
        if (!p.cursor) return null;
        const { x, y } = worldToScreen(viewport, p.cursor.x, p.cursor.y);
        const color = p.user.color ?? "#3b82f6";
        return (
          <div
            key={p.clientId}
            className="absolute -translate-x-[2px] -translate-y-[2px]"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 2 L2 14 L6 11 L9 16 L11 15 L8 10 L13 10 Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="absolute left-4 top-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {p.user.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
