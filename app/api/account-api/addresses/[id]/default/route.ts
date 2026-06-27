import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Address } from "@/models/address";

// POST /api/account-api/addresses/[id]/default
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectToDatabase();

    const target = await Address.findById(id).lean();
    if (!target) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Unset all defaults for this customer, then set the target
    await Address.updateMany(
      { customerId: (target as any).customerId },
      { $set: { isDefault: false } }
    );
    await Address.findByIdAndUpdate(id, { $set: { isDefault: true } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/account-api/addresses/:id/default]", err);
    return NextResponse.json(
      { error: "Failed to set default" },
      { status: 500 }
    );
  }
}