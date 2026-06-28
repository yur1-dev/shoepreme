import { NextRequest, NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  const result = await fulfillOrder(orderId);
  return NextResponse.json(result);
}
