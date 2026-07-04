import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const { draftOrderId } = await request.json();

    if (!draftOrderId) {
      return NextResponse.json(
        { error: "Missing draftOrderId" },
        { status: 400 }
      );
    }

    const mutation = `
      mutation draftOrderDelete($input: DraftOrderDeleteInput!) {
        draftOrderDelete(input: $input) {
          deletedId
          userErrors { field message }
        }
      }
    `;

    const res = await fetch(SHOPIFY_ADMIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input: { id: draftOrderId } },
      }),
    });

    const json = await res.json();
    const result = json.data?.draftOrderDelete;

    if (result?.userErrors?.length) {
      return NextResponse.json(
        { error: result.userErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ deleted: result?.deletedId ?? draftOrderId });
  } catch (err) {
    console.error("[POST /api/account-api/pre-orders/cancel]", err);
    return NextResponse.json(
      { error: "Failed to cancel pre-order" },
      { status: 500 }
    );
  }
}