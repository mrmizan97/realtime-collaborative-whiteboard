import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listMyRooms } from "@/server/rooms";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const list = await listMyRooms(session.user.id);
  return NextResponse.json({ rooms: list });
}
