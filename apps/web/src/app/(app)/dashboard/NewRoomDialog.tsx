"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/rooms/templates";

export function NewRoomDialog({ variant = "default" }: { variant?: "default" | "cta" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("blank");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, template }),
      });
      if (!res.ok) throw new Error("create failed");
      const { slug } = (await res.json()) as { slug: string };
      router.push(`/r/${slug}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === "cta"
            ? "px-5 py-2.5 bg-neutral-900 text-white rounded-md"
            : "px-3 py-1.5 bg-neutral-900 text-white rounded-md text-sm"
        }
      >
        New room
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">Create a new room</h2>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room name"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              required
              minLength={1}
              maxLength={120}
            />
            <div>
              <label className="text-sm font-medium text-neutral-700">Template</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TEMPLATES.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`text-left p-3 border rounded-md text-sm transition ${
                      template === t.id
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-neutral-500 mt-1">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-3 py-1.5 text-sm bg-neutral-900 text-white rounded-md disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
