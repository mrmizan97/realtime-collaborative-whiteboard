import { NextResponse } from "next/server";
import { z } from "zod";
import * as Y from "yjs";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { rooms, roomMembers, snapshots } from "@canvasly/shared";
import { eq } from "drizzle-orm";
import { getTemplate } from "@/lib/rooms/templates";

const createRoomBody = z.object({
  name: z.string().trim().min(1).max(120),
  template: z.string().optional(),
});

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base || "room"}-${rand}`;
}

function buildTemplateSnapshot(templateId: string): Uint8Array | null {
  const t = getTemplate(templateId);
  if (!t || t.shapes.length === 0) return null;
  const doc = new Y.Doc();
  const shapesMap = doc.getMap<Y.Map<unknown>>("shapes");
  const order = doc.getArray<string>("order");
  doc.transact(() => {
    for (const s of t.shapes) {
      const id = crypto.randomUUID();
      const m = new Y.Map<unknown>();
      m.set("id", id);
      for (const [k, v] of Object.entries(s)) m.set(k, v);
      shapesMap.set(id, m);
      order.push([id]);
    }
  });
  return Y.encodeStateAsUpdate(doc);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = createRoomBody.safeParse(await req.json());
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

    if (parsed.data.template) {
      const snap = buildTemplateSnapshot(parsed.data.template);
      if (snap) {
        await db.insert(snapshots).values({
          roomId: row.id,
          yjsState: snap,
          version: 1,
        });
      }
    }
    return NextResponse.json({ id: row.id, slug: row.slug });
  }
  return NextResponse.json({ error: "could not generate slug" }, { status: 500 });
}
