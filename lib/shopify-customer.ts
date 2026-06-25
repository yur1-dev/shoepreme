// lib/shopify-customer.ts
// All Shopify Storefront API calls for customer auth + account data
// Uses the same SHOPIFY_STOREFRONT_ACCESS_TOKEN as your existing shopify.ts

const SHOPIFY_STOREFRONT_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────
export async function customerCreate(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerCreate: {
      customer: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      } | null;
      customerUserErrors: { code: string; field: string[]; message: string }[];
    };
  }>(query, { input });
  return data.customerCreate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Login — returns customerAccessToken
// ─────────────────────────────────────────────────────────────────────────────
export async function customerAccessTokenCreate(
  email: string,
  password: string,
) {
  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: { code: string; field: string[]; message: string }[];
    };
  }>(query, { input: { email, password } });
  return data.customerAccessTokenCreate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Renew — extends a customerAccessToken before it expires.
// NOTE: takes the token directly as an argument, NOT wrapped in `input`,
// and the error field on this payload is `userErrors`, not `customerUserErrors`.
// Call this proactively (e.g. in the NextAuth jwt callback) before expiresAt —
// if the token has already expired, Shopify rejects renewal and you must call
// customerAccessTokenCreate again with the user's credentials instead.
// ─────────────────────────────────────────────────────────────────────────────
export async function customerAccessTokenRenew(customerAccessToken: string) {
  const query = `
    mutation customerAccessTokenRenew($customerAccessToken: String!) {
      customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerAccessTokenRenew: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(query, { customerAccessToken });
  return data.customerAccessTokenRenew;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get customer + orders (used in account dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomer(customerAccessToken: string) {
  const query = `
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        firstName
        lastName
        email
        phone
        numberOfOrders
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              currentTotalPrice {
                amount
                currencyCode
              }
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      image {
                        url
                        altText
                      }
                      selectedOptions {
                        name
                        value
                      }
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
        defaultAddress {
          firstName
          lastName
          address1
          address2
          city
          province
          zip
          country
          phone
        }
      }
    }
  `;
  const data = await shopifyFetch<{
    customer: ShopifyCustomer | null;
  }>(query, { customerAccessToken });
  return data.customer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get single order detail
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomerOrder(
  customerAccessToken: string,
  orderId: string,
) {
  const query = `
    query getCustomerOrders($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              currentTotalPrice { amount currencyCode }
              subtotalPrice { amount currencyCode }
              totalShippingPrice { amount currencyCode }
              shippingAddress {
                firstName lastName address1 city province zip country phone
              }
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      id
                      title
                      image { url altText }
                      selectedOptions { name value }
                      price { amount currencyCode }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await shopifyFetch<{ customer: ShopifyCustomer | null }>(query, {
    customerAccessToken,
  });
  if (!data.customer) return null;
  const orders = data.customer.orders.edges.map((e) => e.node);
  // orderId here should already be the plain `gid://shopify/Order/...` string —
  // decode it from the URL segment BEFORE calling this function, not inside it.
  return orders.find((o) => o.id === orderId) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update customer (name, phone)
// ─────────────────────────────────────────────────────────────────────────────
export async function customerUpdate(
  customerAccessToken: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  },
) {
  const query = `
    mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer { id email firstName lastName phone }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    customerUpdate: {
      customer: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
      } | null;
      customerUserErrors: { code: string; field: string[]; message: string }[];
    };
  }>(query, { customerAccessToken, customer: input });
  return data.customerUpdate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ShopifyCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  numberOfOrders: number;
  orders: {
    edges: {
      node: ShopifyOrder;
    }[];
  };
  defaultAddress: ShopifyAddress | null;
};

export type ShopifyOrder = {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  currentTotalPrice: { amount: string; currencyCode: string };
  subtotalPrice?: { amount: string; currencyCode: string };
  totalShippingPrice?: { amount: string; currencyCode: string };
  shippingAddress?: ShopifyAddress;
  lineItems: {
    edges: {
      node: {
        title: string;
        quantity: number;
        variant: {
          id?: string;
          title?: string;
          image: { url: string; altText: string | null } | null;
          selectedOptions: { name: string; value: string }[];
          price: { amount: string; currencyCode: string };
        } | null;
      };
    }[];
  };
};

export type ShopifyAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string | null;
};
