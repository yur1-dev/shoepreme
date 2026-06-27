// app/account/preview/page.tsx
// DEV ONLY — remove before production
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomer } from "@/lib/shopify-customer";
import AccountClient from "@/components/account/AccountClient";
import Navbar from "@/components/layout/Navbar";
import SignOutButton from "@/components/account/SignOutButton";

export default async function AccountPreview() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const token = session.shopifyAccessToken;
  const customer = token ? await getCustomer(token) : null;

  const displayName =
    session.shopifyCustomerName?.split(" ")[0] ||
    customer?.firstName ||
    session.user.name?.split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    "Crew";

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
          customer={{
            displayName,
            email: customer?.email ?? session.user.email ?? undefined,
            phone: customer?.phone ?? undefined,
            numberOfOrders: customer?.numberOfOrders ?? 0,
          }}
          SignOutButton={<SignOutButton />}
        />
      </div>
    </div>
  );
}