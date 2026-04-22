import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveRoomAccess } from "@/server/rooms";
import { signRealtimeToken } from "@canvasly/shared/jwt";
import { env } from "@/env";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const TTL_SECONDS = 4 * 60 * 60;
  const { token, expiresAt } = await signRealtimeToken(
    env.JWT_SECRET(),
    {
      sub: session.user.id,
      room: access.room.id,
      role: access.role,
    },
    TTL_SECONDS,
  );
  return NextResponse.json({ token, expiresAt, roomId: access.room.id });
}
