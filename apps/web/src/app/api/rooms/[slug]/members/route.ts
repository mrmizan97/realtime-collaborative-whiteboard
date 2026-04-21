import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { roomMembers, users, rooms, roleEnum } from "@canvasly/shared";
import { resolveRoomAccess } from "@/server/rooms";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["editor", "viewer"]),
});

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await db
    .select({
      userId: roomMembers.userId,
      role: roomMembers.role,
      email: users.email,
      name: users.name,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .where(eq(roomMembers.roomId, access.room.id));
  return NextResponse.json({ members: rows });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  await db
    .update(roomMembers)
    .set({ role: parsed.data.role })
    .where(
      and(eq(roomMembers.roomId, access.room.id), eq(roomMembers.userId, parsed.data.userId)),
    );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, access.room.id), eq(roomMembers.userId, userId)));
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const schema = z.object({
    email: z.string().email(),
    role: z.enum(["editor", "viewer"]).default("editor"),
  });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const [target] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!target) return NextResponse.json({ error: "user not found" }, { status: 404 });

  await db
    .insert(roomMembers)
    .values({ roomId: access.room.id, userId: target.id, role: parsed.data.role })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
