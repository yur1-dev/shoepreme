import { NextRequest, NextResponse } from "next/server";
import { releaseFulfillmentHold } from "@/lib/shopify-admin";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const result = await releaseFulfillmentHold(orderId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}