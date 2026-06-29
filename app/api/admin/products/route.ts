import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify-admin";

export async function GET() {
  const products = await getProducts(250);
  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}