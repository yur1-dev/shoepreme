import { NextRequest, NextResponse } from "next/server";
import { adjustInventoryDelta } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { inventoryItemId, quantity } = await req.json();
  // `quantity` here is the delta (positive or negative difference)
  const result = await adjustInventoryDelta(inventoryItemId, quantity);
  return NextResponse.json(result);
}