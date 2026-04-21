import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { rooms } from "@canvasly/shared";
import { updateRoomInput } from "@canvasly/shared";
import { resolveRoomAccess } from "@/server/rooms";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = updateRoomInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  await db.update(rooms).set(parsed.data).where(eq(rooms.id, access.room.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await db.delete(rooms).where(eq(rooms.id, access.room.id));
  return NextResponse.json({ ok: true });
}
