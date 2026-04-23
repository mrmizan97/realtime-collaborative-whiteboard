"use client";
import { create } from "zustand";

type State = {
  followingClientId: number | null;
  follow: (clientId: number | null) => void;
};

export const useFollowStore = create<State>((set) => ({
  followingClientId: null,
  follow: (clientId) => set({ followingClientId: clientId }),
}));
