import { NextRequest, NextResponse } from "next/server";
import { createDraftOrder } from "@/lib/shopify-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, phone, variantId, quantity } = body;

    if (!email || !variantId || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: email, variantId, quantity",
        },
        { status: 400 },
      );
    }

    const result = await createDraftOrder({
      email,
      firstName,
      lastName,
      phone,
      variantId,
      quantity: Number(quantity),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      draftOrder: result.draftOrder,
    });
  } catch (err: any) {
    console.error("Reserve API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
