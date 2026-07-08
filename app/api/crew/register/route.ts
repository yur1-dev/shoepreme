import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CrewEvent from "@/lib/models/CrewEvent";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { eventId, name, email, phone } = await req.json();

    if (!eventId || !name || !email) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 },
      );
    }

    const ev = await CrewEvent.findById(eventId);
    if (!ev) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (!ev.registrations) ev.registrations = [];
    const already = ev.registrations.some((r: any) => r.email === email);
    if (already) {
      return NextResponse.json(
        { success: false, error: "Already registered" },
        { status: 409 },
      );
    }

    ev.registrations.push({
      name,
      email,
      phone: phone ?? "",
      registeredAt: new Date(),
    });
    await ev.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}