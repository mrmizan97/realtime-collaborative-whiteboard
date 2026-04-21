"use client";
import { signOut } from "next-auth/react";
import { purgeAllRoomCaches } from "@/lib/offline/purge";
import { useUser } from "@/stores/user";

export function UserMenu() {
  const user = useUser((s) => s.user);
  if (!user) return null;

  async function handleSignOut() {
    await purgeAllRoomCaches();
    signOut({ callbackUrl: "/" });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-neutral-600">{user.name}</div>
      <button
        onClick={handleSignOut}
        className="text-sm px-2.5 py-1 border border-neutral-300 rounded-md hover:bg-neutral-50"
      >
        Sign out
      </button>
    </div>
  );
}
