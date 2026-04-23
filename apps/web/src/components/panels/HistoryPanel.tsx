"use client";
import { useEffect, useState } from "react";
import { History, X, RotateCcw } from "lucide-react";

type Snap = { id: string; createdAt: string; version: number };

export function HistoryPanel({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/rooms/${slug}/snapshots`);
    if (!res.ok) return;
    const d = await res.json();
    setSnaps(d.snapshots ?? []);
  }

  useEffect(() => {
    if (open) load();
  }, [open, slug]);

  async function restore(id: string) {
    if (!confirm("Restore this version? The realtime server will broadcast it on the next sync.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/rooms/${slug}/snapshots/${id}/restore`, { method: "POST" });
      if (res.ok) {
        setMsg("Restored. Refresh to see.");
        await load();
      } else {
        setMsg(`Failed (${res.status})`);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Version history"
        className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
      >
        <History className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="fixed right-3 top-14 bottom-3 w-72 bg-white border border-neutral-200 rounded-md shadow-lg z-40 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">Version history</h3>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-neutral-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          {msg && (
            <div className="px-3 py-2 text-xs bg-amber-50 text-amber-900 border-b border-amber-200">
              {msg}
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {snaps.length === 0 && (
              <p className="p-3 text-xs text-neutral-500">No snapshots yet. One is written on every 50 updates or 2s of idle.</p>
            )}
            <ul>
              {snaps.map((s, i) => (
                <li key={s.id} className="px-3 py-2 border-b text-sm flex items-center justify-between hover:bg-neutral-50">
                  <div>
                    <div>{new Date(s.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-neutral-500">
                      {i === 0 ? "Current" : `v${s.version}`}
                    </div>
                  </div>
                  {i !== 0 && (
                    <button
                      onClick={() => restore(s.id)}
                      disabled={busy === s.id}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
