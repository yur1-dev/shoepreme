import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomer } from "@/lib/shopify-customer";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/customer";
import Navbar from "@/components/layout/Navbar";
import SignOutButton from "@/components/account/SignOutButton";
import AccountClient from "@/components/account/AccountClient";

export const metadata = { title: "My Account — Shoepreme" };

function normalizeId(id: string) {
  if (!id) return id;
  return id.includes("gid://") ? id.split("/").pop()! : id;
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const token = session.shopifyAccessToken;
  const customer = token ? await getCustomer(token) : null;

  // Load saved profile from MongoDB
  let dbCustomer: { displayName?: string; phone?: string } | null = null;
  if (customer?.id) {
    try {
      await connectToDatabase();
      dbCustomer = await Customer.findOne({
        $or: [
          { shopifyCustomerId: normalizeId(customer.id) },
          { shopifyCustomerId: customer.id },
        ],
      }).lean();
    } catch (err) {
      console.error("Failed to load db customer", err);
    }
  }

  // MongoDB displayName wins over Shopify name if it exists
  const displayName =
    (dbCustomer as any)?.displayName ||
    session.shopifyCustomerName?.split(" ")[0] ||
    customer?.firstName ||
    session.user.name?.split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    "Crew";

  const customerData = {
    displayName,
    email: customer?.email ?? session.user.email ?? undefined,
    // MongoDB phone wins over Shopify phone
    phone: (dbCustomer as any)?.phone ?? customer?.phone ?? undefined,
    numberOfOrders: customer?.numberOfOrders ?? 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", position: "relative" }}>
      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "400px",
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,168,48,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Navbar />
      <div style={{ position: "relative", zIndex: 1, paddingTop: "80px" }}>
        <AccountClient
          customerId={customer?.id ?? ""}
          shopifyToken={token ?? ""}
          customer={customerData}
          SignOutButton={<SignOutButton />}
        />
      </div>
    </div>
  );
}