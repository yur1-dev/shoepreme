import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const ADMIN_TOKEN = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN!;

// ─── Fetch orders from Shopify Admin API directly ────────────────────────────
async function fetchOrdersFromShopify(customerId: string) {
  // customerId may come in as a GID or plain number — normalize to plain number
  const numericId = customerId.includes("gid://")
    ? customerId.split("/").pop()
    : customerId;

  const query = `
    {
      customer(id: "gid://shopify/Customer/${numericId}") {
        orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              currentTotalPriceSet {
                shopMoney { amount currencyCode }
              }
              subtotalPriceSet {
                shopMoney { amount currencyCode }
              }
              totalShippingPriceSet {
                shopMoney { amount currencyCode }
              }
              shippingAddress {
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
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      image { url }
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

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Shopify Admin API error: ${res.status}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(
      `Shopify GraphQL error: ${JSON.stringify(json.errors)}`,
    );
  }

  const edges = json.data?.customer?.orders?.edges ?? [];

  return edges.map(({ node }: any) => ({
    id: node.id,
    orderNumber: node.orderNumber,
    processedAt: node.processedAt,
    financialStatus: node.financialStatus,
    fulfillmentStatus: node.fulfillmentStatus ?? "UNFULFILLED",
    currentTotalPrice: node.currentTotalPriceSet.shopMoney,
    subtotalPrice: node.subtotalPriceSet?.shopMoney ?? { amount: "0.00", currencyCode: "PHP" },
    totalShippingPrice: node.totalShippingPriceSet?.shopMoney ?? { amount: "0.00", currencyCode: "PHP" },
    shippingAddress: node.shippingAddress
      ? {
          id: `addr-${node.id}`,
          firstName: node.shippingAddress.firstName ?? "",
          lastName: node.shippingAddress.lastName ?? "",
          address1: node.shippingAddress.address1 ?? "",
          address2: node.shippingAddress.address2 ?? null,
          city: node.shippingAddress.city ?? "",
          province: node.shippingAddress.province ?? "",
          zip: node.shippingAddress.zip ?? "",
          country: node.shippingAddress.country ?? "",
          phone: node.shippingAddress.phone ?? "",
          isDefault: false,
        }
      : null,
    lineItems: node.lineItems,
  }));
}

// ─── GET /api/account-api/orders?customerId=xxxx ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required query param: customerId" },
        { status: 400 },
      );
    }

    const orders = await fetchOrdersFromShopify(customerId);

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/account-api/orders]", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}