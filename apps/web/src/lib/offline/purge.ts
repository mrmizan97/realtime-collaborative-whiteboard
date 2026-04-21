"use client";

export async function purgeAllRoomCaches(): Promise<void> {
  if (!("indexedDB" in globalThis)) return;
  const dbs = await indexedDB.databases?.();
  if (!dbs) return;
  await Promise.all(
    dbs
      .filter((d) => d.name?.startsWith("canvasly:"))
      .map(
        (d) =>
          new Promise<void>((resolve) => {
            if (!d.name) return resolve();
            const req = indexedDB.deleteDatabase(d.name);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          }),
      ),
  );
}
