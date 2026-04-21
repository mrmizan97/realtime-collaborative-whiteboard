"use client";
import { useEffect } from "react";
import { useUser } from "@/stores/user";

export function UserBridge({ user }: { user: { id: string; name: string; email: string; avatarUrl?: string } }) {
  useEffect(() => {
    useUser.getState().setUser(user);
    return () => useUser.getState().setUser(null);
  }, [user.id, user.name, user.email, user.avatarUrl]);
  return null;
}
