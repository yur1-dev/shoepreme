import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";

// Normalize GID → plain numeric string for consistent storage
function normalizeId(id: string) {
  if (!id) return id;
  return id.includes("gid://") ? id.split("/").pop()! : id;
}

function shape(c: any) {
  return {
    displayName: c.displayName ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    numberOfOrders: c.numberOfOrders ?? 0,
  };
}

// GET /api/account-api/profile?customerId=xxxx
export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("customerId");
    if (!raw) {
      return NextResponse.json(
        { error: "Missing required query param: customerId" },
        { status: 400 },
      );
    }

    const customerId = normalizeId(raw);
    await connectToDatabase();

    const customer = await Customer.findOne({
      $or: [
        { shopifyCustomerId: customerId },
        { shopifyCustomerId: raw }, // try both formats
      ],
    }).lean();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer: shape(customer) });
  } catch (err) {
    console.error("[GET /api/account-api/profile]", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/account-api/profile
// body: { customerId, displayName?, phone? }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId: rawId, displayName, phone } = body;

    if (!rawId) {
      return NextResponse.json(
        { error: "Missing required field: customerId" },
        { status: 400 },
      );
    }

    const customerId = normalizeId(rawId);
    await connectToDatabase();

    const updates: Record<string, string> = {};
    if (typeof displayName === "string" && displayName.trim())
      updates.displayName = displayName.trim();
    if (typeof phone === "string") updates.phone = phone.trim();

    // upsert: true creates the document if it doesn't exist yet
    const updated = await Customer.findOneAndUpdate(
      {
        $or: [
          { shopifyCustomerId: customerId },
          { shopifyCustomerId: rawId },
        ],
      },
      {
        $set: updates,
        // Set shopifyCustomerId on creation so future lookups work
        $setOnInsert: { shopifyCustomerId: customerId },
      },
      { new: true, upsert: true },
    ).lean();

    return NextResponse.json({ customer: shape(updated) });
  } catch (err) {
    console.error("[PATCH /api/account-api/profile]", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}