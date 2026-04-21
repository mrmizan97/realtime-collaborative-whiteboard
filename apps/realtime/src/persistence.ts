import { createDb, snapshots, updateLog } from "@canvasly/shared";
import { eq, desc, lt } from "drizzle-orm";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const db = DATABASE_URL ? createDb(DATABASE_URL) : null;

export async function loadLatestSnapshot(roomId: string): Promise<Uint8Array | null> {
  if (!db) return null;
  const [row] = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.roomId, roomId))
    .orderBy(desc(snapshots.createdAt))
    .limit(1);
  return row?.yjsState ?? null;
}

export async function writeSnapshot(roomId: string, state: Uint8Array): Promise<void> {
  if (!db) return;
  const start = Date.now();
  try {
    await db.insert(snapshots).values({ roomId, yjsState: state, version: 1 });
    await db.delete(updateLog).where(eq(updateLog.roomId, roomId));
    metrics.incSnapshotOk();
    logger.debug({ roomId, ms: Date.now() - start }, "snapshot written");
  } catch (err) {
    metrics.incSnapshotErr();
    logger.error({ err, roomId }, "snapshot write failed");
  }
}

export async function appendUpdate(
  roomId: string,
  update: Uint8Array,
  originUserId: string | null,
): Promise<void> {
  if (!db) return;
  try {
    await db.insert(updateLog).values({ roomId, yjsUpdate: update, originUserId });
  } catch (err) {
    logger.error({ err, roomId }, "update log append failed");
  }
}

export async function gcOldUpdates(roomId: string, before: Date): Promise<void> {
  if (!db) return;
  await db
    .delete(updateLog)
    .where(eq(updateLog.roomId, roomId))
    .where(lt(updateLog.createdAt, before));
}
