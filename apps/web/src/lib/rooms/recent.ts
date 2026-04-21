"use client";
const KEY = "canvasly:recent";
const CAP = 10;

export type RecentRoom = { id: string; slug: string; name: string; openedAt: number };

export function getRecent(): RecentRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentRoom[]) : [];
  } catch {
    return [];
  }
}

export function touchRecent(room: Omit<RecentRoom, "openedAt">): void {
  if (typeof window === "undefined") return;
  const prev = getRecent().filter((r) => r.id !== room.id);
  const next = [{ ...room, openedAt: Date.now() }, ...prev].slice(0, CAP);
  localStorage.setItem(KEY, JSON.stringify(next));
}
