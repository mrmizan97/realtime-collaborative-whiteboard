import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { UserBridge } from "./UserBridge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return (
    <SessionProvider session={session}>
      <UserBridge
        user={{
          id: session.user.id,
          name: session.user.name ?? "Anonymous",
          email: session.user.email,
          avatarUrl: session.user.image ?? undefined,
        }}
      />
      {children}
    </SessionProvider>
  );
}
