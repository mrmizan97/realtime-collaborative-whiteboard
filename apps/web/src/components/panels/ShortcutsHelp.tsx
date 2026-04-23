"use client";
import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "V", label: "Select" },
  { keys: "H", label: "Pan" },
  { keys: "R", label: "Rectangle" },
  { keys: "O", label: "Ellipse" },
  { keys: "L", label: "Line" },
  { keys: "A", label: "Arrow" },
  { keys: "P", label: "Pen" },
  { keys: "T", label: "Text" },
  { keys: "S", label: "Sticky" },
  { keys: "⌫ / Del", label: "Delete selection" },
  { keys: "Ctrl+Z", label: "Undo" },
  { keys: "Ctrl+Shift+Z", label: "Redo" },
  { keys: "Ctrl+Scroll", label: "Zoom" },
  { keys: "Shift+drag rotate", label: "Snap to 15°" },
  { keys: "?", label: "Show this help" },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
      >
        <Keyboard className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Keyboard shortcuts</h2>
            <ul className="space-y-2">
              {SHORTCUTS.map((s) => (
                <li key={s.keys} className="flex justify-between text-sm">
                  <span className="text-neutral-600">{s.label}</span>
                  <kbd className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
