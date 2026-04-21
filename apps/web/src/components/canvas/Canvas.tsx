"use client";
import { useCanvas } from "@/hooks/useCanvas";
import { CursorsOverlay } from "@/components/collab/CursorsOverlay";
import { SelectionHandles } from "@/components/canvas/SelectionHandles";

export function Canvas({ slug }: { slug: string }) {
  const { canvasRef, docRef } = useCanvas(slug);
  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
      <SelectionHandles docRef={docRef} />
      <CursorsOverlay />
    </>
  );
}
