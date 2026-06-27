import { NextRequest, NextResponse } from "next/server";
import {
  updateVariantInventory,
  getPrimaryLocationId,
} from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { inventoryItemId, quantity } = await req.json();
  const locationId = await getPrimaryLocationId();
  if (!locationId)
    return NextResponse.json({ success: false, error: "No location found" });
  const result = await updateVariantInventory(
    inventoryItemId,
    locationId,
    quantity,
  );
  return NextResponse.json(result);
}
