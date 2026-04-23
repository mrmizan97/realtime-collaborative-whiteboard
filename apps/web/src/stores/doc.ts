"use client";
import { create } from "zustand";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

type State = {
  doc: Y.Doc | null;
  ws: WebsocketProvider | null;
  set: (doc: Y.Doc | null, ws: WebsocketProvider | null) => void;
};

export const useDocStore = create<State>((set) => ({
  doc: null,
  ws: null,
  set: (doc, ws) => set({ doc, ws }),
}));
