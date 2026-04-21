import { required } from "./env";
import { createDb } from "../db/client";
import {
  users,
  rooms,
  roomMembers,
  snapshots,
} from "../db/schema";
import { hashPassword } from "../password";
import * as Y from "yjs";
import { eq } from "drizzle-orm";

type SeedUser = {
  email: string;
  name: string;
  password: string;
  isAdmin?: boolean;
};

const SEED_USERS: SeedUser[] = [
  { email: "admin@canvasly.dev", name: "Admin User", password: "admin123", isAdmin: true },
  { email: "alice@canvasly.dev", name: "Alice", password: "user123" },
  { email: "bob@canvasly.dev", name: "Bob", password: "user123" },
  { email: "carol@canvasly.dev", name: "Carol", password: "user123" },
];

type SeedRoom = {
  slug: string;
  name: string;
  ownerEmail: string;
  visibility: "private" | "unlisted" | "public";
  members: { email: string; role: "editor" | "viewer" }[];
  shapes?: Array<{
    type: "rectangle" | "ellipse" | "sticky" | "text";
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    fillColor?: string;
    strokeColor?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  }>;
};

const SEED_ROOMS: SeedRoom[] = [
  {
    slug: "team-retro",
    name: "Team Retro",
    ownerEmail: "admin@canvasly.dev",
    visibility: "unlisted",
    members: [
      { email: "alice@canvasly.dev", role: "editor" },
      { email: "bob@canvasly.dev", role: "editor" },
      { email: "carol@canvasly.dev", role: "viewer" },
    ],
    shapes: [
      { type: "sticky", x: 40, y: 40, width: 160, height: 160, text: "What went well", color: "#A7F3D0" },
      { type: "sticky", x: 220, y: 40, width: 160, height: 160, text: "What didn't", color: "#FECACA" },
      { type: "sticky", x: 400, y: 40, width: 160, height: 160, text: "Action items", color: "#FDE68A" },
      { type: "text", x: 40, y: 230, width: 400, height: 24, text: "Sprint 23 — April 2026", fontSize: 20, fontFamily: "Inter, sans-serif" },
      { type: "rectangle", x: 40, y: 280, width: 520, height: 120, strokeColor: "#3B82F6", fillColor: "transparent" },
    ],
  },
  {
    slug: "design-sprint",
    name: "Design Sprint",
    ownerEmail: "alice@canvasly.dev",
    visibility: "private",
    members: [
      { email: "admin@canvasly.dev", role: "editor" },
      { email: "bob@canvasly.dev", role: "viewer" },
    ],
    shapes: [
      { type: "ellipse", x: 100, y: 100, width: 200, height: 120, strokeColor: "#8B5CF6", fillColor: "transparent" },
      { type: "text", x: 130, y: 145, width: 180, height: 30, text: "Map the problem", fontSize: 16, fontFamily: "Inter, sans-serif" },
    ],
  },
  {
    slug: "public-demo",
    name: "Public Demo",
    ownerEmail: "admin@canvasly.dev",
    visibility: "public",
    members: [],
    shapes: [
      { type: "text", x: 50, y: 50, width: 600, height: 40, text: "Anyone with this link can view.", fontSize: 24, fontFamily: "Inter, sans-serif" },
      { type: "rectangle", x: 50, y: 120, width: 140, height: 80, strokeColor: "#111", fillColor: "#E0F2FE" },
      { type: "ellipse", x: 220, y: 120, width: 140, height: 80, strokeColor: "#111", fillColor: "#FCE7F3" },
    ],
  },
];

function buildYjsSnapshot(shapes: SeedRoom["shapes"]): Uint8Array {
  const doc = new Y.Doc();
  const shapesMap = doc.getMap<Y.Map<unknown>>("shapes");
  const order = doc.getArray<string>("order");
  doc.transact(() => {
    for (const s of shapes ?? []) {
      const id = crypto.randomUUID();
      const m = new Y.Map<unknown>();
      m.set("id", id);
      m.set("type", s.type);
      m.set("x", s.x);
      m.set("y", s.y);
      m.set("width", s.width);
      m.set("height", s.height);
      m.set("rotation", 0);
      m.set("strokeColor", s.strokeColor ?? "#111111");
      m.set("fillColor", s.fillColor ?? "transparent");
      m.set("strokeWidth", 2);
      m.set("opacity", 1);
      m.set("zIndex", 0);
      if (s.text !== undefined) m.set("text", s.text);
      if (s.color !== undefined) m.set("color", s.color);
      if (s.fontSize !== undefined) m.set("fontSize", s.fontSize);
      if (s.fontFamily !== undefined) m.set("fontFamily", s.fontFamily);
      shapesMap.set(id, m);
      order.push([id]);
    }
  });
  return Y.encodeStateAsUpdate(doc);
}

async function main() {
  const databaseUrl = required("DATABASE_URL");
  const db = createDb(databaseUrl);

  console.log("→ Seeding users…");
  const userIds = new Map<string, string>();
  for (const u of SEED_USERS) {
    const hash = await hashPassword(u.password);
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length > 0) {
      await db
        .update(users)
        .set({
          name: u.name,
          passwordHash: hash,
          isAdmin: u.isAdmin ? "true" : "false",
        })
        .where(eq(users.email, u.email));
      userIds.set(u.email, existing[0]!.id);
    } else {
      const [row] = await db
        .insert(users)
        .values({
          email: u.email,
          name: u.name,
          passwordHash: hash,
          isAdmin: u.isAdmin ? "true" : "false",
        })
        .returning();
      userIds.set(u.email, row.id);
    }
    console.log(`  ${u.isAdmin ? "[admin]" : "[user] "} ${u.email}`);
  }

  console.log("→ Seeding rooms…");
  for (const r of SEED_ROOMS) {
    const ownerId = userIds.get(r.ownerEmail);
    if (!ownerId) throw new Error(`Unknown owner email: ${r.ownerEmail}`);

    const existing = await db.select().from(rooms).where(eq(rooms.slug, r.slug)).limit(1);
    let roomId: string;
    if (existing.length > 0) {
      roomId = existing[0]!.id;
      await db
        .update(rooms)
        .set({ name: r.name, visibility: r.visibility, ownerId })
        .where(eq(rooms.id, roomId));
      await db.delete(roomMembers).where(eq(roomMembers.roomId, roomId));
      await db.delete(snapshots).where(eq(snapshots.roomId, roomId));
    } else {
      const [inserted] = await db
        .insert(rooms)
        .values({
          slug: r.slug,
          name: r.name,
          ownerId,
          visibility: r.visibility,
        })
        .returning();
      roomId = inserted.id;
    }

    await db.insert(roomMembers).values({ roomId, userId: ownerId, role: "owner" }).onConflictDoNothing();
    for (const m of r.members) {
      const uid = userIds.get(m.email);
      if (!uid) continue;
      await db
        .insert(roomMembers)
        .values({ roomId, userId: uid, role: m.role })
        .onConflictDoNothing();
    }

    if (r.shapes && r.shapes.length > 0) {
      const snap = buildYjsSnapshot(r.shapes);
      await db.insert(snapshots).values({ roomId, yjsState: snap, version: 1 });
    }

    console.log(`  /${r.slug}  (${r.visibility})  owner=${r.ownerEmail}  shapes=${r.shapes?.length ?? 0}`);
  }

  console.log("\n✓ Seed complete.\n");
  console.log("Dummy credentials (email / password):");
  console.log("  admin@canvasly.dev / admin123    [admin]");
  console.log("  alice@canvasly.dev / user123");
  console.log("  bob@canvasly.dev   / user123");
  console.log("  carol@canvasly.dev / user123");

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
