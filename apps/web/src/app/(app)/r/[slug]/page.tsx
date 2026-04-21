import { auth } from "@/auth";
import { resolveRoomAccess } from "@/server/rooms";
import { notFound } from "next/navigation";
import { CanvasPage } from "./CanvasPage";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;
  const access = await resolveRoomAccess(slug, session.user.id);
  if (!access) notFound();
  return (
    <CanvasPage
      slug={slug}
      roomName={access.room.name}
      role={access.role}
      visibility={access.room.visibility}
    />
  );
}
