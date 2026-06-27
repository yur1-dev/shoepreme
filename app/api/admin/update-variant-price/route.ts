import { NextRequest, NextResponse } from "next/server";
import { updateVariantPrice } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { variantId, price } = await req.json();
  const result = await updateVariantPrice(variantId, price);
  return NextResponse.json(result);
}
