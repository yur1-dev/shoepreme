// app/account/page.tsx
// Server component — fetches real Shopify customer data server-side.
// Auth re-checked here (not just middleware) to guard against CVE-2025-29927.

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomer } from "@/lib/shopify-customer";
import { formatPrice } from "@/lib/shopify";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SignOutButton from "@/components/account/SignOutButton";

export const metadata = { title: "My Account — Shoepreme" };

const STATUS_COLORS: Record<string, string> = {
  PAID: "#4ade80",
  PENDING: "#e8a830",
  REFUNDED: "#f87171",
  FULFILLED: "#4a7fa5",
  UNFULFILLED: "rgba(245,247,249,0.4)",
  PARTIALLY_FULFILLED: "#e8a830",
  IN_PROGRESS: "#e8a830",
};

function StatusBadge({ label }: { label: string }) {
  const color = STATUS_COLORS[label?.toUpperCase()] ?? "rgba(245,247,249,0.4)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: "monospace",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: "6px",
        padding: "3px 8px",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

export default async function AccountPage() {
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

  const orders = customer?.orders?.edges?.map((e: any) => e.node) ?? [];

  return (
    <main style={{ minHeight: "100vh", background: "#0d1117" }}>
      <Navbar />

      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          padding: "clamp(120px, 15vw, 160px) 24px 80px",
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "400px",
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,168,48,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                marginBottom: "8px",
              }}
            >
              Shoepreme Account
            </p>
            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(2.4rem, 7vw, 3.6rem)",
                letterSpacing: "0.04em",
                color: "#f5f7f9",
                lineHeight: 0.95,
                margin: 0,
              }}
            >
              Hey, <span style={{ color: "#e8a830" }}>{displayName}.</span>
            </h1>
          </div>

          <SignOutButton />
        </div>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        {customer && (
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              { label: "Total Orders", value: customer.numberOfOrders ?? 0 },
              {
                label: "Email",
                value: customer.email,
                mono: true,
                small: true,
              },
              {
                label: "Phone",
                value: customer.phone ?? "—",
                mono: true,
                small: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.3)",
                    margin: "0 0 6px",
                  }}
                >
                  {stat.label}
                </p>
                <p
                  style={{
                    fontFamily: stat.mono
                      ? "monospace"
                      : "Bebas Neue, sans-serif",
                    fontSize: stat.small ? "11px" : "1.8rem",
                    letterSpacing: stat.mono ? "0.04em" : "0.06em",
                    color: "#f5f7f9",
                    margin: 0,
                    wordBreak: "break-all",
                  }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Orders ─────────────────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                letterSpacing: "0.08em",
                color: "#f5f7f9",
                margin: 0,
              }}
            >
              Order History
            </h2>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                color: "rgba(245,247,249,0.3)",
                letterSpacing: "0.1em",
              }}
            >
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </span>
          </div>

          {orders.length === 0 ? (
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.08em",
                  color: "rgba(245,247,249,0.15)",
                  margin: "0 0 8px",
                }}
              >
                No orders yet.
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.25)",
                  letterSpacing: "0.08em",
                  margin: "0 0 20px",
                }}
              >
                Your order history will appear here once you make a purchase.
              </p>
              <a
                href="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#e8a830",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                Shop Now
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {orders.map((order: any) => {
                const items =
                  order.lineItems?.edges?.map((e: any) => e.node) ?? [];
                const firstImage = items[0]?.variant?.image?.url;
                const date = new Date(order.processedAt).toLocaleDateString(
                  "en-PH",
                  { year: "numeric", month: "short", day: "numeric" },
                );
                return (
                  <div
                    key={order.id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "14px",
                      padding: "20px",
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "10px",
                        background: "rgba(74,127,165,0.1)",
                        border: "1px solid rgba(74,127,165,0.2)",
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {firstImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImage}
                          alt={items[0]?.title ?? ""}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(74,127,165,0.5)"
                          strokeWidth="1.5"
                        >
                          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "1rem",
                            letterSpacing: "0.08em",
                            color: "#f5f7f9",
                          }}
                        >
                          Order #{order.orderNumber}
                        </span>
                        <StatusBadge label={order.financialStatus} />
                        <StatusBadge label={order.fulfillmentStatus} />
                      </div>

                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color: "rgba(245,247,249,0.35)",
                          letterSpacing: "0.06em",
                          margin: "0 0 4px",
                        }}
                      >
                        {date} · {items.length} item
                        {items.length !== 1 ? "s" : ""}
                      </p>

                      {/* Item names */}
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color: "rgba(245,247,249,0.5)",
                          letterSpacing: "0.04em",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "320px",
                        }}
                      >
                        {items
                          .slice(0, 2)
                          .map((i: any) => i.title)
                          .join(", ")}
                        {items.length > 2 && ` +${items.length - 2} more`}
                      </p>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "1.3rem",
                          letterSpacing: "0.06em",
                          color: "#e8a830",
                          margin: 0,
                        }}
                      >
                        {formatPrice(
                          order.currentTotalPrice.amount,
                          order.currentTotalPrice.currencyCode,
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
