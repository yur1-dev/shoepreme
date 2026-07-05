import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Staff from "@/lib/models/Staff";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await connectDB();
  await Staff.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
