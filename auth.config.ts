// auth.config.ts — project root
// Edge-safe subset of auth used ONLY by middleware.
// No mongodb, no crypto, no Node-only imports.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/account/login",
    error: "/account/login",
  },
  callbacks: {
    async session({ session, token }) {
      (session as any).shopifyAccessToken = token.shopifyAccessToken;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAccountRoute = nextUrl.pathname.startsWith("/account");
      const isAuthRoute =
        nextUrl.pathname === "/account/login" ||
        nextUrl.pathname === "/account/signup";

      if (isLoggedIn && isAuthRoute) {
        return Response.redirect(new URL("/account", nextUrl));
      }

      if (!isLoggedIn && isAccountRoute && !isAuthRoute) {
        const loginUrl = new URL("/account/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
  providers: [], // filled in by auth.ts
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `__Secure-authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
} satisfies NextAuthConfig;
