import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db";
import { users } from "@canvasly/shared";
import { verifyPassword } from "@canvasly/shared/password";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";

const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { default: Google } = await import("next-auth/providers/google");
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  const { default: Email } = await import("next-auth/providers/nodemailer");
  providers.push(
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

if (process.env.DEV_CREDENTIALS_LOGIN === "true") {
  providers.push(
    Credentials({
      name: "Dev login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!row?.passwordHash) return null;
        const ok = await verifyPassword(password, row.passwordHash);
        if (!ok) return null;
        return {
          id: row.id,
          email: row.email,
          name: row.name ?? null,
          image: row.avatarUrl ?? null,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session }) {
      if (!session.user?.email) return session;
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);
      if (row) {
        session.user.id = row.id;
        session.user.name = row.name ?? session.user.name;
        session.user.image = row.avatarUrl ?? session.user.image;
        session.user.isAdmin = row.isAdmin === "true";
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    };
  }
}
