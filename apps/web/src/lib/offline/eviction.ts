"use client";
const MAX_BYTES = 200 * 1024 * 1024;

export async function maybeEvict(): Promise<void> {
  if (!("storage" in navigator)) return;
  const est = await navigator.storage.estimate();
  if ((est.usage ?? 0) < MAX_BYTES) return;
  // v1: simple global purge. v2: by-room LRU using a side table.
}
