"use client";
import { useAwarenessStore } from "@/stores/awareness";
import { useFollowStore } from "@/stores/follow";

export function PresenceAvatars() {
  const peers = useAwarenessStore((s) => s.peers);
  const { followingClientId, follow } = useFollowStore();
  const list = Array.from(peers.values()).slice(0, 5);
  if (list.length === 0) return null;
  return (
    <div className="flex -space-x-2">
      {list.map((p) => {
        const following = followingClientId === p.clientId;
        return (
          <button
            key={p.clientId}
            title={following ? `Stop following ${p.user.name}` : `Follow ${p.user.name}`}
            onClick={() => follow(following ? null : p.clientId)}
            className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-medium text-white hover:scale-110 transition-transform"
            style={{
              background: p.user.color,
              borderColor: following ? "#111" : "#fff",
              opacity: p.viewing ? 1 : 0.5,
            }}
          >
            {p.user.name.slice(0, 1).toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
