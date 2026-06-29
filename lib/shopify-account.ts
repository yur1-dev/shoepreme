// lib/shopify-account.ts
// Discovery + helpers for Shopify's Customer Account API (OAuth2/OIDC).
// Replaces the old Storefront API password-based customer auth entirely.

const SHOP_DOMAIN = process.env.SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN!;

let discoveryCache: {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  issuer: string;
} | null = null;

export async function getDiscovery() {
  if (discoveryCache) return discoveryCache;
  const res = await fetch(
    `https://${SHOP_DOMAIN}/.well-known/openid-configuration`,
  );
  if (!res.ok) {
    throw new Error(`🔍 Shopify OIDC discovery failed: ${res.status}`);
  }
  discoveryCache = await res.json();
  console.log("🔍 Shopify OIDC discovery:", discoveryCache);
  return discoveryCache!;
}

export async function refreshShopifyAccessToken(refreshToken: string) {
  const { token_endpoint } = await getDiscovery();
  const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
  const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET!;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
  });

  if (!res.ok) {
    console.error(
      "🔍 Shopify token refresh failed:",
      res.status,
      await res.text(),
    );
    return null;
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}
export async function customerAccountQuery(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
) {
  const shopId = SHOP_DOMAIN.split("/").pop();
  const endpoint = `https://shopify.com/${shopId}/account/customer/api/2024-07/graphql`;

  // console.log("🔍 SHOP_DOMAIN value:", SHOP_DOMAIN);
  // console.log("🔍 Full endpoint:", endpoint);
  // console.log("🔍 customerAccountQuery endpoint:", endpoint);
  // console.log("🔍 accessToken preview:", accessToken?.slice(0, 20));

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  console.log("🔍 Customer API response status:", res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error("🔍 Customer API raw response:", text.slice(0, 500));
    throw new Error(`Customer Account API failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.errors) {
    console.error("🔍 Customer Account API error:", JSON.stringify(data.errors));
  }
  return data;
}