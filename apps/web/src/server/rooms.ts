import "server-only";
import { db } from "./db";
import { roomMembers, rooms } from "@canvasly/shared";
import { and, eq, or, sql } from "drizzle-orm";

export async function getMembership(roomId: string, userId: string) {
  const [row] = await db
    .select({ role: roomMembers.role })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}

export async function resolveRoomAccess(slug: string, userId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
  if (!room) return null;
  if (room.ownerId === userId) return { room, role: "owner" as const };
  const role = await getMembership(room.id, userId);
  if (role) return { room, role };
  if (room.visibility === "public") return { room, role: "viewer" as const };
  return null;
}

export async function listMyRooms(userId: string) {
  const rs = await db
    .selectDistinct({
      id: rooms.id,
      slug: rooms.slug,
      name: rooms.name,
      visibility: rooms.visibility,
      ownerId: rooms.ownerId,
    })
    .from(rooms)
    .leftJoin(roomMembers, eq(roomMembers.roomId, rooms.id))
    .where(or(eq(rooms.ownerId, userId), eq(roomMembers.userId, userId)));
  return rs;
}
