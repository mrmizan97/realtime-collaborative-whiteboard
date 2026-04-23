"use client";
import type { WebsocketProvider } from "y-websocket";

export type Signal = {
  id: string;
  from: number;
  to: number;
  kind: "offer" | "answer" | "candidate" | "bye";
  data: unknown;
};

const FIELD = "rtcSignals";

export function sendSignal(ws: WebsocketProvider, signal: Omit<Signal, "from">) {
  const my = ws.awareness.clientID;
  const state = (ws.awareness.getLocalState() ?? {}) as Record<string, unknown>;
  const existing = (state[FIELD] as Signal[] | undefined) ?? [];
  const kept = existing.filter((s) => Date.now() - Number(s.id.split("-")[0] ?? 0) < 10_000);
  const next = [...kept, { ...signal, from: my }];
  ws.awareness.setLocalStateField(FIELD, next);
}

export function clearMyOldSignals(ws: WebsocketProvider) {
  const state = (ws.awareness.getLocalState() ?? {}) as Record<string, unknown>;
  const existing = (state[FIELD] as Signal[] | undefined) ?? [];
  const fresh = existing.filter((s) => Date.now() - Number(s.id.split("-")[0] ?? 0) < 5_000);
  if (fresh.length !== existing.length) ws.awareness.setLocalStateField(FIELD, fresh);
}

export function subscribeSignals(
  ws: WebsocketProvider,
  handler: (s: Signal) => void,
): () => void {
  const processed = new Set<string>();
  const my = ws.awareness.clientID;
  const onChange = () => {
    const states = ws.awareness.getStates();
    states.forEach((v, clientId) => {
      if (clientId === my) return;
      const arr = ((v as Record<string, unknown>)[FIELD] as Signal[] | undefined) ?? [];
      for (const sig of arr) {
        if (sig.to !== my) continue;
        if (processed.has(sig.id)) continue;
        processed.add(sig.id);
        handler(sig);
      }
    });
  };
  ws.awareness.on("change", onChange);
  return () => ws.awareness.off("change", onChange);
}

export function signalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
