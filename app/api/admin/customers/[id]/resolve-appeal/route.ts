import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { action } = await req.json(); // "enable" or "dismiss"
  await connectToDatabase();

  const customerId = id.includes("gid://") ? id.split("/").pop()! : id;

  const update: any = { "appeal.status": "resolved" };
  if (action === "enable") {
    update.disabled = false;
  }

  await Customer.findOneAndUpdate({ shopifyCustomerId: customerId }, update);

  return NextResponse.json({ success: true });
}