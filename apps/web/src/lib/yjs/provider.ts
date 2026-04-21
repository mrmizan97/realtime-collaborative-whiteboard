"use client";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { env } from "@/env";

export type ProviderStack = {
  doc: Y.Doc;
  local: IndexeddbPersistence;
  ws: WebsocketProvider;
  destroy: () => void;
};

async function fetchToken(slug: string): Promise<{ token: string; roomId: string }> {
  const res = await fetch(`/api/rooms/${slug}/token`);
  if (!res.ok) throw new Error(`token fetch failed: ${res.status}`);
  return res.json();
}

export async function mountProviders(slug: string): Promise<ProviderStack> {
  const doc = new Y.Doc();
  const { token, roomId } = await fetchToken(slug);

  const local = new IndexeddbPersistence(`canvasly:${roomId}`, doc);
  await local.whenSynced;

  const ws = new WebsocketProvider(env.REALTIME_URL, roomId, doc, {
    params: { token, room: roomId },
    connect: true,
  });

  return {
    doc,
    local,
    ws,
    destroy: () => {
      ws.destroy();
      local.destroy();
      doc.destroy();
    },
  };
}
