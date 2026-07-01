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
    async signIn({ account }) {
      if (!account?.id_token) return true;
      try {
        const idPayload = JSON.parse(
          Buffer.from(account.id_token.split(".")[1], "base64url").toString(),
        );
        const shopifyCustomerId = idPayload.sub;

        const { connectToDatabase } = await import("@/lib/mongodb");
        const { Customer } = await import("@/models/customer");
        await connectToDatabase();

        const dbCustomer: any = await Customer.findOne({
          shopifyCustomerId: String(shopifyCustomerId),
        }).lean();

        if (dbCustomer?.disabled) {
          const reasonParam = dbCustomer.disableReason
            ? `&reason=${encodeURIComponent(dbCustomer.disableReason)}`
            : "";
          const emailParam = idPayload.email
            ? `&email=${encodeURIComponent(idPayload.email)}`
            : "";
          return `/account/login?error=AccountDisabled${reasonParam}${emailParam}`;
        }
      } catch (err) {
        console.error("signIn disabled check failed", err);
      }
      return true;
    },

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

        // Check if this customer's account is disabled
        try {
          const { connectToDatabase } = await import("@/lib/mongodb");
          const { Customer } = await import("@/models/customer");
          await connectToDatabase();

          const idPayload = JSON.parse(
            Buffer.from(account.id_token!.split(".")[1], "base64url").toString(),
          );
          const shopifyCustomerId = idPayload.sub;

          const dbCustomer: any = await Customer.findOne({
            shopifyCustomerId,
          }).lean();

          if (dbCustomer?.disabled) {
            token.disabled = true;
          }
        } catch (err) {
          console.error("Failed to check disabled status", err);
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
            // Token refresh failed — clear both tokens to force fresh login
            token.shopifyAccessToken = undefined;
            token.shopifyRefreshToken = undefined;
            token.shopifyTokenExpiresAt = undefined;
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
      (session as any).disabled = token.disabled ?? false;
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
