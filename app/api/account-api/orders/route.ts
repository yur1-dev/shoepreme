import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_STOREFRONT_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

export async function GET(request: NextRequest) {
  try {
    const customerAccessToken = request.nextUrl.searchParams.get("customerAccessToken");

    if (!customerAccessToken) {
      return NextResponse.json(
        { error: "Missing required query param: customerAccessToken" },
        { status: 400 },
      );
    }

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
                  firstName lastName address1 address2
                  city province zip country phone
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

    const res = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables: { customerAccessToken } }),
      cache: "no-store",
    });

    const json = await res.json();

    if (json.errors) {
      console.error("[orders] Shopify errors:", json.errors);
      return NextResponse.json({ error: json.errors[0].message }, { status: 400 });
    }

    const edges = json.data?.customer?.orders?.edges ?? [];

    const orders = edges.map(({ node }: any) => ({
      id: node.id,
      orderNumber: node.orderNumber,
      processedAt: node.processedAt,
      financialStatus: node.financialStatus,
      fulfillmentStatus: node.fulfillmentStatus ?? "UNFULFILLED",
      currentTotalPrice: node.currentTotalPrice,
      subtotalPrice: node.subtotalPrice ?? { amount: "0.00", currencyCode: "PHP" },
      totalShippingPrice: node.totalShippingPrice ?? { amount: "0.00", currencyCode: "PHP" },
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

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/account-api/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}