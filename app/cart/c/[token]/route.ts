// app/cart/c/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const key = req.nextUrl.searchParams.get("key");
  const shopifyUrl = `https://shoepremekor.myshopify.com/cart/c/${token}${
    key ? `?key=${key}` : ""
  }`;

  const res = await fetch(shopifyUrl, {
    headers: {
      "User-Agent": req.headers.get("user-agent") || "",
      Cookie: req.headers.get("cookie") || "",
    },
    redirect: "manual", // capture Shopify's redirect instead of following it
  });

  // Shopify will try to redirect (likely to checkout.shopify.com) — follow that manually
  const location = res.headers.get("location");
  if (location) {
    return NextResponse.redirect(location);
  }

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "text/html" },
  });
}
