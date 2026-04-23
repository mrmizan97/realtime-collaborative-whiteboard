import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { snapshots } from "@canvasly/shared";
import { resolveRoomAccess } from "@/server/rooms";
import { and, eq } from "drizzle-orm";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ slug: string; snapshotId: string }> },
) {
  const { slug, snapshotId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access || access.role === "viewer") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const [snap] = await db
    .select()
    .from(snapshots)
    .where(and(eq(snapshots.id, snapshotId), eq(snapshots.roomId, access.room.id)))
    .limit(1);
  if (!snap) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Restore = write a new snapshot with the old state as the newest row.
  await db.insert(snapshots).values({
    roomId: access.room.id,
    yjsState: snap.yjsState,
    version: snap.version + 1,
  });
  return NextResponse.json({ ok: true });
}
