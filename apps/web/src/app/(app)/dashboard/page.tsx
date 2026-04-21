import { auth } from "@/auth";
import { listMyRooms } from "@/server/rooms";
import Link from "next/link";
import { NewRoomDialog } from "./NewRoomDialog";
import { UserMenu } from "@/components/ui/UserMenu";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const roomList = await listMyRooms(session.user.id);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your rooms</h1>
        <div className="flex items-center gap-4">
          <UserMenu />
          <NewRoomDialog />
        </div>
      </div>

      {roomList.length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <p className="mb-4">No rooms yet.</p>
          <NewRoomDialog variant="cta" />
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomList.map((r) => (
            <li key={r.id}>
              <Link
                href={`/r/${r.slug}`}
                className="block p-5 border border-neutral-200 rounded-lg hover:border-neutral-400 transition"
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-neutral-500 mt-1">
                  /{r.slug} <span className="ml-2">· {r.visibility}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
