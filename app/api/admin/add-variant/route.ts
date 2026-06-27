import { NextRequest, NextResponse } from "next/server";
import { addVariantToProduct } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { productId, size, price, quantity } = await req.json();
  const result = await addVariantToProduct(productId, size, price, quantity);
  return NextResponse.json(result);
}
