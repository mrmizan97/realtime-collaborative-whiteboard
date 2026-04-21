"use client";
import { create } from "zustand";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

type State = {
  status: ConnectionStatus;
  sinceMs: number;
  setStatus: (s: ConnectionStatus) => void;
};

export const useConnectionStore = create<State>((set) => ({
  status: "online",
  sinceMs: Date.now(),
  setStatus: (s) => set({ status: s, sinceMs: Date.now() }),
}));
