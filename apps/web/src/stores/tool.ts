"use client";
import { create } from "zustand";
import type { ToolName } from "@/lib/canvas/tools";

type State = {
  active: ToolName;
  setTool: (t: ToolName) => void;
};

export const useToolStore = create<State>((set) => ({
  active: "select",
  setTool: (t) => set({ active: t }),
}));
