import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify-admin";

export async function GET() {
  const products = await getProducts(50);
  return NextResponse.json(products);
}
