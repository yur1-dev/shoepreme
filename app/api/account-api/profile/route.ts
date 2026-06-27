import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";
import { Order } from "@/models/order";

function shape(c: any, numberOfOrders: number) {
  return {
    displayName: c.displayName,
    email: c.email ?? "",
    phone: c.phone ?? "",
    numberOfOrders,
  };
}

// GET /api/account/profile?customerId=xxxx
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required query param: customerId" },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const customer = await Customer.findOne({ shopifyCustomerId: customerId }).lean();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const numberOfOrders = await Order.countDocuments({ customerId });

    return NextResponse.json({ customer: shape(customer, numberOfOrders) });
  } catch (err) {
    console.error("[GET /api/account/profile]", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/account/profile
// body: { customerId, displayName?, phone? }
// Email is intentionally not editable here — it's managed via Shopify, same
// as the note already shown in ProfileSection.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received profile data:", body);
    const { customerId, displayName, phone } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing required field: customerId" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const updates: Record<string, string> = {};
    if (typeof displayName === "string") updates.displayName = displayName;
    if (typeof phone === "string") updates.phone = phone;

    const updated = await Customer.findOneAndUpdate(
      { shopifyCustomerId: customerId },
      { $set: updates },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const numberOfOrders = await Order.countDocuments({ customerId });

    return NextResponse.json({ customer: shape(updated, numberOfOrders) });
  } catch (err) {
    console.error("[PATCH /api/account/profile]", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}