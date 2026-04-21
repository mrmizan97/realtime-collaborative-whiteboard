"use client";
import { create } from "zustand";

type State = {
  ids: string[];
  set: (ids: string[]) => void;
  toggle: (id: string, additive: boolean) => void;
  clear: () => void;
};

export const useSelectionStore = create<State>((set, get) => ({
  ids: [],
  set: (ids) => set({ ids }),
  toggle: (id, additive) => {
    const cur = get().ids;
    if (!additive) return set({ ids: [id] });
    const exists = cur.includes(id);
    set({ ids: exists ? cur.filter((x) => x !== id) : [...cur, id] });
  },
  clear: () => set({ ids: [] }),
}));
