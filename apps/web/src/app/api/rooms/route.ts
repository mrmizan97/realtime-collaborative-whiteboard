import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { rooms, roomMembers } from "@canvasly/shared";
import { createRoomInput } from "@canvasly/shared";
import { eq } from "drizzle-orm";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base || "room"}-${rand}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = createRoomInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  for (let i = 0; i < 5; i++) {
    const slug = slugify(parsed.data.name);
    const existing = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
    if (existing.length > 0) continue;
    const [row] = await db
      .insert(rooms)
      .values({ slug, name: parsed.data.name, ownerId: session.user.id })
      .returning();
    await db.insert(roomMembers).values({
      roomId: row.id,
      userId: session.user.id,
      role: "owner",
    });
    return NextResponse.json({ id: row.id, slug: row.slug });
  }
  return NextResponse.json({ error: "could not generate slug" }, { status: 500 });
}
