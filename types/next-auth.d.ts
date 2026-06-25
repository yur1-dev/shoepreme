import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    shopifyAccessToken?: string;
    shopifyIdToken?: string;
    shopifyCustomerName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    shopifyAccessToken?: string;
    shopifyRefreshToken?: string;
    shopifyTokenExpiresAt?: number;
    shopifyIdToken?: string;
    shopifyCustomerName?: string;
  }
}
