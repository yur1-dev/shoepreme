import { NextRequest, NextResponse } from "next/server";
import { setFulfillmentOrderStatus } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { orderId, status } = await req.json();
  const result = await setFulfillmentOrderStatus(orderId, status);
  return NextResponse.json(result);
}