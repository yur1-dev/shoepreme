import { NextRequest, NextResponse } from "next/server";

// Adjust these two to match whatever env vars your other /api/admin routes
// already use — these are just the common defaults.
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;
const API_VERSION = "2024-10";

async function shopifyAdmin(query: string, variables: Record<string, any>) {
  const res = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }
  return json.data;
}

export async function POST(req: NextRequest) {
  try {
    const { productId, mediaId } = await req.json();

    if (!productId || !mediaId) {
      return NextResponse.json(
        { success: false, error: "productId and mediaId are required" },
        { status: 400 },
      );
    }

    // productUpdate no longer takes an "images" input directly — pointing a
    // Media node at the product record (via reorder, put it first) is the
    // supported way to make it the featured/list image. Moving it to
    // position 0 achieves that.
    const data = await shopifyAdmin(
      `
      mutation productReorderMedia($id: ID!, $moves: [MoveInput!]!) {
        productReorderMedia(id: $id, moves: $moves) {
          job {
            id
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
      `,
      {
        id: productId,
        moves: [{ id: mediaId, newPosition: "0" }],
      },
    );

    const errors = data.productReorderMedia?.mediaUserErrors;
    if (errors && errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.map((e: any) => e.message).join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}