import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CrewEvent from "@/lib/models/CrewEvent";

export async function GET() {
  try {
    await connectToDatabase();
    const events = await CrewEvent.find().sort({ isoDate: -1 }).lean();
    return NextResponse.json(
      events.map((ev: any) => ({ ...ev, id: String(ev._id) })),
    );
  } catch (err) {
    console.error("[GET /api/admin/crew-events]", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, isoDate, location, type, description } = body;

    if (!title || !isoDate || !location || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const created = await CrewEvent.create({
      title,
      isoDate,
      location,
      type,
      description: description ?? "",
    });

    return NextResponse.json({ success: true, event: created });
  } catch (err: any) {
    console.error("[POST /api/admin/crew-events]", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to create event" },
      { status: 500 },
    );
  }
}
