import { NextRequest, NextResponse } from "next/server";
import { removeOrderTag } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const result = await removeOrderTag(orderId, "in-progress");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}