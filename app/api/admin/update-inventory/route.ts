import { NextRequest, NextResponse } from "next/server";
import { adjustInventoryDelta } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { inventoryItemId, quantity } = await req.json();
  console.log("update-inventory called:", { inventoryItemId, quantity });
  const result = await adjustInventoryDelta(inventoryItemId, quantity);
  console.log("update-inventory result:", result);
  return NextResponse.json(result);
}