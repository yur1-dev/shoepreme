import { NextRequest, NextResponse } from "next/server";
import { setFulfillmentOrderStatus } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const result = await setFulfillmentOrderStatus(orderId, "IN_PROGRESS");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
