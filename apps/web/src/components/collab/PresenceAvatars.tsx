"use client";
import { useAwarenessStore } from "@/stores/awareness";

export function PresenceAvatars() {
  const peers = useAwarenessStore((s) => s.peers);
  const list = Array.from(peers.values()).slice(0, 5);
  if (list.length === 0) return null;
  return (
    <div className="flex -space-x-2">
      {list.map((p) => (
        <div
          key={p.clientId}
          title={p.user.name}
          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-medium text-white"
          style={{ background: p.user.color, opacity: p.viewing ? 1 : 0.5 }}
        >
          {p.user.name.slice(0, 1).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
