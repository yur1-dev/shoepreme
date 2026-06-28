import { NextRequest, NextResponse } from "next/server";
import { markOrderAsPaid } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentMethod } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId" },
        { status: 400 },
      );
    }

    const result = await markOrderAsPaid(orderId, paymentMethod);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/mark-paid]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}