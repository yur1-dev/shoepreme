import { NextRequest, NextResponse } from "next/server";
import { createProduct } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { title, productType, descriptionHtml, status, price, sizes } =
    await req.json();
  const result = await createProduct({
    title,
    productType,
    descriptionHtml,
    status,
    price,
    sizes,
  });
  return NextResponse.json(result);
}
