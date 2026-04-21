"use client";
import { useConnectionStore } from "@/stores/connection";

export function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  if (status === "online") return null;
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white shadow-md border border-neutral-200 px-4 py-2 rounded-full text-sm">
      {status === "reconnecting" ? "Reconnecting…" : "You're offline — edits are saved locally."}
    </div>
  );
}
