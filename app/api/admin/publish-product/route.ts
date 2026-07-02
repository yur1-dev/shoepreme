import { NextRequest, NextResponse } from "next/server";
import { publishToOnlineStore } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { productId } = await req.json();
  const result = await publishToOnlineStore(productId);
  return NextResponse.json(result);
}