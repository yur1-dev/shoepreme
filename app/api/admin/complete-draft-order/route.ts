import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

async function adminFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOPIFY_ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const { draftOrderId } = await req.json();

  const data = await adminFetch(
    `
    mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
      draftOrderComplete(id: $id, paymentPending: $paymentPending) {
        draftOrder { id order { id name } }
        userErrors { field message }
      }
    }
  `,
    { id: draftOrderId, paymentPending: true },
  );

  const errors = data?.data?.draftOrderComplete?.userErrors;
  if (errors?.length) {
    return NextResponse.json({ success: false, error: errors[0].message });
  }

  return NextResponse.json({
    success: true,
    order: data?.data?.draftOrderComplete?.draftOrder?.order,
  });
}
