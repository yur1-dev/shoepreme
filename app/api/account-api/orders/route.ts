import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_STOREFRONT_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

export async function GET(request: NextRequest) {
  try {
    const customerAccessToken = request.nextUrl.searchParams.get(
      "customerAccessToken",
    );

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
                statusUrl
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
      return NextResponse.json(
        { error: json.errors[0].message },
        { status: 400 },
      );
    }

    const edges = json.data?.customer?.orders?.edges ?? [];

    // Fetch tracking from Admin API for all orders
    const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;
    const numericIds = edges.map(({ node }: any) => {
      const raw = node.id as string; // gid://shopify/Order/123
      return raw.split("/").pop();
    });

    const trackingMap: Record<string, { number: string; url?: string }[]> = {};
    const tagsMap: Record<string, string[]> = {};
    const cancelMap: Record<string, { cancelledAt: string | null; cancelReason: string | null }> = {};

    if (numericIds.length > 0) {
      try {
        const adminQuery = `
          query GetOrderTracking($query: String!) {
            orders(first: 50, query: $query) {
              edges {
                node {
                  id
                  fulfillments {
                    trackingInfo {
                      number
                      url
                    }
                  }
                }
              }
            }
          }
        `;
        // Fetch tracking for each order individually
        const adminOrderQuery = `
          query GetOrderTracking($id: ID!) {
            order(id: $id) {
              id
              tags
              cancelledAt
              cancelReason
              fulfillments {
                trackingInfo {
                  number
                  url
                }
              }
            }
          }
        `;

        await Promise.all(
          edges.map(async ({ node }: any) => {
            try {
              const adminRes = await fetch(SHOPIFY_ADMIN_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
                },
                body: JSON.stringify({
                  query: adminOrderQuery,
                  variables: { id: node.id },
                }),
                cache: "no-store",
              });
              const adminJson = await adminRes.json();
              const adminOrder = adminJson.data?.order;
              if (adminOrder) {
                const tracking = adminOrder.fulfillments?.flatMap((f: any) => f.trackingInfo ?? []) ?? [];
                trackingMap[node.id] = tracking;
                tagsMap[node.id] = adminOrder.tags ?? [];
                cancelMap[node.id] = {
                  cancelledAt: adminOrder.cancelledAt ?? null,
                  cancelReason: adminOrder.cancelReason ?? null,
                };
              }
            } catch (err) {
              console.error(`[orders] Failed to fetch tracking for ${node.id}:`, err);
            }
          })
        );
      } catch (err) {
        console.error("[orders] Failed to fetch tracking from Admin API:", err);
      }
    }

    const orders = edges.map(({ node }: any) => ({
      id: node.id,
      orderNumber: node.orderNumber,
      processedAt: node.processedAt,
      financialStatus: node.financialStatus,
      fulfillmentStatus: node.fulfillmentStatus ?? "UNFULFILLED",
      cancelledAt: cancelMap[node.id]?.cancelledAt ?? null,
      cancelReason: cancelMap[node.id]?.cancelReason ?? null,
      tags: tagsMap[node.id] ?? [],
      statusUrl: node.statusUrl,
      currentTotalPrice: node.currentTotalPrice,
      subtotalPrice: node.subtotalPrice ?? {
        amount: "0.00",
        currencyCode: "PHP",
      },
      totalShippingPrice: node.totalShippingPrice ?? {
        amount: "0.00",
        currencyCode: "PHP",
      },
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
      fulfillments: (() => {
        const tracking = trackingMap[node.id] ?? [];
        return tracking.length > 0 ? [{ trackingInfo: tracking }] : [];
      })(),
    }));

    // Merge custom cancel reasons from MongoDB
    try {
      const { connectToDatabase } = await import("@/lib/mongodb");
      const { default: mongoose } = await import("mongoose");
      await connectToDatabase();

      delete mongoose.models.CancelRequest;
      const CancelRequest = mongoose.model(
        "CancelRequest",
        new mongoose.Schema({
          orderId: String,
          reason: { type: String, default: null },
        }),
      );

      const numericOrderIds = orders.map((o: any) =>
        o.id.split("/").pop()?.split("?")[0],
      ).filter(Boolean);

      const records = await CancelRequest.find({
        orderId: { $in: numericOrderIds },
      }).lean();

      const reasonMap = new Map(
        records.map((r: any) => [r.orderId, r.reason]),
      );

      const ordersWithReasons = orders.map((o: any) => {
        const numericId = o.id.split("/").pop()?.split("?")[0];
        return {
          ...o,
          customCancelReason: reasonMap.get(numericId) ?? null,
        };
      });

      return NextResponse.json({ orders: ordersWithReasons });
    } catch (err) {
      console.error("[orders] Failed to merge custom cancel reasons:", err);
    }

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/account-api/orders]", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
