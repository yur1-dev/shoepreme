import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Address } from "@/models/address";

function shape(a: any) {
  return {
    id: String(a._id),
    firstName: a.firstName,
    lastName: a.lastName,
    address1: a.address1,
    address2: a.address2 ?? "",
    city: a.city,
    province: a.province,
    zip: a.zip,
    country: a.country,
    phone: a.phone,
    isDefault: a.isDefault,
  };
}

// PATCH /api/account-api/addresses/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
    }

    const fields = await request.json();

    // Strip fields that must never be overwritten from the client
    delete fields.customerId;
    delete fields.isDefault;
    delete fields.id;
    delete fields._id;

    await connectToDatabase();

    const updated = await Address.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address: shape(updated) });
  } catch (err) {
    console.error("[PATCH /api/account-api/addresses/:id]", err);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE /api/account-api/addresses/[id]
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
    }

    await connectToDatabase();

    const toDelete = await Address.findById(id).lean();
    if (!toDelete) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await Address.findByIdAndDelete(id);

    // If deleted address was default, promote the oldest remaining one
    if ((toDelete as any).isDefault) {
      const next = await Address.findOne({
        customerId: (toDelete as any).customerId,
      }).sort({ createdAt: 1 });

      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/account-api/addresses/:id]", err);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}

// POST /api/account-api/addresses/[id]/default  ← handled in separate file