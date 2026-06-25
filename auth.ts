import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import {
  customerAccountQuery,
  refreshShopifyAccessToken,
} from "@/lib/shopify-account";

const CUSTOMER_QUERY = `
  query {
    customer {
      firstName
      lastName
    }
  }
`;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    {
      id: "shopify",
      name: "Shopify",
      type: "oauth",
      issuer: `https://${process.env.SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN}`,
      clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID,
      clientSecret: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET,
      authorization: {
        url: `https://${process.env.SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN}/oauth/authorize`,
        params: {
          scope: "openid email customer-account-api:full",
          prompt: "login",
        },
      },
      token: {
        url: `https://${process.env.SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN}/oauth/token`,
        conform: async (response: Response) => response,
      },
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      userinfo: {
        async request({ tokens }: { tokens: { id_token?: string } }) {
          const idToken = tokens.id_token as string;
          const payload = JSON.parse(
            Buffer.from(idToken.split(".")[1], "base64url").toString(),
          );
          return payload;
        },
      },
      checks: ["state", "pkce"],
      profile(profile: { sub: string; email: string }) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.email,
        };
      },
    } as any, // remove this once you confirm it connects — silences a TS shape mismatch, doesn't affect runtime
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.shopifyAccessToken = account.access_token;
        token.shopifyRefreshToken = account.refresh_token;
        token.shopifyTokenExpiresAt = account.expires_at;
        token.shopifyIdToken = account.id_token;
        try {
          const result = await customerAccountQuery(
            account.access_token!,
            CUSTOMER_QUERY,
          );
          const first = result?.data?.customer?.firstName ?? "";
          const last = result?.data?.customer?.lastName ?? "";
          token.shopifyCustomerName =
            [first, last].filter(Boolean).join(" ") || undefined;
        } catch {
          // name fetch failed, fallback to email on frontend
        }
      }

      if (token.shopifyTokenExpiresAt && token.shopifyRefreshToken) {
        const expiresAtMs = (token.shopifyTokenExpiresAt as number) * 1000;
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() > expiresAtMs - fiveMinutes) {
          const renewed = await refreshShopifyAccessToken(
            token.shopifyRefreshToken as string,
          );
          if (renewed) {
            token.shopifyAccessToken = renewed.access_token;
            token.shopifyRefreshToken = renewed.refresh_token;
            token.shopifyTokenExpiresAt =
              Math.floor(Date.now() / 1000) + renewed.expires_in;
          } else {
            token.shopifyAccessToken = undefined; // force re-login
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.shopifyAccessToken = token.shopifyAccessToken as
        | string
        | undefined;
      session.shopifyIdToken = token.shopifyIdToken as string | undefined;
      session.shopifyCustomerName = token.shopifyCustomerName as
        | string
        | undefined;
      return session;
    },
  },
  session: { strategy: "jwt" },
  events: {
    async signOut() {
      // ensure jwt is cleared on sign out
    },
  },
});
