"use client";
import { useToolStore } from "@/stores/tool";
import type { ToolName } from "@/lib/canvas/tools";
import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  Pencil,
  Type,
  ArrowRight,
  Minus,
  StickyNote,
  Frame,
  Image,
  GitBranch,
} from "lucide-react";

const TOOLS: { id: ToolName; label: string; key: string; Icon: typeof Square }[] = [
  { id: "select", label: "Select", key: "V", Icon: MousePointer2 },
  { id: "pan", label: "Pan", key: "H", Icon: Hand },
  { id: "rectangle", label: "Rect", key: "R", Icon: Square },
  { id: "ellipse", label: "Ellipse", key: "O", Icon: Circle },
  { id: "line", label: "Line", key: "L", Icon: Minus },
  { id: "arrow", label: "Arrow", key: "A", Icon: ArrowRight },
  { id: "connector", label: "Connector", key: "C", Icon: GitBranch },
  { id: "pen", label: "Pen", key: "P", Icon: Pencil },
  { id: "text", label: "Text", key: "T", Icon: Type },
  { id: "sticky", label: "Sticky", key: "S", Icon: StickyNote },
  { id: "frame", label: "Frame", key: "F", Icon: Frame },
  { id: "image", label: "Image", key: "I", Icon: Image },
];

export function Toolbar({ disabled }: { disabled?: boolean }) {
  const { active, setTool } = useToolStore();
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white border border-neutral-200 rounded-md shadow-sm flex p-1 gap-0.5">
      {TOOLS.map(({ id, label, key, Icon }) => {
        const locked = disabled && id !== "pan" && id !== "select";
        return (
          <button
            key={id}
            disabled={locked}
            onClick={() => setTool(id)}
            className={cn(
              "p-2 rounded",
              active === id ? "bg-neutral-900 text-white" : "hover:bg-neutral-100",
              locked && "opacity-40 cursor-not-allowed",
            )}
            title={`${label} (${key})`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
