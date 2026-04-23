"use client";
import { useEffect, useState } from "react";
import type * as Y from "yjs";
import { Layers, X } from "lucide-react";
import { getOrder, listShapesInOrder } from "@/lib/yjs/doc";
import { LOCAL_ORIGIN } from "@/lib/yjs/undo";
import { useSelectionStore } from "@/stores/selection";
import type { Shape } from "@canvasly/shared";

const TYPE_LABEL: Record<string, string> = {
  rectangle: "Rect",
  ellipse: "Ellipse",
  arrow: "Arrow",
  line: "Line",
  pen: "Pen",
  text: "Text",
  sticky: "Sticky",
  frame: "Frame",
  image: "Image",
};

export function LayersPanel({ docRef }: { docRef: React.MutableRefObject<Y.Doc | null> }) {
  const [open, setOpen] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const selection = useSelectionStore((s) => s.ids);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !open) return;
    const read = () => setShapes([...listShapesInOrder(doc)].reverse());
    read();
    doc.on("update", read);
    return () => doc.off("update", read);
  }, [docRef, open]);

  function move(id: string, delta: number) {
    const doc = docRef.current;
    if (!doc) return;
    const order = getOrder(doc);
    const arr = order.toArray();
    const idx = arr.indexOf(id);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(arr.length - 1, idx + delta));
    if (newIdx === idx) return;
    doc.transact(() => {
      order.delete(idx, 1);
      order.insert(newIdx, [id]);
    }, LOCAL_ORIGIN);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Layers"
        className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
      >
        <Layers className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="fixed right-3 top-14 bottom-3 w-64 bg-white border border-neutral-200 rounded-md shadow-lg z-40 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">Layers</h3>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-neutral-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="flex-1 overflow-auto">
            {shapes.map((s) => {
              const label =
                (s.type === "text" && s.text) ||
                (s.type === "sticky" && s.text) ||
                (s.type === "frame" && s.label) ||
                TYPE_LABEL[s.type];
              const selected = selection.includes(s.id);
              return (
                <li
                  key={s.id}
                  onClick={() => useSelectionStore.getState().set([s.id])}
                  className={`px-3 py-1.5 text-sm flex items-center justify-between cursor-pointer border-b ${
                    selected ? "bg-blue-50" : "hover:bg-neutral-50"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{label}</span>
                  <span className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        move(s.id, 1);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        move(s.id, -1);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900"
                    >
                      ↓
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
