"use client";
import { create } from "zustand";
import type { AwarenessState } from "@canvasly/shared";

export type PeerEntry = AwarenessState & { clientId: number };

type State = {
  peers: Map<number, PeerEntry>;
  setAll: (peers: Map<number, PeerEntry>) => void;
};

export const useAwarenessStore = create<State>((set) => ({
  peers: new Map(),
  setAll: (peers) => set({ peers: new Map(peers) }),
}));
