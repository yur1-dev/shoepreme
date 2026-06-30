import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";

export async function GET() {
  await connectToDatabase();
  const appeals = await Customer.find({
    "appeal.status": "pending",
  }).lean();
  return NextResponse.json(appeals);
}