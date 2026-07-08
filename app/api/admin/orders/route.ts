import { NextResponse } from "next/server";
import { getOrders } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const orders = await getOrders();
  return NextResponse.json(orders, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}