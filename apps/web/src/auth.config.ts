import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/r/");
      if (!protectedRoute) return true;
      return !!auth;
    },
  },
} satisfies NextAuthConfig;
