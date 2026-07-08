import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CrewEvent from "@/lib/models/CrewEvent";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const ev = await CrewEvent.findById(id).lean() as any;
    if (!ev) return NextResponse.json({ registrations: [], count: 0 });
    const registrations = ev.registrations ?? [];
    return NextResponse.json({ registrations, count: registrations.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}