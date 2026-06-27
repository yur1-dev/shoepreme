import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const clientId = "fee789348e42f406784fe4451c293cfa"; // shoepreme-admin-v2
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET!;

  const res = await fetch(
    `https://shoepremekor.myshopify.com/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    },
  );

  const data = await res.json();
  console.log("ACCESS TOKEN:", data.access_token);

  return NextResponse.json(data);
}
