import { NextRequest, NextResponse } from "next/server";
import { deleteProduct } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { productId } = await req.json();
  const result = await deleteProduct(productId);
  return NextResponse.json(result);
}