import { NextRequest, NextResponse } from "next/server";
import { updateProductInfo, addProductToCollection } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("update-product body:", body);
  const { id, title, descriptionHtml, status, collection } = body;
  console.log("collection value:", collection);
  const result = await updateProductInfo(
    id,
    title,
    descriptionHtml,
    status,
  );
  if (result.success && collection) {
    await addProductToCollection(id, collection);
  }
  return NextResponse.json(result);
}