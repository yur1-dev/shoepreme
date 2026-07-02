import { NextRequest, NextResponse } from "next/server";
import { startFulfillmentProgress } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const result = await startFulfillmentProgress(orderId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}