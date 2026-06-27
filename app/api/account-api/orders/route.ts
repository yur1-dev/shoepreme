import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/order";

// GET /api/account/orders?customerId=xxxx
// Returns orders in the exact shape AccountClient/OrdersSection/OrderDetail expect.
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required query param: customerId" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const orders = await Order.find({ customerId })
      .sort({ processedAt: -1 })
      .lean();

    const shaped = orders.map((o) => ({
      id: `gid://shopify/Order/${o._id}`,
      orderNumber: o.orderNumber,
      processedAt:
        o.processedAt instanceof Date
          ? o.processedAt.toISOString()
          : o.processedAt,
      financialStatus: o.financialStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      currentTotalPrice: o.currentTotalPrice,
      subtotalPrice: o.subtotalPrice,
      totalShippingPrice: o.totalShippingPrice,
      shippingAddress: o.shippingAddress ?? null,
      lineItems: o.lineItems ?? { edges: [] },
    }));

    return NextResponse.json({ orders: shaped });
  } catch (err) {
    console.error("[GET /api/account/orders]", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}