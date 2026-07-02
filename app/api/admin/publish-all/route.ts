import { NextResponse } from "next/server";
import { publishAllUnpublished } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await publishAllUnpublished();
  return NextResponse.json(result);
}