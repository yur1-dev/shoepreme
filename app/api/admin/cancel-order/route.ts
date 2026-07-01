import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/shopify-admin";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  const result = await cancelOrder(orderId);
  return NextResponse.json(result);
}
