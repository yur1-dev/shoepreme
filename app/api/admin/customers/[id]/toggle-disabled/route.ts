import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { disabled, reason } = await req.json();
  await connectToDatabase();

  const customerId = id.includes("gid://")
    ? id.split("/").pop()!
    : id;

  const update: Record<string, unknown> = {
    shopifyCustomerId: customerId,
    disabled,
  };

  if (disabled) {
    update.disableReason = reason ?? undefined;
  } else {
    update.disableReason = undefined;
  }

  const result = await Customer.findOneAndUpdate(
    { shopifyCustomerId: customerId },
    { $set: update },
    { upsert: true, new: true },
  );

  console.log("Toggle disabled result:", { customerId, disabled, result });

  return NextResponse.json({ success: true });
}