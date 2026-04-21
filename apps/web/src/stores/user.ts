"use client";
import { create } from "zustand";

type User = { id: string; name: string; email: string; avatarUrl?: string };

type State = {
  user: User | null;
  setUser: (u: User | null) => void;
};

export const useUser = create<State>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
}));
