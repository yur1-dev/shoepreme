import { redirect } from "next/navigation";
import { auth } from "@/auth";
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
  if (!session.shopifyAccessToken)
    redirect("/account/login?error=SessionExpired");

  const token = session.shopifyAccessToken;
  let customer: {
    id?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    numberOfOrders?: number;
  } | null = null;
  if (token) {
    try {
      const { customerAccountQuery } = await import("@/lib/shopify-account");
      const CUSTOMER_QUERY = `
        query {
          customer {
            id
            firstName
            lastName
            emailAddress { emailAddress }
            phoneNumber { phoneNumber }
          }
        }
      `;
      const result = await customerAccountQuery(token, CUSTOMER_QUERY);
      const c = result?.data?.customer;
      if (c) {
        customer = {
          id: c.id,
          firstName: c.firstName,
          email: c.emailAddress?.emailAddress,
          phone: c.phoneNumber?.phoneNumber,
        };
      }
    } catch (err) {
      console.error("Failed to fetch customer from Customer Account API", err);
    }
  }

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
    phone: (dbCustomer as any)?.phone ?? customer?.phone ?? undefined,
    numberOfOrders: customer?.numberOfOrders ?? 0,
  };

  // Fetch orders server-side using the OAuth token
  let initialOrders: any[] = [];
  if (token) {
    try {
      const { customerAccountQuery } = await import("@/lib/shopify-account");
      const ORDER_QUERY = `
        query {
          customer {
            orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
              edges {
                node {
                  id
                  number
                  processedAt
                  financialStatus
                  fulfillmentStatus
                  totalPrice { amount currencyCode }
                  subtotal { amount currencyCode }
                  totalShipping { amount currencyCode }
                  shippingAddress {
                    firstName lastName address1 address2
                    city zoneCode zip country
                  }
                  lineItems(first: 50) {
                    edges {
                      node {
                        title
                        quantity
                        image { url }
                        price { amount currencyCode }
                        variantTitle
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const result = await customerAccountQuery(token, ORDER_QUERY);
      const edges = result?.data?.customer?.orders?.edges ?? [];
      initialOrders = edges.map(({ node }: any) => ({
        id: node.id,
        orderNumber: node.number,
        processedAt: node.processedAt,
        financialStatus: node.financialStatus ?? "PENDING",
        fulfillmentStatus: node.fulfillmentStatus ?? "UNFULFILLED",
        currentTotalPrice: node.totalPrice ?? {
          amount: "0.00",
          currencyCode: "PHP",
        },
        subtotalPrice: node.subtotal ?? { amount: "0.00", currencyCode: "PHP" },
        totalShippingPrice: node.totalShipping ?? {
          amount: "0.00",
          currencyCode: "PHP",
        },
        shippingAddress: node.shippingAddress
          ? {
              id: `addr-${node.id}`,
              firstName: node.shippingAddress.firstName ?? "",
              lastName: node.shippingAddress.lastName ?? "",
              address1: node.shippingAddress.address1 ?? "",
              address2: node.shippingAddress.address2 ?? null,
              city: node.shippingAddress.city ?? "",
              province: node.shippingAddress.zoneCode ?? "",
              zip: node.shippingAddress.zip ?? "",
              country: node.shippingAddress.country ?? "",
              phone: "",
              isDefault: false,
            }
          : null,
        lineItems: {
          edges: (node.lineItems?.edges ?? []).map(({ node: item }: any) => ({
            node: {
              title: item.title,
              quantity: item.quantity,
              variant: {
                image: item.image ? { url: item.image.url } : undefined,
                selectedOptions: item.variantTitle
                  ? [{ name: "Size", value: item.variantTitle }]
                  : [],
                price: item.price,
              },
            },
          })),
        },
      }));
    } catch (err) {
      console.error("Failed to fetch orders server-side", err);
    }
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "400px",
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,168,48,0.06) 0%, transparent 70%)",
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
          initialOrders={initialOrders}
          SignOutButton={<SignOutButton />}
        />
      </div>
    </div>
  );
}
