import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CrewEvent from "@/lib/models/CrewEvent";

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export async function GET() {
  try {
    await connectToDatabase();
    const events = await CrewEvent.find().sort({ isoDate: 1 }).lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = events.map((ev: any) => {
      const d = new Date(ev.isoDate);
      return {
        id: String(ev._id),
        isoDate: ev.isoDate,
        date: String(d.getDate()).padStart(2, "0"),
        month: MONTH_NAMES[d.getMonth()],
        year: String(d.getFullYear()),
        title: ev.title,
        location: ev.location,
        type: ev.type,
        description: ev.description,
        status: d >= today ? "UPCOMING" : "PAST",
      };
    });

    return NextResponse.json({ events: mapped });
  } catch (err) {
    console.error("[GET /api/crew-events]", err);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
