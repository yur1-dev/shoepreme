import { NextRequest, NextResponse } from "next/server";
import { markOrderDelivered } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  const result = await markOrderDelivered(orderId);
  return NextResponse.json(result);
}