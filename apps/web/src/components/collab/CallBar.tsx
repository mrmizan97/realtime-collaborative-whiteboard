"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCallStore } from "@/stores/call";
import { useDocStore } from "@/stores/doc";
import { Mesh, getLocalMedia } from "@/lib/webrtc/mesh";

export function CallBar() {
  const ws = useDocStore((s) => s.ws);
  const { active, kind, muted, cameraOff, toggleMute, toggleCamera, setActive, reset, peerStreams } =
    useCallStore();
  const meshRef = useRef<Mesh | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function join(callKind: "audio" | "video") {
    if (!ws) return;
    setBusy(true);
    setErr(null);
    try {
      const stream = await getLocalMedia(callKind);
      setActive(callKind, stream);
      const mesh = new Mesh(ws, stream);
      mesh.start();
      meshRef.current = mesh;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not access mic/camera");
    } finally {
      setBusy(false);
    }
  }

  function leave() {
    const mesh = meshRef.current;
    if (mesh) {
      mesh.announceBye();
      mesh.stop();
      meshRef.current = null;
    }
    const local = useCallStore.getState().localStream;
    if (local) for (const t of local.getTracks()) t.stop();
    reset();
  }

  useEffect(() => () => leave(), []);

  if (!active) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => join("audio")}
          disabled={busy || !ws}
          title="Start voice call"
          className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white disabled:opacity-50"
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => join("video")}
          disabled={busy || !ws}
          title="Start video call"
          className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5" />
        </button>
        {err && (
          <span className="text-xs text-red-600 ml-2" title={err}>
            ⚠
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-md px-1.5 py-0.5">
      <span className="text-xs text-green-900 font-medium pr-1">
        {kind === "video" ? "Video" : "Voice"} · {peerStreams.size + 1}
      </span>
      <button
        onClick={toggleMute}
        title={muted ? "Unmute" : "Mute"}
        className="p-1 hover:bg-green-100 rounded"
      >
        {muted ? <MicOff className="w-3.5 h-3.5 text-red-600" /> : <Mic className="w-3.5 h-3.5" />}
      </button>
      {kind === "video" && (
        <button
          onClick={toggleCamera}
          title={cameraOff ? "Camera on" : "Camera off"}
          className="p-1 hover:bg-green-100 rounded"
        >
          {cameraOff ? (
            <VideoOff className="w-3.5 h-3.5 text-red-600" />
          ) : (
            <Video className="w-3.5 h-3.5" />
          )}
        </button>
      )}
      <button
        onClick={leave}
        title="Leave call"
        className="p-1 hover:bg-red-100 rounded"
      >
        <PhoneOff className="w-3.5 h-3.5 text-red-600" />
      </button>
    </div>
  );
}
