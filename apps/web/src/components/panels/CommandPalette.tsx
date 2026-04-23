"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToolStore } from "@/stores/tool";
import { useViewportStore } from "@/stores/viewport";
import type { ToolName } from "@/lib/canvas/tools";

type Action = { id: string; label: string; hint?: string; run: () => void };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const setTool = useToolStore((s) => s.setTool);
  const setViewport = useViewportStore((s) => s.setViewport);

  const actions: Action[] = useMemo(
    () => [
      ...(["select", "pan", "rectangle", "ellipse", "line", "arrow", "pen", "text", "sticky", "frame", "image", "connector"] as ToolName[]).map(
        (t) => ({
          id: `tool:${t}`,
          label: `Tool: ${t[0]!.toUpperCase() + t.slice(1)}`,
          run: () => setTool(t),
        }),
      ),
      {
        id: "zoom:100",
        label: "Zoom to 100%",
        hint: "1",
        run: () => setViewport({ x: 0, y: 0, zoom: 1 }),
      },
      {
        id: "nav:dashboard",
        label: "Go to dashboard",
        run: () => router.push("/dashboard"),
      },
    ],
    [router, setTool, setViewport],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") setOpen(false);
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = query.trim()
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command…"
          className="w-full px-4 py-3 text-sm outline-none border-b border-neutral-200"
        />
        <ul className="max-h-80 overflow-auto">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => {
                  a.run();
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 flex items-center justify-between"
              >
                <span>{a.label}</span>
                {a.hint && <kbd className="text-xs text-neutral-400">{a.hint}</kbd>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-neutral-500">No matches.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
