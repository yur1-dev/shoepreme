import { createStorefrontApiClient } from "@shopify/storefront-api-client";

export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!,
  apiVersion: "2025-10",
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
});

// ─── Product Queries ──────────────────────────────────────────────────────────

const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    id
    title
    handle
    description
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
    }
    images(first: 6) {
      edges { node { url altText width height } }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          selectedOptions { name value }
        }
      }
    }
    options { id name values }
    tags
    vendor
  }
`;

export async function getAllProducts(limit = 16) {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProducts($limit: Int!) {
      products(first: $limit, sortKey: CREATED_AT, reverse: true) {
        edges { node { ...ProductFragment } }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(query, {
    variables: { limit },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.products?.edges?.map((e: any) => e.node) ?? [];
}

export async function getProductByHandle(handle: string) {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProduct($handle: String!) {
      productByHandle(handle: $handle) { ...ProductFragment }
    }
  `;
  const { data, errors } = await shopifyClient.request(query, {
    variables: { handle },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.productByHandle ?? null;
}

export async function getCollectionProducts(handle: string, limit = 24) {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetCollection($handle: String!, $limit: Int!) {
      collectionByHandle(handle: $handle) {
        title
        description
        products(first: $limit) {
          edges { node { ...ProductFragment } }
        }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(query, {
    variables: { handle, limit },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  const col = data?.collectionByHandle;
  return {
    title: col?.title ?? handle,
    description: col?.description ?? "",
    products: col?.products?.edges?.map((e: any) => e.node) ?? [],
  };
}

// ─── Cart Mutations ───────────────────────────────────────────────────────────

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          cost { totalAmount { amount currencyCode } }
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              product { title handle images(first:1) { edges { node { url altText } } } }
              selectedOptions { name value }
            }
          }
        }
      }
    }
  }
`;

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[] = [],
) {
  const mutation = `
    ${CART_FRAGMENT}
      mutation CartCreate($lines: [CartLineInput!], $discountCodes: [String!]) {
      cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: PH }, discountCodes: $discountCodes }) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(mutation, {
    variables: { lines },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.cartCreate?.cart;
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
) {
  const mutation = `
    ${CART_FRAGMENT}
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(mutation, {
    variables: { cartId, lines },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.cartLinesAdd?.cart;
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
) {
  const mutation = `
    ${CART_FRAGMENT}
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(mutation, {
    variables: { cartId, lines },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.cartLinesUpdate?.cart;
}

export async function removeCartLines(cartId: string, lineIds: string[]) {
  const mutation = `
    ${CART_FRAGMENT}
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFragment }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(mutation, {
    variables: { cartId, lineIds },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.cartLinesRemove?.cart;
}

export async function getCart(cartId: string) {
  const query = `
    ${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { ...CartFragment }
    }
  `;
  const { data, errors } = await shopifyClient.request(query, {
    variables: { cartId },
  });
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.cart;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(amount: string, currencyCode = "PHP") {
  const price = parseFloat(amount);
  return `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
}

export async function getAllCollections() {
  const query = `
    query GetCollections {
      collections(first: 50) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;
  const { data, errors } = await shopifyClient.request(query);
  if (errors) throw new Error(JSON.stringify(errors));
  return data?.collections?.edges?.map((e: any) => e.node) ?? [];
}
