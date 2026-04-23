"use client";
import { useEffect, useRef } from "react";
import type * as Y from "yjs";
import { Canvas } from "@/components/canvas/Canvas";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ConnectionBanner } from "@/components/collab/ConnectionBanner";
import { PresenceAvatars } from "@/components/collab/PresenceAvatars";
import { CommentsPanel } from "@/components/collab/CommentsPanel";
import { CallBar } from "@/components/collab/CallBar";
import { CallTiles } from "@/components/collab/CallTiles";
import { ShareDialog } from "./ShareDialog";
import { SettingsDrawer } from "./SettingsDrawer";
import { ExportDialog } from "@/components/panels/ExportDialog";
import { ShortcutsHelp } from "@/components/panels/ShortcutsHelp";
import { HistoryPanel } from "@/components/panels/HistoryPanel";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { CommandPalette } from "@/components/panels/CommandPalette";
import { useDocStore } from "@/stores/doc";
import { touchRecent } from "@/lib/rooms/recent";
import type { Visibility } from "@canvasly/shared";

export function CanvasPage({
  slug,
  roomName,
  role,
  visibility,
}: {
  slug: string;
  roomName: string;
  role: "owner" | "editor" | "viewer";
  visibility: Visibility;
}) {
  const doc = useDocStore((s) => s.doc);
  const docRef = useRef<Y.Doc | null>(null);
  docRef.current = doc;

  useEffect(() => {
    touchRecent({ id: slug, slug, name: roomName });
  }, [slug, roomName]);

  return (
    <div className="fixed inset-0 bg-canvas-bg">
      <Canvas slug={slug} />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/80 backdrop-blur px-3 py-1.5 rounded-md shadow-sm text-sm">
          {roomName} <span className="text-neutral-400">· {role}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <PresenceAvatars />
          <CallBar />
          <CommentsPanel docRef={docRef} />
          <LayersPanel docRef={docRef} />
          <HistoryPanel slug={slug} />
          <ShortcutsHelp />
          <ExportDialog slug={slug} docRef={docRef} />
          <ShareDialog slug={slug} initialVisibility={visibility} />
          <SettingsDrawer slug={slug} initialName={roomName} isOwner={role === "owner"} />
        </div>
      </div>

      <Toolbar disabled={role === "viewer"} />
      <ConnectionBanner />
      <CallTiles />
      <CommandPalette />
    </div>
  );
}
