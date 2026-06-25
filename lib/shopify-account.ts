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

let apiDiscoveryCache: { graphql_api: string; mcp_api: string } | null = null;

export async function getApiDiscovery() {
  if (apiDiscoveryCache) return apiDiscoveryCache;
  const res = await fetch(
    `https://${SHOP_DOMAIN}/.well-known/customer-account-api`,
  );
  if (!res.ok) {
    throw new Error(`🔍 Customer Account API discovery failed: ${res.status}`);
  }
  apiDiscoveryCache = await res.json();
  return apiDiscoveryCache!;
}

export async function customerAccountQuery(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
) {
  const { graphql_api } = await getApiDiscovery();
  const res = await fetch(graphql_api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken, // raw token — no "Bearer " prefix, that's correct here
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) {
    console.error(
      "🔍 Customer Account API error:",
      JSON.stringify(data.errors),
    );
  }
  return data;
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
