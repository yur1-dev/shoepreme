import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getAllProducts(250);
  return NextResponse.json({
    count: products.length,
    titles: products.map((p: any) => p.title),
  });
}