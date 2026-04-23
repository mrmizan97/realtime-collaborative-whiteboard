"use client";
import { useEffect, useState } from "react";
import { useAwarenessStore } from "@/stores/awareness";
import { useViewportStore } from "@/stores/viewport";
import { worldToScreen } from "@/lib/canvas/viewport";
import type { WebsocketProvider } from "y-websocket";
import { patchLocalAwareness } from "@/lib/yjs/awareness";
import { Smile } from "lucide-react";

const EMOJIS = ["👍", "❤️", "🎉", "🔥", "✨", "👀", "🙌", "😂"];
const LIFETIME_MS = 2000;

type Live = { id: string; emoji: string; x: number; y: number; at: number };

export function Reactions({ wsRef }: { wsRef: React.MutableRefObject<WebsocketProvider | null> }) {
  const peers = useAwarenessStore((s) => s.peers);
  const viewport = useViewportStore((s) => s.viewport);
  const [live, setLive] = useState<Live[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const added: Live[] = [];
    peers.forEach((p) => {
      const r = p.reaction;
      if (!r || now - r.at > LIFETIME_MS) return;
      added.push({ id: `${p.clientId}-${r.at}`, emoji: r.emoji, x: r.x, y: r.y, at: r.at });
    });
    if (added.length === 0) return;
    setLive((prev) => {
      const existing = new Set(prev.map((x) => x.id));
      const merged = [...prev];
      for (const a of added) if (!existing.has(a.id)) merged.push(a);
      return merged;
    });
  }, [peers]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setLive((prev) => prev.filter((x) => now - x.at < LIFETIME_MS));
    }, 250);
    return () => clearInterval(t);
  }, []);

  function react(emoji: string) {
    const ws = wsRef.current;
    if (!ws) return;
    const cx = -viewport.x / viewport.zoom + window.innerWidth / viewport.zoom / 2;
    const cy = -viewport.y / viewport.zoom + window.innerHeight / viewport.zoom / 2;
    patchLocalAwareness(ws, { reaction: { emoji, x: cx, y: cy, at: Date.now() } });
    setMenuOpen(false);
    setTimeout(() => patchLocalAwareness(ws, { reaction: undefined }), LIFETIME_MS);
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((m) => !m)}
          title="React"
          className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 flex gap-1 bg-white border border-neutral-200 rounded-md shadow-sm p-1 z-50">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => react(e)}
                className="text-xl w-8 h-8 hover:bg-neutral-100 rounded"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {live.map((r) => {
          const { x, y } = worldToScreen(viewport, r.x, r.y);
          const age = (Date.now() - r.at) / LIFETIME_MS;
          return (
            <div
              key={r.id}
              className="absolute text-4xl select-none"
              style={{
                transform: `translate(${x}px, ${y - age * 80}px) scale(${1 + age * 0.3})`,
                opacity: 1 - age,
                transition: "transform 0.1s linear",
              }}
            >
              {r.emoji}
            </div>
          );
        })}
      </div>
    </>
  );
}
