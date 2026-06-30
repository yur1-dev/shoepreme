import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/shopify-admin";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";

export async function GET() {
  const shopifyCustomers = await getCustomers(250);

  await connectToDatabase();
  const dbCustomers = await Customer.find({}).lean();
  const dbMap = new Map(
    dbCustomers.map((c: any) => [c.shopifyCustomerId, c]),
  );

  function normalizeId(id: string) {
    return id.includes("gid://") ? id.split("/").pop()! : id;
  }

  const merged = shopifyCustomers.map((c: any) => {
    const dbC = dbMap.get(normalizeId(c.id)) as any;
    return {
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      numberOfOrders: c.numberOfOrders,
      amountSpent: c.amountSpent,
      createdAt: c.createdAt,
      state: c.state,
      tags: c.tags,
      disabled: dbC?.disabled ?? false,
      displayName: dbC?.displayName,
      appeal: dbC?.appeal,
    };
  });

  return NextResponse.json(merged);
}