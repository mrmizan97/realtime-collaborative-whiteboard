"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Download } from "lucide-react";
import { exportPng } from "@/lib/export/png";
import { exportSvg } from "@/lib/export/svg";
import { filename } from "@/lib/export/filename";
import { listShapesInOrder } from "@/lib/yjs/doc";
import { useSelectionStore } from "@/stores/selection";
import type * as Y from "yjs";

type Scope = "all" | "selection";
type Format = "png" | "svg";

export function ExportDialog({ slug, docRef }: { slug: string; docRef: React.MutableRefObject<Y.Doc | null> }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [format, setFormat] = useState<Format>("png");
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = useSelectionStore((s) => s.ids);

  async function doExport() {
    const doc = docRef.current;
    if (!doc) return;
    setBusy(true);
    try {
      const all = listShapesInOrder(doc);
      const shapes = scope === "selection" ? all.filter((s) => selected.includes(s.id)) : all;
      if (shapes.length === 0) return;

      if (format === "png") {
        const blob = await exportPng(shapes, { scale, transparent });
        trigger(blob, filename(slug, scope, "png"));
      } else {
        const svg = exportSvg(shapes);
        const blob = new Blob([svg], { type: "image/svg+xml" });
        trigger(blob, filename(slug, scope, "svg"));
      }
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <DialogContent title="Export">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="w-full mt-1.5 px-3 py-2 border border-neutral-300 rounded-md text-sm"
            >
              <option value="all">Entire canvas</option>
              <option value="selection" disabled={selected.length === 0}>
                Selection ({selected.length})
              </option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Format</label>
            <div className="flex gap-2 mt-1.5">
              {(["png", "svg"] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 px-3 py-2 border rounded-md text-sm ${
                    format === f ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {format === "png" && (
            <>
              <div>
                <label className="text-sm font-medium">Scale</label>
                <div className="flex gap-2 mt-1.5">
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={`flex-1 px-3 py-2 border rounded-md text-sm ${
                        scale === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                />
                Transparent background
              </label>
            </>
          )}

          <button
            onClick={doExport}
            disabled={busy}
            className="w-full px-3 py-2 bg-neutral-900 text-white rounded-md text-sm disabled:opacity-50"
          >
            {busy ? "Exporting…" : "Download"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function trigger(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
