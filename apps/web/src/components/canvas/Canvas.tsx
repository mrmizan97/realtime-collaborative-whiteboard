"use client";
import { useCanvas } from "@/hooks/useCanvas";
import { CursorsOverlay } from "@/components/collab/CursorsOverlay";
import { SelectionHandles } from "@/components/canvas/SelectionHandles";
import { SnapGuides } from "@/components/canvas/SnapGuides";
import { Minimap } from "@/components/canvas/Minimap";
import { ContextMenu } from "@/components/canvas/ContextMenu";
import { ZoomControls } from "@/components/canvas/ZoomControls";
import { Reactions } from "@/components/collab/Reactions";
import { useFollowStore } from "@/stores/follow";
import { useAwarenessStore } from "@/stores/awareness";

export function Canvas({ slug }: { slug: string }) {
  const { canvasRef, docRef, wsRef } = useCanvas(slug);
  const followingClientId = useFollowStore((s) => s.followingClientId);
  const stopFollowing = useFollowStore((s) => s.follow);
  const peers = useAwarenessStore((s) => s.peers);
  const following = followingClientId != null ? peers.get(followingClientId) : null;

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
      <SnapGuides />
      <SelectionHandles docRef={docRef} />
      <CursorsOverlay />
      <Reactions wsRef={wsRef} />
      <Minimap docRef={docRef} />
      <ZoomControls docRef={docRef} />
      <ContextMenu docRef={docRef} />
      {following && (
        <button
          onClick={() => stopFollowing(null)}
          className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-white text-xs shadow-md flex items-center gap-2 cursor-pointer z-40"
          style={{ background: following.user.color }}
        >
          Following {following.user.name} · click to stop
        </button>
      )}
    </>
  );
}
