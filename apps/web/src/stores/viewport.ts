"use client";
import { create } from "zustand";
import type { Viewport } from "@/lib/canvas/viewport";

type State = {
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
};

export const useViewportStore = create<State>((set) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (v) => set({ viewport: v }),
}));
