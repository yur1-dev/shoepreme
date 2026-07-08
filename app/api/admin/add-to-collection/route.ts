import { NextResponse } from "next/server";
import { addProductToCollection } from "@/lib/shopify-admin";

export async function POST(req: Request) {
  const { productId, collectionTitle } = await req.json();
  const result = await addProductToCollection(productId, collectionTitle);
  return NextResponse.json(result);
}