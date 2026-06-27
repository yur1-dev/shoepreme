import { NextRequest, NextResponse } from "next/server";
import { updateProductInfo } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  const { id, title, descriptionHtml, status, productType } = await req.json();
  const result = await updateProductInfo(
    id,
    title,
    descriptionHtml,
    status,
    productType,
  );
  return NextResponse.json(result);
}
