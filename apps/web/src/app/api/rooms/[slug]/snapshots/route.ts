import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { snapshots } from "@canvasly/shared";
import { resolveRoomAccess } from "@/server/rooms";
import { eq, desc } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await db
    .select({
      id: snapshots.id,
      createdAt: snapshots.createdAt,
      version: snapshots.version,
    })
    .from(snapshots)
    .where(eq(snapshots.roomId, access.room.id))
    .orderBy(desc(snapshots.createdAt))
    .limit(50);
  return NextResponse.json({ snapshots: rows });
}
