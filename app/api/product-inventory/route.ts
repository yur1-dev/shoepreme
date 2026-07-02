import { NextRequest, NextResponse } from "next/server";
import { getProductByHandle } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle) return NextResponse.json({ error: "No handle" }, { status: 400 });

  const product = await getProductByHandle(handle);
  if (!product) return NextResponse.json({ error: "Not found", handle }, { status: 404 });

  const variantInventory: Record<string, number> = {};
  for (const edge of product.variants?.edges ?? []) {
    const v = edge.node;
    variantInventory[v.id] = v.inventoryQuantity ?? 0;
  }

  return NextResponse.json({ variantInventory });
}