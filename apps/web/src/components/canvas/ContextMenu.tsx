"use client";
import { useEffect, useState } from "react";
import { useSelectionStore } from "@/stores/selection";
import {
  bringToFront,
  deleteMany,
  getShape,
  sendToBack,
  addShape,
  groupShapes,
  ungroupShapes,
} from "@/lib/yjs/doc";
import { LOCAL_ORIGIN } from "@/lib/yjs/undo";
import type * as Y from "yjs";

type Pos = { x: number; y: number };

export function ContextMenu({ docRef }: { docRef: React.MutableRefObject<Y.Doc | null> }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const ids = useSelectionStore((s) => s.ids);

  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName !== "CANVAS") return;
      if (useSelectionStore.getState().ids.length === 0) return;
      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
    };
    const onClick = () => setPos(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null);
    };
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!pos || ids.length === 0) return null;
  const doc = docRef.current;
  if (!doc) return null;

  function run(fn: () => void) {
    fn();
    setPos(null);
  }

  const firstShape = getShape(doc, ids[0]!);
  const groupId = firstShape && "groupId" in firstShape ? firstShape.groupId : null;
  const isGrouped = !!groupId;

  const items: { label: string; action: () => void; danger?: boolean }[] = [
    { label: "Bring to front", action: () => bringToFront(doc, ids, LOCAL_ORIGIN) },
    { label: "Send to back", action: () => sendToBack(doc, ids, LOCAL_ORIGIN) },
    {
      label: "Duplicate",
      action: () => {
        const newIds: string[] = [];
        for (const id of ids) {
          const s = getShape(doc, id);
          if (!s) continue;
          const clone = { ...s, id: crypto.randomUUID(), x: s.x + 16, y: s.y + 16 };
          addShape(doc, clone, LOCAL_ORIGIN);
          newIds.push(clone.id);
        }
        useSelectionStore.getState().set(newIds);
      },
    },
    {
      label: isGrouped ? "Ungroup" : "Group",
      action: () => {
        if (isGrouped && groupId) ungroupShapes(doc, groupId, LOCAL_ORIGIN);
        else if (ids.length > 1) groupShapes(doc, ids, LOCAL_ORIGIN);
      },
    },
    {
      label: "Delete",
      danger: true,
      action: () => {
        deleteMany(doc, ids, LOCAL_ORIGIN);
        useSelectionStore.getState().clear();
      },
    },
  ];

  return (
    <div
      className="fixed z-50 bg-white border border-neutral-200 rounded-md shadow-lg py-1 text-sm min-w-[180px]"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => run(it.action)}
          className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 ${
            it.danger ? "text-red-600" : ""
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
