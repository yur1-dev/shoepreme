import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/shopify-admin";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const product = await getProductById(id);
  return NextResponse.json(product, {
    headers: { "Cache-Control": "no-store" },
  });
}