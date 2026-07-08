import { NextResponse } from "next/server";

const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

async function adminFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOPIFY_ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const since = new Date();
    since.setDate(since.getDate() - (days > 0 ? days : 3650));
    const sinceIso = since.toISOString();

    const data = await adminFetch(
      `
      query getOrdersForAnalytics($query: String!) {
        orders(first: 250, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              cancelledAt
              cancelReason
              totalPriceSet { shopMoney { amount currencyCode } }
              paymentGatewayNames
              customer { id email }
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                  }
                }
              }
            }
          }
        }
      }
    `,
      { query: `created_at:>=${sinceIso}` },
    );

    if (data.errors) {
      console.error("[analytics] Shopify errors:", JSON.stringify(data.errors, null, 2));
      return NextResponse.json({ error: "Shopify query failed" }, { status: 500 });
    }

    const orders = (data?.data?.orders?.edges ?? []).map((e: any) => e.node);

    const revenueByDay: Record<string, number> = {};
    let totalRevenue = 0;
    let paidCount = 0;

    // Financial status counts
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      REFUNDED: 0,
      VOIDED: 0,
      PARTIALLY_REFUNDED: 0,
      OTHER: 0,
    };

    // Fulfillment status counts
    const fulfillCounts: Record<string, number> = {
      UNFULFILLED: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      FULFILLED: 0,
      RESTOCKED: 0,
      OTHER: 0,
    };

    // Cancelled orders (has cancelledAt regardless of financial status)
    let cancelledCount = 0;

    const paymentMethods: Record<string, number> = {};
    const productStats: Record<string, { units: number; revenue: number }> = {};
    const customerOrderCounts: Record<string, number> = {};

    for (const o of orders) {
      const amount = parseFloat(o.totalPriceSet?.shopMoney?.amount ?? "0");
      const day = o.createdAt?.slice(0, 10);
      const fs = o.displayFinancialStatus as string;
      const ffs = o.displayFulfillmentStatus as string;
      const isCancelled = !!o.cancelledAt;

      // Count cancelled
      if (isCancelled) cancelledCount += 1;

      // Revenue — only PAID and not cancelled
      if (fs === "PAID" && !isCancelled) {
        totalRevenue += amount;
        paidCount += 1;
        revenueByDay[day] = (revenueByDay[day] ?? 0) + amount;
      }

      // Financial status
      if (statusCounts[fs] !== undefined) statusCounts[fs] += 1;
      else statusCounts.OTHER += 1;

      // Fulfillment status — only count non-cancelled orders
      if (!isCancelled) {
        if (fulfillCounts[ffs] !== undefined) fulfillCounts[ffs] += 1;
        else fulfillCounts.OTHER += 1;
      }

      // Payment methods
      const gw = o.paymentGatewayNames?.[0] || "Unspecified";
      paymentMethods[gw] = (paymentMethods[gw] ?? 0) + 1;

      // Product stats — skip cancelled/voided/refunded
      if (!isCancelled && fs !== "VOIDED" && fs !== "REFUNDED") {
        for (const li of o.lineItems?.edges ?? []) {
          const item = li.node;
          const unitPrice = parseFloat(item.originalUnitPriceSet?.shopMoney?.amount ?? "0");
          if (!productStats[item.title])
            productStats[item.title] = { units: 0, revenue: 0 };
          productStats[item.title].units += item.quantity;
          productStats[item.title].revenue += unitPrice * item.quantity;
        }
      }

      const custId = o.customer?.id;
      if (custId)
        customerOrderCounts[custId] = (customerOrderCounts[custId] ?? 0) + 1;
    }

    const revenueTrend = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount: Math.round(amount) }));

    const topProducts = Object.entries(productStats)
      .map(([title, stats]) => ({
        title,
        units: stats.units,
        revenue: Math.round(stats.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const paymentBreakdown = Object.entries(paymentMethods).map(
      ([name, count]) => ({ name, count }),
    );

    const returningCustomers = Object.values(customerOrderCounts).filter((c) => c > 1).length;
    const totalCustomers = Object.keys(customerOrderCounts).length;

    const draftData = await adminFetch(`
      query getPreOrderStats {
        draftOrders(first: 100, query: "tag:reserve", sortKey: NUMBER, reverse: true) {
          edges { node { status } }
        }
      }
    `);
    const draftEdges = draftData?.data?.draftOrders?.edges ?? [];
    const preOrderTotal = draftEdges.length;
    const preOrderCompleted = draftEdges.filter(
      (e: any) => e.node.status === "COMPLETED",
    ).length;

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      paidCount,
      totalOrders: orders.length,
      avgOrderValue: paidCount ? Math.round(totalRevenue / paidCount) : 0,
      revenueTrend,
      statusCounts,
      fulfillCounts,
      cancelledCount,
      paymentBreakdown,
      topProducts,
      customers: { total: totalCustomers, returning: returningCustomers },
      preOrders: { total: preOrderTotal, completed: preOrderCompleted },
      recentOrders: orders.slice(0, 8).map((o: any) => ({
        id: o.id,
        name: o.name,
        createdAt: o.createdAt,
        amount: o.totalPriceSet?.shopMoney?.amount,
        currency: o.totalPriceSet?.shopMoney?.currencyCode,
        financialStatus: o.displayFinancialStatus,
        fulfillmentStatus: o.displayFulfillmentStatus,
        cancelledAt: o.cancelledAt,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/analytics]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}