import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CrewEvent from "@/lib/models/CrewEvent";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { title, isoDate, location, type, description } = body;

    const updated = await CrewEvent.findByIdAndUpdate(
      id,
      { title, isoDate, location, type, description },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    console.error("[PATCH /api/admin/crew-events/[id]]", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to update event" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const deleted = await CrewEvent.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/crew-events/[id]]", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to delete event" },
      { status: 500 },
    );
  }
}
