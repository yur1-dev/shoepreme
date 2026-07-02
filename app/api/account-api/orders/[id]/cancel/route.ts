import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";

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

async function getCancelModel() {
  const { default: mongoose } = await import("mongoose");
  return mongoose.models.CancelRequest ??
    mongoose.model("CancelRequest", new mongoose.Schema({
      orderId: String,
      customerEmail: String,
      requestedAt: { type: Date, default: Date.now },
      status: { type: String, default: "cancelled" },
      shopifyCancelled: { type: Boolean, default: false },
      shopifyError: { type: String, default: null },
    }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ cancelled: false });

    const { id } = await params;

    // Check Shopify first (source of truth)
    const data = await adminFetch(
      `query getOrder($id: ID!) {
        order(id: $id) {
          id
          cancelledAt
          financialStatus
        }
      }`,
      { id: `gid://shopify/Order/${id}` }
    );

    const order = data?.data?.order;
    const shopifyCancelled = !!order?.cancelledAt || order?.financialStatus === "VOIDED";
    if (shopifyCancelled) return NextResponse.json({ cancelled: true });

    // Fall back to MongoDB record
    await connectToDatabase();
    const CancelRequest = await getCancelModel();
    const existing = await CancelRequest.findOne({ orderId: id });
    return NextResponse.json({ cancelled: !!existing });
  } catch {
    return NextResponse.json({ cancelled: false });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Cancel in Shopify
    const shopifyData = await adminFetch(
      `mutation cancelOrder($orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!) {
        orderCancel(orderId: $orderId, reason: $reason, refund: $refund, restock: $restock) {
          orderCancelUserErrors { field message code }
          job { id done }
        }
      }`,
      {
        orderId: `gid://shopify/Order/${id}`,
        reason: "CUSTOMER",
        refund: true,
        restock: true,
      }
    );

    const shopifyErrors = shopifyData?.data?.orderCancel?.orderCancelUserErrors;
    const shopifyCancelled = !shopifyErrors?.length;

    if (!shopifyCancelled) {
      console.error("Shopify cancel error:", JSON.stringify(shopifyErrors, null, 2));
    }

    // 2. Save to MongoDB regardless (as a record)
    await connectToDatabase();
    const CancelRequest = await getCancelModel();
    const existing = await CancelRequest.findOne({ orderId: id });
    if (!existing) {
      await CancelRequest.create({
        orderId: id,
        customerEmail: session.user.email,
        shopifyCancelled,
        shopifyError: shopifyErrors?.[0]?.message ?? null,
      });
    }

    // 3. Return error only if Shopify failed
    if (!shopifyCancelled) {
      return NextResponse.json(
        { error: shopifyErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST cancel order]", err);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}