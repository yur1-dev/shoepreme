import { NextRequest, NextResponse } from "next/server";
import { createProduct, addProductToCollection } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { title, productType, collection, descriptionHtml, status, price, sizes } =
    await req.json();

  const result = await createProduct({
    title,
    productType,
    descriptionHtml,
    status,
    price,
    sizes,
  });

  if (result.success && result.product?.id && collection) {
    await addProductToCollection(result.product.id, collection);
  }

  return NextResponse.json(result);
}