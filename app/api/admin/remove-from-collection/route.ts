import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/shopify-admin";

export async function POST(req: Request) {
  const { productId, collectionId } = await req.json();

  const data = await adminFetch(`
    mutation collectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
      collectionRemoveProducts(id: $id, productIds: $productIds) {
        job { id }
        userErrors { field message }
      }
    }
  `, { id: collectionId, productIds: [productId] });

  const errors = data?.data?.collectionRemoveProducts?.userErrors;
  if (errors?.length) return NextResponse.json({ success: false, error: errors[0].message });
  return NextResponse.json({ success: true });
}