"use client";
import { useEffect, useRef } from "react";
import { useCallStore } from "@/stores/call";
import { useAwarenessStore } from "@/stores/awareness";

function Tile({
  stream,
  label,
  color,
  isLocal,
  muted,
  videoOff,
}: {
  stream: MediaStream | null;
  label: string;
  color: string;
  isLocal?: boolean;
  muted?: boolean;
  videoOff?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stream) el.srcObject = stream;
    if (isLocal) el.muted = true;
  }, [stream, isLocal]);

  const hasVideo = stream ? stream.getVideoTracks().length > 0 && !videoOff : false;

  return (
    <div
      className="relative w-40 h-28 rounded-md overflow-hidden shadow-md border"
      style={{ borderColor: color }}
    >
      {hasVideo ? (
        <video ref={ref} autoPlay playsInline className="w-full h-full object-cover bg-black" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white text-2xl font-semibold"
          style={{ background: color }}
        >
          {label.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="absolute left-1 bottom-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
        {label}
        {isLocal && " (you)"}
        {muted && " · muted"}
      </span>
    </div>
  );
}

export function CallTiles() {
  const { active, localStream, peerStreams, muted, cameraOff } = useCallStore();
  const peers = useAwarenessStore((s) => s.peers);
  if (!active) return null;

  return (
    <div className="absolute bottom-3 right-[200px] flex gap-2 z-40">
      <Tile stream={localStream} label="You" color="#111" isLocal muted={muted} videoOff={cameraOff} />
      {Array.from(peerStreams.values()).map((p) => {
        const peer = peers.get(p.clientId);
        return (
          <Tile
            key={p.clientId}
            stream={p.stream}
            label={peer?.user.name ?? "Peer"}
            color={peer?.user.color ?? "#6B7280"}
          />
        );
      })}
    </div>
  );
}
