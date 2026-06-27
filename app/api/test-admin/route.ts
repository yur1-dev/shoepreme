import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-10/orders.json?limit=5`,
    {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      },
    },
  );
  const data = await res.json();
  return NextResponse.json(data);
}
