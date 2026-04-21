"use client";
import type { WebsocketProvider } from "y-websocket";
import { useConnectionStore } from "@/stores/connection";

export function bindConnectionStatus(ws: WebsocketProvider): () => void {
  let reconnectingTimer: ReturnType<typeof setTimeout> | null = null;
  let offlineTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (reconnectingTimer) clearTimeout(reconnectingTimer);
    if (offlineTimer) clearTimeout(offlineTimer);
    reconnectingTimer = null;
    offlineTimer = null;
  };

  const onStatus = ({ status }: { status: string }) => {
    clearTimers();
    if (status === "connected") {
      useConnectionStore.getState().setStatus("online");
      return;
    }
    reconnectingTimer = setTimeout(() => {
      useConnectionStore.getState().setStatus("reconnecting");
    }, 3000);
    offlineTimer = setTimeout(() => {
      useConnectionStore.getState().setStatus("offline");
    }, 30000);
  };

  ws.on("status", onStatus);
  return () => {
    ws.off("status", onStatus);
    clearTimers();
  };
}
