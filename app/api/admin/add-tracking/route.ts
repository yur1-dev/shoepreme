import { NextRequest, NextResponse } from "next/server";
import { addTrackingToOrder } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { orderId, carrier, number } = await req.json();
  const result = await addTrackingToOrder(orderId, carrier, number);
  return NextResponse.json(result);
}