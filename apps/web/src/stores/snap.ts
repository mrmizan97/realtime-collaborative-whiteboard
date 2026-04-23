"use client";
import { create } from "zustand";
import type { SnapLine } from "@/lib/canvas/snap";

type State = {
  lines: SnapLine[];
  set: (lines: SnapLine[]) => void;
  clear: () => void;
};

export const useSnapStore = create<State>((set) => ({
  lines: [],
  set: (lines) => set({ lines }),
  clear: () => set({ lines: [] }),
}));
