import { NextResponse } from "next/server";

export async function GET() {
  const clientId = "d7e2dbd1291662abb4f89d77574c973f"; // from Dev Dashboard
  const scopes =
    "read_orders,write_orders,read_products,read_customers,read_fulfillments,write_fulfillments";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify-callback`;

  const authUrl = `https://shoepremekor.myshopify.com/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(authUrl);
}
