"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const SHOP_LOCATION = {
  lat: 6.1164,
  lng: 125.1716,
  name: "Shoepreme",
  address: "Conel - Olympog Rd, General Santos City, South Cotabato",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Section =
  | "orders"
  | "addresses"
  | "recently-viewed"
  | "profile"
  | "pre-orders"
  | "the-crew";

interface CustomerData {
  displayName: string;
  email?: string;
  phone?: string;
  numberOfOrders?: number;
}

interface AccountClientProps {
  customer: CustomerData;
  SignOutButton: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PAID: "#4ade80",
  PENDING: "#e8a830",
  REFUNDED: "#f87171",
  VOIDED: "#f87171",
  CANCELLED: "#f87171",
  FULFILLED: "#4a7fa5",
  UNFULFILLED: "rgba(245,247,249,0.4)",
  PARTIALLY_FULFILLED: "#e8a830",
  IN_PROGRESS: "#e8a830",
  ON_HOLD: "#a78bfa",
};

function statusColor(label: string) {
  return STATUS_COLORS[label?.toUpperCase()] ?? "rgba(245,247,249,0.4)";
}

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(parseFloat(amount));
}

function formatDate(iso: string, long = false) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
  });
}

// ─── Shared types ─────────────────────────────────────────────────────────────
interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface LineItemNode {
  title: string;
  quantity: number;
  variant?: {
    image?: { url: string };
    selectedOptions?: { name: string; value: string }[];
    price?: MoneyV2;
  };
}

interface Order {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  statusUrl?: string;
  currentTotalPrice: MoneyV2;
  subtotalPrice: MoneyV2;
  totalShippingPrice: MoneyV2;
  shippingAddress?: Address | null;
  lineItems: { edges: { node: LineItemNode }[] };
  fulfillments?: { trackingInfo: { number: string; url?: string }[] }[];
  tags?: string[];
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ label }: { label: string }) {
  const c = statusColor(label);
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
        color: c,
        background: `${c}18`,
        border: `1px solid ${c}40`,
        borderRadius: "6px",
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: c,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { key: Section; label: string; icon: React.ReactNode }[] = [
  {
    key: "orders",
    label: "Orders",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    key: "addresses",
    label: "Addresses",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "pre-orders",
    label: "Pre-orders",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "the-crew",
    label: "The Crew",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

// ─── Order Tabs ───────────────────────────────────────────────────────────────
const ORDER_TABS: {
  key: string;
  label: string;
  filter: (o: Order) => boolean;
}[] = [
  { key: "all", label: "All", filter: () => true },
  {
    key: "to-pay",
    label: "To Pay",
    filter: (o) => o.financialStatus === "PENDING",
  },
  {
    key: "to-ship",
    label: "To Ship",
    filter: (o) =>
      o.financialStatus === "PAID" && o.fulfillmentStatus === "UNFULFILLED",
  },
  {
    key: "to-receive",
    label: "To Receive",
    filter: (o) =>
      o.fulfillmentStatus === "FULFILLED" && o.financialStatus === "PAID",
  },
  {
    key: "completed",
    label: "Completed",
    filter: (o) =>
      o.fulfillmentStatus === "FULFILLED" && o.financialStatus === "PAID",
  },
  {
    key: "on-hold",
    label: "On Hold",
    filter: (o) => o.fulfillmentStatus === "ON_HOLD",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    filter: (o) =>
      o.financialStatus === "REFUNDED" ||
      o.financialStatus === "VOIDED" ||
      !!o.cancelledAt,
  },
];

// ─── Order List ───────────────────────────────────────────────────────────────
function OrdersSection({
  orders,
  loading,
  onSelect,
  activeTab,
  setActiveTab,
}: {
  orders: Order[];
  loading: boolean;
  onSelect: (order: Order) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const allOrders = orders;
  const tab = ORDER_TABS.find((t) => t.key === activeTab)!;
  const filteredOrders = allOrders.filter(tab.filter);

  if (loading) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(245,247,249,0.3)",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Loading orders…
        </p>
      </div>
    );
  }

  if (filteredOrders.length === 0 && allOrders.length === 0) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "56px 24px",
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
            margin: 0,
          }}
        >
          Your order history will appear here once you make a purchase.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          gap: "0",
          marginBottom: "4px",
        }}
      >
        {ORDER_TABS.map((t) => {
          const count = allOrders.filter(t.filter).length;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "8px 12px",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #e8a830"
                  : "2px solid transparent",
                marginBottom: "-1px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                background: "transparent",
                color: isActive ? "#e8a830" : "rgba(245,247,249,0.35)",
                fontFamily: "monospace",
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(245,247,249,0.65)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(245,247,249,0.35)";
              }}
            >
              {t.label}
              {count > 0 && (
                <span
                  style={{
                    background: isActive
                      ? "rgba(232,168,48,0.15)"
                      : "rgba(255,255,255,0.05)",
                    color: isActive ? "#e8a830" : "rgba(245,247,249,0.25)",
                    borderRadius: "20px",
                    padding: "1px 7px",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
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
              fontSize: "1.4rem",
              letterSpacing: "0.08em",
              color: "rgba(245,247,249,0.12)",
              margin: "0 0 6px",
            }}
          >
            No {tab.label} orders.
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(245,247,249,0.2)",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            Nothing here yet.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredOrders.map((order) => {
          const items = order.lineItems.edges.map((e) => e.node);
          const firstImage = items[0]?.variant?.image?.url;
          return (
            <button
              key={order.id}
              onClick={() => onSelect(order)}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "14px",
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "nowrap",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "border-color 0.15s, background 0.15s",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(232,168,48,0.3)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(232,168,48,0.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.02)";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  minWidth: "48px",
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
                  <img
                    src={firstImage}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(74,127,165,0.5)"
                    strokeWidth="1.5"
                  >
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
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
                  {formatDate(order.processedAt)} · {items.length} item
                  {items.length !== 1 ? "s" : ""}
                </p>
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
                    maxWidth: "300px",
                  }}
                >
                  {items
                    .slice(0, 2)
                    .map((i) => i.title)
                    .join(", ")}
                  {items.length > 2 && ` +${items.length - 2} more`}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.1rem",
                    letterSpacing: "0.06em",
                    color: "#e8a830",
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatPrice(
                    order.currentTotalPrice.amount,
                    order.currentTotalPrice.currencyCode,
                  )}
                </p>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(245,247,249,0.25)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cancel Order Button ──────────────────────────────────────────────────────
const CANCEL_REASONS = [
  "Changed my mind",
  "Found a better price elsewhere",
  "Ordered by mistake",
  "Shipping takes too long",
  "Payment issues",
  "Other",
];

function CancelOrderButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  useEffect(() => {
    setMounted(true);
    const numericId = (order.id.split("/").pop() ?? order.id).split("?")[0];
    fetch(`/api/account-api/orders/${numericId}/cancel`)
      .then((r) => r.json())
      .then((d) => {
        if (d.cancelled) setCancelled(true);
      })
      .catch(() => {});
  }, [order.id]);

  async function handleCancel() {
    setCancelling(true);
    const reason = selectedReason === "Other" ? otherReason : selectedReason;
    try {
      const numericId = (order.id.split("/").pop() ?? order.id).split("?")[0];
      const res = await fetch(`/api/account-api/orders/${numericId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setCancelled(true);
        setOpen(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to cancel order", err);
    } finally {
      setCancelling(false);
    }
  }

  if (cancelled) {
    return (
      <div
        style={{
          background: "rgba(248,113,113,0.05)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "12px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(248,113,113,0.8)",
            letterSpacing: "0.06em",
          }}
        >
          Cancellation request submitted.
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "14px",
          background: "transparent",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "12px",
          color: "rgba(248,113,113,0.6)",
          fontFamily: "monospace",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(248,113,113,0.4)";
          (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(248,113,113,0.2)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(248,113,113,0.6)";
        }}
      >
        Cancel Order
      </button>
      {mounted &&
        open &&
        createPortal(
          <>
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 99998,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(380px, calc(100vw - 48px))",
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                padding: "28px",
                zIndex: 99999,
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(248,113,113,0.5)",
                  margin: "0 0 6px",
                }}
              >
                Order #{order.orderNumber}
              </p>
              <h3
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.06em",
                  color: "#f5f7f9",
                  margin: "0 0 10px",
                }}
              >
                Cancel this order?
              </h3>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.4)",
                  letterSpacing: "0.04em",
                  margin: "0 0 16px",
                  lineHeight: 1.7,
                }}
              >
                This will send a cancellation request to the store. If payment
                hasn't been made yet, the order will be voided. This action
                cannot be undone.
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.3)",
                  margin: "0 0 8px",
                }}
              >
                Reason for cancellation
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginBottom: "20px",
                }}
              >
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedReason(r)}
                    style={{
                      padding: "10px 14px",
                      background:
                        selectedReason === r
                          ? "rgba(232,168,48,0.08)"
                          : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedReason === r ? "rgba(232,168,48,0.35)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: "8px",
                      color:
                        selectedReason === r
                          ? "#e8a830"
                          : "rgba(245,247,249,0.45)",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {r}
                  </button>
                ))}
                {selectedReason === "Other" && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Tell us more…"
                    rows={2}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "#f5f7f9",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      letterSpacing: "0.04em",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setOpen(false)}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    color: "rgba(245,247,249,0.4)",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: cancelling ? "default" : "pointer",
                    opacity: cancelling ? 0.5 : 1,
                  }}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancel}
                  disabled={
                    cancelling ||
                    !selectedReason ||
                    (selectedReason === "Other" && !otherReason.trim())
                  }
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "10px",
                    color: "#f87171",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor:
                      cancelling ||
                      !selectedReason ||
                      (selectedReason === "Other" && !otherReason.trim())
                        ? "default"
                        : "pointer",
                    opacity:
                      cancelling ||
                      !selectedReason ||
                      (selectedReason === "Other" && !otherReason.trim())
                        ? 0.4
                        : 1,
                  }}
                >
                  {cancelling ? "Cancelling…" : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
function OrderDetail({
  order,
  onTrack,
}: {
  order: Order;
  onTrack: () => void;
}) {
  const items = order.lineItems.edges.map((e) => e.node);
  const addr = order.shippingAddress;
  const isPending = order.financialStatus === "PENDING";
  const isCancellable =
    order.financialStatus === "PENDING" && !order.cancelledAt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {isPending && (
        <div
          style={{
            background: "rgba(232,168,48,0.06)",
            border: "1px solid rgba(232,168,48,0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(232,168,48,0.12)",
                  border: "1px solid rgba(232,168,48,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e8a830"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(232,168,48,0.6)",
                    margin: "0 0 2px",
                  }}
                >
                  Payment Due
                </p>
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.4rem",
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
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#e8a830",
                background: "rgba(232,168,48,0.1)",
                border: "1px solid rgba(232,168,48,0.25)",
                borderRadius: "6px",
                padding: "4px 10px",
              }}
            >
              Awaiting Payment
            </span>
          </div>
          {order.statusUrl && (
            <a
              href={order.statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px",
                background: "#e8a830",
                borderRadius: "10px",
                color: "#0d1117",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Pay Now{" "}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </a>
          )}
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: "rgba(245,247,249,0.3)",
              letterSpacing: "0.04em",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Your order is confirmed and reserved. Tap Pay Now to complete
            payment via GCash, card, or other available methods.
          </p>
        </div>
      )}

      {order.fulfillmentStatus === "ON_HOLD" && (
        <div
          style={{
            background: "rgba(167,139,250,0.06)",
            border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(167,139,250,0.6)",
                  margin: "0 0 2px",
                }}
              >
                Order On Hold
              </p>
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.04em",
                  color: "#a78bfa",
                  margin: 0,
                }}
              >
                Your order is temporarily paused
              </p>
            </div>
          </div>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: "rgba(167,139,250,0.6)",
              letterSpacing: "0.04em",
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            The store has placed this order on hold. This may be due to stock
            confirmation, payment verification, or other reasons. We'll notify
            you once it resumes.
          </p>
          <a
            href="https://m.me/shoepreme"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              background: "rgba(167,139,250,0.08)",
              border: "1px solid rgba(167,139,250,0.25)",
              borderRadius: "8px",
              color: "#a78bfa",
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              alignSelf: "flex-start",
            }}
          >
            Message Us →
          </a>
        </div>
      )}

      <div>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245,247,249,0.3)",
            margin: "0 0 12px",
          }}
        >
          Items ({items.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "rgba(74,127,165,0.1)",
                  border: "1px solid rgba(74,127,165,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.variant?.image?.url ? (
                  <img
                    src={item.variant.image.url}
                    alt={item.title}
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#f5f7f9",
                    margin: "0 0 4px",
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(245,247,249,0.4)",
                    margin: "0 0 3px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.variant?.selectedOptions
                    ?.map((o) => o.value)
                    .join(" · ")}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(245,247,249,0.25)",
                    margin: 0,
                  }}
                >
                  Qty: {item.quantity}
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.06em",
                  color: "#e8a830",
                  margin: 0,
                  flexShrink: 0,
                }}
              >
                {item.variant?.price
                  ? formatPrice(
                      (
                        parseFloat(item.variant.price.amount) * item.quantity
                      ).toString(),
                      item.variant.price.currencyCode,
                    )
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "16px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.3)",
              margin: "0 0 12px",
            }}
          >
            Tracking
          </p>
          <button
            onClick={onTrack}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderBottom: "none",
              borderRadius: "14px 14px 0 0",
              overflow: "hidden",
              cursor: "pointer",
              padding: 0,
              width: "100%",
              position: "relative",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(232,168,48,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.07)";
            }}
          >
            <div style={{ height: "120px", position: "relative" }}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${SHOP_LOCATION.lng - 0.018},${SHOP_LOCATION.lat - 0.018},${SHOP_LOCATION.lng + 0.018},${SHOP_LOCATION.lat + 0.018}&layer=mapnik&marker=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`}
                width="100%"
                height="120"
                style={{
                  border: 0,
                  display: "block",
                  pointerEvents: "none",
                  filter: "brightness(0.68) saturate(0.75)",
                }}
                loading="lazy"
                title="Shop location preview"
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "48px",
                  background:
                    "linear-gradient(to top, rgba(13,17,23,0.92), transparent)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -65%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "28px",
                    height: "28px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "rgba(232,168,48,0.25)",
                      animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "5px",
                      borderRadius: "50%",
                      background: "#e8a830",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="#0d1117"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline
                        points="9 22 9 12 15 12 15 22"
                        stroke="#0d1117"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(13,17,23,0.85)",
                  border: "1px solid rgba(232,168,48,0.3)",
                  borderRadius: "20px",
                  padding: "3px 8px",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#e8a830",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "7px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#e8a830",
                  }}
                >
                  Tap to Track
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "10px",
                  pointerEvents: "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "7px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.4)",
                    margin: 0,
                  }}
                >
                  {SHOP_LOCATION.name}
                </p>
              </div>
            </div>
            <style>{`@keyframes ping { 75%, 100% { transform: scale(1.9); opacity: 0; } }`}</style>
          </button>
          {addr && (
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                borderRadius: "0 0 14px 14px",
                padding: "18px 20px",
                display: "flex",
                gap: "12px",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(232,168,48,0.6)"
                strokeWidth="2"
                style={{ marginTop: "2px", flexShrink: 0 }}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.25)",
                    margin: "0 0 6px",
                  }}
                >
                  Shipping Address
                </p>
                <p
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#f5f7f9",
                    margin: "0 0 5px",
                  }}
                >
                  {addr.firstName} {addr.lastName}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(245,247,249,0.4)",
                    margin: "0 0 2px",
                    letterSpacing: "0.03em",
                    lineHeight: 1.5,
                  }}
                >
                  {addr.address1}
                  {addr.address2 ? `, ${addr.address2}` : ""}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(245,247,249,0.4)",
                    margin: "0 0 2px",
                    letterSpacing: "0.03em",
                  }}
                >
                  {addr.city}, {addr.province} {addr.zip}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(245,247,249,0.3)",
                    margin: 0,
                    letterSpacing: "0.03em",
                  }}
                >
                  {addr.phone}
                </p>
              </div>
            </div>
          )}
        </div>
        <div>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.3)",
              margin: "0 0 12px",
            }}
          >
            Summary
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[
              { label: "Subtotal", value: order.subtotalPrice },
              { label: "Shipping", value: order.totalShippingPrice },
            ].map(({ label, value }) =>
              value ? (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.35)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "rgba(245,247,249,0.6)",
                    }}
                  >
                    {formatPrice(value.amount, value.currencyCode)}
                  </span>
                </div>
              ) : null,
            )}
            <div
              style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.5)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.5rem",
                  letterSpacing: "0.06em",
                  color: "#e8a830",
                }}
              >
                {formatPrice(
                  order.currentTotalPrice.amount,
                  order.currentTotalPrice.currencyCode,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(order.cancelledAt ||
        order.financialStatus === "VOIDED" ||
        order.financialStatus === "REFUNDED") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {order.cancelledAt && (
            <p
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.1rem",
                letterSpacing: "0.06em",
                color: "#f87171",
                margin: 0,
              }}
            >
              {formatDate(order.cancelledAt, true)}
            </p>
          )}
          <a
            href="/products"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "16px",
              background: "rgba(232,168,48,0.08)",
              border: "1px solid rgba(232,168,48,0.25)",
              borderRadius: "12px",
              color: "#e8a830",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Buy Again →
          </a>
        </div>
      )}

      {!order.cancelledAt &&
        order.financialStatus !== "VOIDED" &&
        order.financialStatus !== "REFUNDED" &&
        (() => {
          const trackingNumbers =
            order.fulfillments?.flatMap((f) => f.trackingInfo ?? []) ?? [];
          const hasTracking = trackingNumbers.length > 0;
          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                onClick={hasTracking ? onTrack : undefined}
                disabled={!hasTracking}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: hasTracking
                    ? "rgba(232,168,48,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${hasTracking ? "rgba(232,168,48,0.25)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "12px",
                  color: hasTracking ? "#e8a830" : "rgba(245,247,249,0.2)",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: hasTracking ? "pointer" : "not-allowed",
                }}
              >
                {hasTracking ? "Track Order →" : "Tracking Not Available Yet"}
              </button>
              {hasTracking && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {trackingNumbers.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(232,168,48,0.6)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color: "rgba(245,247,249,0.5)",
                          flex: 1,
                        }}
                      >
                        {t.number}
                      </span>
                      {t.url && (
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: "#e8a830",
                            letterSpacing: "0.08em",
                            textDecoration: "none",
                          }}
                        >
                          View →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

      {isCancellable && <CancelOrderButton order={order} />}
    </div>
  );
}

// ─── Address Form Drawer ──────────────────────────────────────────────────────
function AddressFormDrawer({
  address,
  onClose,
  onSave,
}: {
  address: Address | null;
  onClose: () => void;
  onSave: (data: Omit<Address, "id" | "isDefault">) => void;
}) {
  const [form, setForm] = useState({
    firstName: address?.firstName ?? "",
    lastName: address?.lastName ?? "",
    address1: address?.address1 ?? "",
    address2: address?.address2 ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    zip: address?.zip ?? "",
    country: address?.country ?? "Philippines",
    phone: address?.phone ?? "",
  });
  const isEditing = !!address;
  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f5f7f9",
    fontFamily: "monospace",
    fontSize: "11px",
    letterSpacing: "0.04em",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontFamily: "monospace",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "rgba(245,247,249,0.3)",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(480px, 100vw)",
          background: "#0d1117",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
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
                margin: "0 0 4px",
              }}
            >
              {isEditing ? "Edit Address" : "New Address"}
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.8rem",
                letterSpacing: "0.06em",
                color: "#f5f7f9",
                margin: 0,
              }}
            >
              {isEditing ? "Update Details" : "Add Address"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,247,249,0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                style={inputStyle}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                placeholder="Marc"
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                style={inputStyle}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Yuri"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Address Line 1</label>
            <input
              style={inputStyle}
              value={form.address1}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
              placeholder="123 Rizal St."
            />
          </div>
          <div>
            <label style={labelStyle}>Address Line 2 (optional)</label>
            <input
              style={inputStyle}
              value={form.address2}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
              placeholder="Brgy. Poblacion"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>City</label>
              <input
                style={inputStyle}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Koronadal"
              />
            </div>
            <div>
              <label style={labelStyle}>Province</label>
              <input
                style={inputStyle}
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="South Cotabato"
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={labelStyle}>ZIP Code</label>
              <input
                style={inputStyle}
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                placeholder="9506"
              />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input
                style={inputStyle}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Philippines"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+639123456789"
            />
          </div>
        </div>
        <div
          style={{
            padding: "20px 28px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "13px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              color: "rgba(245,247,249,0.4)",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            style={{
              flex: 2,
              padding: "13px",
              background: "#e8a830",
              border: "none",
              borderRadius: "10px",
              color: "#0d1117",
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {isEditing ? "Save Changes" : "Add Address"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── TrackOrderSidebar ────────────────────────────────────────────────────────
function TrackOrderSidebar({
  orders,
  initialOrder,
  onClose,
}: {
  orders: Order[];
  initialOrder: Order;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const addr = order.shippingAddress;
  const tags: string[] = order.tags ?? [];
  const isInProgressTag = tags.includes("in-progress");
  const isDeliveredTag = tags.includes("delivered");
  const isPaid = order.financialStatus === "PAID";
  const isPending = order.financialStatus === "PENDING";
  const isVoided =
    order.financialStatus === "VOIDED" || order.financialStatus === "REFUNDED";
  const isFulfilled = order.fulfillmentStatus === "FULFILLED";

  let currentStage = 0;
  if (isPending) currentStage = 1;
  if (isPaid) currentStage = 2;
  if (isPaid && isInProgressTag) currentStage = 3;
  if (isPaid && isFulfilled) currentStage = 3;
  if (isDeliveredTag) currentStage = 4;

  type StageStatus = "done" | "active" | "pending";
  const stages: {
    label: string;
    sub: string;
    time?: string;
    status: StageStatus;
  }[] = [
    {
      label: "Order Placed",
      sub: "Your order has been received",
      time: formatDate(order.processedAt, true),
      status: currentStage > 0 ? "done" : "active",
    },
    {
      label: "Payment Confirmed",
      sub: isPending
        ? "Awaiting your payment"
        : isVoided
          ? "Order voided"
          : "Payment has been verified",
      time: isPaid ? "Confirmed" : isPending ? "Pending" : undefined,
      status:
        currentStage > 1 ? "done" : currentStage === 1 ? "active" : "pending",
    },
    {
      label: "Preparing Order",
      sub: "Store is packing your items",
      status:
        currentStage > 2 ? "done" : currentStage === 2 ? "active" : "pending",
    },
    {
      label: "Out for Delivery",
      sub: "Your order is on the way",
      status:
        currentStage > 3 ? "done" : currentStage === 3 ? "active" : "pending",
    },
    {
      label: "Delivered",
      sub: "Order has been received",
      status: currentStage >= 4 ? "active" : "pending",
    },
  ];

  const mapLat = userCoords
    ? (SHOP_LOCATION.lat + userCoords.lat) / 2
    : SHOP_LOCATION.lat;
  const mapLng = userCoords
    ? (SHOP_LOCATION.lng + userCoords.lng) / 2
    : SHOP_LOCATION.lng;
  const latSpan = userCoords
    ? Math.abs(SHOP_LOCATION.lat - userCoords.lat) * 0.6 + 0.5
    : 0.02;
  const lngSpan = userCoords
    ? Math.abs(SHOP_LOCATION.lng - userCoords.lng) * 0.6 + 0.5
    : 0.02;
  const osmSrc = userCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - lngSpan},${mapLat - latSpan},${mapLng + lngSpan},${mapLat + latSpan}&layer=mapnik&marker=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${SHOP_LOCATION.lng - 0.02},${SHOP_LOCATION.lat - 0.02},${SHOP_LOCATION.lng + 0.02},${SHOP_LOCATION.lat + 0.02}&layer=mapnik&marker=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`;

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          background: "#0d1117",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.25)",
                margin: "0 0 3px",
              }}
            >
              Shoepreme
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.6rem",
                letterSpacing: "0.06em",
                color: "#f5f7f9",
                margin: 0,
              }}
            >
              Track Order
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(245,247,249,0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
        {orders.length > 1 && (
          <div
            style={{
              padding: "10px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              scrollbarWidth: "none",
              flexShrink: 0,
            }}
          >
            {orders.map((o) => {
              const isSelected = o.id === order.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOrder(o)}
                  style={{
                    flexShrink: 0,
                    padding: "5px 12px",
                    borderRadius: "20px",
                    border: isSelected
                      ? "1px solid rgba(232,168,48,0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: isSelected
                      ? "rgba(232,168,48,0.1)"
                      : "transparent",
                    color: isSelected ? "#e8a830" : "rgba(245,247,249,0.35)",
                    fontFamily: "monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  #{o.orderNumber}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ position: "relative", height: "200px", flexShrink: 0 }}>
            <iframe
              src={osmSrc}
              width="100%"
              height="200"
              style={{
                border: 0,
                display: "block",
                filter: "brightness(0.68) saturate(0.75)",
                pointerEvents: "none",
              }}
              loading="lazy"
              title="Shop location"
            />
            {userCoords &&
              (() => {
                const minLng = mapLng - lngSpan;
                const maxLng = mapLng + lngSpan;
                const minLat = mapLat - latSpan;
                const maxLat = mapLat + latSpan;
                const leftPct =
                  ((userCoords.lng - minLng) / (maxLng - minLng)) * 100;
                const topPct =
                  ((maxLat - userCoords.lat) / (maxLat - minLat)) * 100;
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "20px",
                        height: "20px",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          background: "rgba(74,127,165,0.3)",
                          animation:
                            "ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: "4px",
                          borderRadius: "50%",
                          background: "#4a7fa5",
                          border: "2px solid #fff",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "6px",
                        color: "#fff",
                        background: "rgba(74,127,165,0.85)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        marginTop: "2px",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      You
                    </span>
                  </div>
                );
              })()}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -65%)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{ position: "relative", width: "28px", height: "28px" }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "rgba(232,168,48,0.25)",
                    animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: "5px",
                    borderRadius: "50%",
                    background: "#e8a830",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#0d1117">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline
                      points="9 22 9 12 15 12 15 22"
                      stroke="#0d1117"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60px",
                background:
                  "linear-gradient(to top, rgba(13,17,23,0.95), transparent)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "14px",
                background: "rgba(13,17,23,0.85)",
                border: "1px solid rgba(232,168,48,0.25)",
                borderRadius: "8px",
                padding: "4px 10px",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#e8a830",
                }}
              >
                Order #{order.orderNumber}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <StatusBadge label={order.financialStatus} />
              <StatusBadge label={order.fulfillmentStatus} />
            </div>
            {locationDenied && (
              <div
                style={{
                  background: "rgba(248,113,113,0.05)",
                  border: "1px solid rgba(248,113,113,0.15)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(248,113,113,0.7)",
                    letterSpacing: "0.04em",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Location access denied. Enable it in your browser settings to
                  see your position on the map.
                </p>
              </div>
            )}
            {userCoords && (
              <div
                style={{
                  background: "rgba(74,222,128,0.05)",
                  border: "1px solid rgba(74,222,128,0.15)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(74,222,128,0.7)",
                    letterSpacing: "0.04em",
                    margin: 0,
                  }}
                >
                  Your location detected — map updated.
                </p>
              </div>
            )}
            <div
              style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "rgba(232,168,48,0.1)",
                  border: "1px solid rgba(232,168,48,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e8a830"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "7px",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#e8a830",
                    margin: "0 0 3px",
                  }}
                >
                  Shop Origin
                </p>
                <p
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#f5f7f9",
                    margin: "0 0 2px",
                  }}
                >
                  {SHOP_LOCATION.name}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(245,247,249,0.35)",
                    margin: 0,
                    lineHeight: 1.5,
                    letterSpacing: "0.02em",
                  }}
                >
                  {SHOP_LOCATION.address}
                </p>
              </div>
            </div>
            {addr && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    background: "rgba(74,127,165,0.1)",
                    border: "1px solid rgba(74,127,165,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4a7fa5"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "7px",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#4a7fa5",
                      margin: "0 0 3px",
                    }}
                  >
                    Delivery To
                  </p>
                  <p
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f5f7f9",
                      margin: "0 0 2px",
                    }}
                  >
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "rgba(245,247,249,0.35)",
                      margin: 0,
                      lineHeight: 1.5,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {addr.address1}
                    {addr.address2 ? `, ${addr.address2}` : ""}
                    <br />
                    {addr.city}, {addr.province} {addr.zip}
                  </p>
                </div>
              </div>
            )}
            <div
              style={{
                paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.25)",
                  margin: "0 0 20px",
                }}
              >
                Delivery Progress
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {stages.map((stage, i) => {
                  const isLast = i === stages.length - 1;
                  const isDone = stage.status === "done";
                  const isActive = stage.status === "active";
                  const dotColor =
                    isDone || isActive ? "#e8a830" : "rgba(255,255,255,0.1)";
                  const lineColor = isDone
                    ? "rgba(232,168,48,0.4)"
                    : "rgba(255,255,255,0.07)";
                  return (
                    <div
                      key={stage.label}
                      style={{ display: "flex", gap: "16px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flexShrink: 0,
                          paddingTop: "2px",
                        }}
                      >
                        <div
                          style={{
                            width: isDone ? "10px" : isActive ? "12px" : "8px",
                            height: isDone ? "10px" : isActive ? "12px" : "8px",
                            borderRadius: "50%",
                            background: dotColor,
                            flexShrink: 0,
                            boxShadow: isActive
                              ? "0 0 0 4px rgba(232,168,48,0.12), 0 0 12px rgba(232,168,48,0.3)"
                              : "none",
                            border:
                              isDone || isActive
                                ? "none"
                                : "1px solid rgba(255,255,255,0.12)",
                            transition: "all 0.2s",
                          }}
                        />
                        {!isLast && (
                          <div
                            style={{
                              width: "1px",
                              flex: 1,
                              minHeight: "32px",
                              background: lineColor,
                              margin: "5px 0",
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          paddingBottom: isLast ? "0" : "20px",
                          flex: 1,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: isDone
                              ? "#f5f7f9"
                              : isActive
                                ? "#e8a830"
                                : "rgba(245,247,249,0.2)",
                            margin: "0 0 3px",
                          }}
                        >
                          {stage.label}
                        </p>
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: isDone
                              ? "rgba(245,247,249,0.4)"
                              : isActive
                                ? "rgba(232,168,48,0.7)"
                                : "rgba(245,247,249,0.15)",
                            margin: stage.time ? "0 0 2px" : "0",
                            letterSpacing: "0.04em",
                            lineHeight: 1.5,
                          }}
                        >
                          {stage.sub}
                        </p>
                        {stage.time && (
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: "8px",
                              color: "rgba(245,247,249,0.25)",
                              margin: 0,
                              letterSpacing: "0.06em",
                            }}
                          >
                            {stage.time}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "12px",
                background: "rgba(232,168,48,0.06)",
                border: "1px solid rgba(232,168,48,0.18)",
                borderRadius: "8px",
                color: "#e8a830",
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
      <style>{`@keyframes ping { 75%, 100% { transform: scale(1.9); opacity: 0; } }`}</style>
    </>,
    document.body,
  );
}

// ─── Address cache ────────────────────────────────────────────────────────────
const addressCache = new Map<string, Address[]>();

function AddressSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "12px",
      }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.05)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div
                style={{
                  height: "10px",
                  width: "55%",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <div
                style={{
                  height: "8px",
                  width: "80%",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
              <div
                style={{
                  height: "8px",
                  width: "60%",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
              <div
                style={{
                  height: "8px",
                  width: "40%",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.03)",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "28px",
                borderRadius: "7px",
                background: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              style={{
                flex: 1,
                height: "28px",
                borderRadius: "7px",
                background: "rgba(74,127,165,0.06)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressesSection({ customerId }: { customerId: string }) {
  const [addresses, setAddresses] = useState<Address[]>(
    () => addressCache.get(customerId) ?? [],
  );
  const [loading, setLoading] = useState(() => !addressCache.has(customerId));
  const [editingAddress, setEditingAddress] = useState<
    Address | null | undefined
  >(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (addressCache.has(customerId)) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/account-api/addresses?customerId=${encodeURIComponent(customerId)}`,
        );
        const data = await res.json();
        if (!cancelled) {
          const list = data.addresses ?? [];
          addressCache.set(customerId, list);
          setAddresses(list);
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function handleSave(data: Omit<Address, "id" | "isDefault">) {
    if (editingAddress === null) {
      try {
        const res = await fetch("/api/account-api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, ...data }),
        });
        const result = await res.json();
        if (res.ok && result.address) {
          setAddresses((prev) => {
            const next = [...prev, result.address];
            addressCache.set(customerId, next);
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to create address", err);
      }
    } else if (editingAddress) {
      try {
        const res = await fetch(
          `/api/account-api/addresses/${editingAddress.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );
        const result = await res.json();
        if (res.ok && result.address) {
          setAddresses((prev) => {
            const next = prev.map((a) =>
              a.id === editingAddress.id ? result.address : a,
            );
            addressCache.set(customerId, next);
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to update address", err);
      }
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/account-api/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a.id !== id);
          if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
            filtered[0] = { ...filtered[0], isDefault: true };
          }
          addressCache.set(customerId, filtered);
          return filtered;
        });
      }
    } catch (err) {
      console.error("Failed to delete address", err);
    }
  }

  async function handleSetDefault(id: string) {
    setAddresses((prev) => {
      const next = prev.map((a) => ({ ...a, isDefault: a.id === id }));
      addressCache.set(customerId, next);
      return next;
    });
    try {
      await fetch(`/api/account-api/addresses/${id}/default`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to set default address", err);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setEditingAddress(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(232,168,48,0.08)",
            border: "1px solid rgba(232,168,48,0.2)",
            borderRadius: "8px",
            padding: "7px 14px",
            color: "#e8a830",
            fontFamily: "monospace",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Address
        </button>
      </div>
      {loading && addresses.length === 0 ? (
        <AddressSkeleton />
      ) : addresses.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "56px 24px",
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
            No addresses saved.
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(245,247,249,0.25)",
              letterSpacing: "0.08em",
              margin: 0,
            }}
          >
            Add an address to speed up checkout.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${addr.isDefault ? "rgba(232,168,48,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
              }}
            >
              {addr.isDefault && (
                <span
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#e8a830",
                    background: "rgba(232,168,48,0.1)",
                    border: "1px solid rgba(232,168,48,0.25)",
                    borderRadius: "4px",
                    padding: "2px 7px",
                  }}
                >
                  Default
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(74,127,165,0.1)",
                    border: "1px solid rgba(74,127,165,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4a7fa5"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f5f7f9",
                      margin: "0 0 4px",
                      paddingRight: addr.isDefault ? "56px" : "0",
                    }}
                  >
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.4)",
                      margin: "0 0 2px",
                      letterSpacing: "0.03em",
                      lineHeight: 1.5,
                    }}
                  >
                    {addr.address1}
                    {addr.address2 ? `, ${addr.address2}` : ""}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.4)",
                      margin: "0 0 2px",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {addr.city}, {addr.province} {addr.zip}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.3)",
                      margin: 0,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {addr.phone}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "12px",
                }}
              >
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px",
                      color: "rgba(245,247,249,0.35)",
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => setEditingAddress(addr)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "rgba(74,127,165,0.08)",
                    border: "1px solid rgba(74,127,165,0.2)",
                    borderRadius: "7px",
                    color: "#4a7fa5",
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => setDeletingId(addr.id)}
                    style={{
                      width: "34px",
                      padding: "8px",
                      background: "rgba(248,113,113,0.06)",
                      border: "1px solid rgba(248,113,113,0.15)",
                      borderRadius: "7px",
                      color: "#f87171",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {mounted &&
        editingAddress !== undefined &&
        createPortal(
          <AddressFormDrawer
            address={editingAddress}
            onClose={() => setEditingAddress(undefined)}
            onSave={handleSave}
          />,
          document.body,
        )}
      {mounted &&
        deletingId &&
        createPortal(
          <>
            <div
              onClick={() => setDeletingId(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                zIndex: 99998,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(360px, calc(100vw - 48px))",
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "28px",
                zIndex: 99999,
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.4rem",
                  letterSpacing: "0.06em",
                  color: "#f5f7f9",
                  margin: "0 0 8px",
                }}
              >
                Remove Address?
              </h3>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.4)",
                  letterSpacing: "0.04em",
                  margin: "0 0 24px",
                  lineHeight: 1.6,
                }}
              >
                This address will be permanently removed from your account.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setDeletingId(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    color: "rgba(245,247,249,0.4)",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(deletingId);
                    setDeletingId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

// ─── Pre-orders Section ───────────────────────────────────────────────────────
interface DraftOrder {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  invoiceUrl?: string;
  lineItems: {
    title: string;
    quantity: number;
    variantTitle?: string;
    originalUnitPrice: string;
    image?: string | null;
    imageAlt?: string;
  }[];
  totalPrice: string;
}

function CancelPreOrderButton({
  draftId,
  draftName,
  onCancelled,
}: {
  draftId: string;
  draftName: string;
  onCancelled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/account-api/pre-orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftOrderId: draftId }),
      });
      if (res.ok) {
        setOpen(false);
        onCancelled();
      }
    } catch (err) {
      console.error("Failed to cancel pre-order", err);
    } finally {
      setCancelling(false);
    }
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "11px",
          background: "transparent",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "10px",
          color: "rgba(248,113,113,0.6)",
          fontFamily: "monospace",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Cancel Reservation
      </button>
      {mounted &&
        open &&
        createPortal(
          <>
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 99998,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(380px, calc(100vw - 48px))",
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                padding: "28px",
                zIndex: 99999,
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "18px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(248,113,113,0.5)",
                  margin: "0 0 6px",
                }}
              >
                {draftName}
              </p>
              <h3
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.06em",
                  color: "#f5f7f9",
                  margin: "0 0 10px",
                }}
              >
                Cancel this reservation?
              </h3>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.4)",
                  letterSpacing: "0.04em",
                  margin: "0 0 24px",
                  lineHeight: 1.7,
                }}
              >
                This will remove your reservation. No payment has been made, so
                nothing will be charged. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setOpen(false)}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    color: "rgba(245,247,249,0.4)",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: cancelling ? "default" : "pointer",
                    opacity: cancelling ? 0.5 : 1,
                  }}
                >
                  Keep It
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    padding: "13px",
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "10px",
                    color: "#f87171",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: cancelling ? "default" : "pointer",
                    opacity: cancelling ? 0.6 : 1,
                  }}
                >
                  {cancelling ? "Cancelling…" : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function PreOrdersSection({ email }: { email?: string }) {
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(`/api/account-api/pre-orders?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setDrafts(d.draftOrders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);
  const statusColor = (s: string) =>
    s === "OPEN"
      ? "#e8a830"
      : s === "COMPLETED"
        ? "#4ade80"
        : "rgba(245,247,249,0.35)";
  if (loading)
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(245,247,249,0.3)",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Loading pre-orders…
        </p>
      </div>
    );
  if (drafts.length === 0)
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "56px 24px",
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
          No pre-orders yet.
        </p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(245,247,249,0.25)",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Items you reserve will appear here pending stock confirmation.
        </p>
      </div>
    );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "rgba(232,168,48,0.05)",
          border: "1px solid rgba(232,168,48,0.15)",
          borderRadius: "12px",
          padding: "14px 18px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e8a830"
          strokeWidth="2"
          style={{ marginTop: "1px", flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(245,247,249,0.4)",
            letterSpacing: "0.04em",
            margin: 0,
            lineHeight: 1.6,
            minWidth: 0,
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          These are items you've reserved. No payment has been charged yet —
          we'll send you a payment link once stock is confirmed.
        </p>
      </div>
      {drafts.map((draft) => (
        <div
          key={draft.id}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxSizing: "border-box",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
              width: "100%",
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.25)",
                  margin: "0 0 4px",
                }}
              >
                Reserved
              </p>
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.06em",
                  color: "#f5f7f9",
                  margin: 0,
                }}
              >
                {draft.name}
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "rgba(245,247,249,0.3)",
                  letterSpacing: "0.04em",
                  margin: "4px 0 0",
                }}
              >
                {formatDate(draft.createdAt, true)}
              </p>
            </div>
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
                color: statusColor(draft.status),
                background: `${statusColor(draft.status)}18`,
                border: `1px solid ${statusColor(draft.status)}40`,
                borderRadius: "6px",
                padding: "3px 8px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: statusColor(draft.status),
                  flexShrink: 0,
                }}
              />
              {draft.status === "OPEN" ? "Awaiting Confirmation" : draft.status}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {draft.lineItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(232,168,48,0.08)",
                      border: "1px solid rgba(232,168,48,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.imageAlt ?? item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(232,168,48,0.5)"
                        strokeWidth="1.5"
                      >
                        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#f5f7f9",
                        margin: "0 0 2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                    {item.variantTitle &&
                      item.variantTitle !== "Default Title" && (
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: "rgba(245,247,249,0.35)",
                            margin: 0,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {item.variantTitle} · Qty: {item.quantity}
                        </p>
                      )}
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1rem",
                    letterSpacing: "0.06em",
                    color: "#e8a830",
                    margin: 0,
                    flexShrink: 0,
                  }}
                >
                  ₱
                  {(
                    parseFloat(item.originalUnitPrice) * item.quantity
                  ).toLocaleString("en-PH")}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.25)",
                    margin: "0 0 2px",
                  }}
                >
                  Total (upon confirmation)
                </p>
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.3rem",
                    letterSpacing: "0.06em",
                    color: "#e8a830",
                    margin: 0,
                  }}
                >
                  ₱{parseFloat(draft.totalPrice).toLocaleString("en-PH")}
                </p>
              </div>
              {draft.invoiceUrl && (
                <a
                  href={draft.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(232,168,48,0.08)",
                    border: "1px solid rgba(232,168,48,0.25)",
                    borderRadius: "8px",
                    padding: "9px 16px",
                    color: "#e8a830",
                    fontFamily: "monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  View Invoice
                </a>
              )}
            </div>
            {draft.status === "OPEN" && (
              <CancelPreOrderButton
                draftId={draft.id}
                draftName={draft.name}
                onCancelled={() =>
                  setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
                }
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection({
  customer,
  customerId,
  onCustomerUpdate,
}: {
  customer: CustomerData;
  customerId: string;
  onCustomerUpdate: (updated: CustomerData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: customer.displayName,
    phone: customer.phone ?? "",
  });
  useEffect(() => {
    if (!editing) {
      setForm({
        displayName: customer.displayName,
        phone: customer.phone ?? "",
      });
    }
  }, [customer.displayName, customer.phone, editing]);
  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f5f7f9",
    fontFamily: "monospace",
    fontSize: "11px",
    letterSpacing: "0.04em",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontFamily: "monospace",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "rgba(245,247,249,0.3)",
    display: "block",
    marginBottom: "6px",
  };
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/account-api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          displayName: form.displayName,
          phone: form.phone,
        }),
      });
      const result = await res.json();
      if (res.ok && result.customer) {
        onCustomerUpdate({ ...customer, ...result.customer });
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  }
  function handleCancel() {
    setForm({ displayName: customer.displayName, phone: customer.phone ?? "" });
    setEditing(false);
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "520px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(232,168,48,0.1)",
            border: "2px solid rgba(232,168,48,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.6rem",
              color: "#e8a830",
            }}
          >
            {form.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.4rem",
              letterSpacing: "0.06em",
              color: "#f5f7f9",
              margin: "0 0 4px",
            }}
          >
            {form.displayName}
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(245,247,249,0.35)",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            {customer.email}
          </p>
        </div>
      </div>
      {saved && (
        <div
          style={{
            background: "rgba(74,222,128,0.06)",
            border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "#4ade80",
              letterSpacing: "0.06em",
            }}
          >
            Profile updated successfully.
          </span>
        </div>
      )}
      {editing ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              style={inputStyle}
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              placeholder="Your name"
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+639123456789"
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <div
              style={{
                ...inputStyle,
                color: "rgba(245,247,249,0.25)",
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{customer.email}</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.2)",
                }}
              >
                Via Shopify
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                color: "rgba(245,247,249,0.4)",
                fontFamily: "monospace",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2,
                padding: "12px",
                background: "#e8a830",
                border: "none",
                borderRadius: "10px",
                color: "#0d1117",
                fontFamily: "monospace",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Name", value: form.displayName },
              { label: "Email", value: customer.email ?? "—" },
              { label: "Phone", value: form.phone || "—" },
              {
                label: "Total Orders",
                value: String(customer.numberOfOrders ?? 0),
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.3)",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "rgba(245,247,249,0.7)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "rgba(232,168,48,0.08)",
              border: "1px solid rgba(232,168,48,0.2)",
              borderRadius: "8px",
              padding: "9px 16px",
              color: "#e8a830",
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
        </>
      )}
      <div
        style={{
          background: "rgba(74,127,165,0.05)",
          border: "1px solid rgba(74,127,165,0.12)",
          borderRadius: "12px",
          padding: "16px 18px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4a7fa5"
          strokeWidth="2"
          style={{ marginTop: "1px", flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(245,247,249,0.35)",
            letterSpacing: "0.04em",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          To change your email or password, use the link Shopify sends to your
          inbox. Password management is handled securely through Shopify.
        </p>
      </div>
    </div>
  );
}

// ─── The Crew Section ─────────────────────────────────────────────────────────
type CrewEventStatus = "upcoming" | "ongoing" | "past";
type CrewEventCategory = "marathon" | "fun-run" | "meetup" | "drop" | "collab";

interface CrewEventRule {
  title: string;
  body: string;
}
interface CrewEvent {
  id: string;
  title: string;
  subtitle?: string;
  category: CrewEventCategory;
  status: CrewEventStatus;
  featured?: boolean;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  locationShort: string;
  lat: number;
  lng: number;
  registrationUrl?: string;
  registrationDeadline?: string;
  registrationFee?: string;
  slots?: number;
  slotsLeft?: number;
  description: string;
  rules?: CrewEventRule[];
  tags?: string[];
  coverColor?: string;
  resultsUrl?: string;
  photosUrl?: string;
}

const CREW_CATEGORY_LABELS: Record<CrewEventCategory, string> = {
  marathon: "Marathon",
  "fun-run": "Fun Run",
  meetup: "Meetup",
  drop: "Drop Event",
  collab: "Collab Drop",
};
const CREW_CATEGORY_COLORS: Record<CrewEventCategory, string> = {
  marathon: "#f87171",
  "fun-run": "#4ade80",
  meetup: "#4a7fa5",
  drop: "#e8a830",
  collab: "#a78bfa",
};
const CREW_STATUS_LABELS: Record<CrewEventStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Live Now",
  past: "Past",
};
const CREW_STATUS_COLORS: Record<CrewEventStatus, string> = {
  upcoming: "#e8a830",
  ongoing: "#4ade80",
  past: "rgba(245,247,249,0.25)",
};

[
  {
    id: "ev-001",
    title: "Sole Marathon GenSan 2026",
    subtitle: "42K through the streets of South.",
    category: "marathon",
    status: "upcoming",
    featured: true,
    date: "2026-09-21T04:00:00",
    time: "4:00 AM gun start",
    location: "Oval Plaza, General Santos City, South Cotabato",
    locationShort: "Oval Plaza, GenSan",
    lat: 6.1098,
    lng: 125.1722,
    registrationUrl: "https://shoepreme.vercel.app/register/sole-marathon-2026",
    registrationDeadline: "2026-09-07T23:59:00",
    registrationFee: "₱750",
    slots: 1000,
    slotsLeft: 312,
    description:
      "The biggest Shoepreme-backed road race to date. Full 42K, Half 21K, and 10K distances. Certified route, chip timing, finisher medal, and an exclusive marathon colorway for all 42K finishers.",
    rules: [
      {
        title: "Distances & Age Requirements",
        body: "42K Full Marathon · 21K Half Marathon · 10K Road Race. Minimum age: 18 for 42K, 15 for 21K (with guardian consent), 12 for 10K.",
      },
      {
        title: "Medical Clearance",
        body: "42K participants must submit a medical certificate from a licensed physician at kit claiming. No clearance, no bib.",
      },
      {
        title: "Cut-off Times",
        body: "42K: 6 hrs · 21K: 3.5 hrs · 10K: 2 hrs. Course reopens to traffic after official cut-off.",
      },
      {
        title: "Race Kit Claiming",
        body: "September 18–20 at Shoepreme Store, Conel-Olympog Rd, GenSan. Valid ID required. No proxy claiming without signed authorization.",
      },
      {
        title: "Bib & Chip Timing",
        body: "Bib on the front of your shirt at all times. Timing chip attaches to shoelaces. Lost chips billed at ₱300.",
      },
      {
        title: "Hydration Stations",
        body: "Water and electrolyte stations every 3 km. Personal hydration packs allowed. Littering outside designated zones = disqualification.",
      },
    ],
    tags: ["42K", "21K", "10K", "Chip Timing", "Finisher Medal"],
    coverColor: "#f87171",
  },
  {
    id: "ev-002",
    title: "Shoepreme Fun Run 2026",
    subtitle: "Run with the crew. Win with the fit.",
    category: "fun-run",
    status: "upcoming",
    date: "2026-08-10T06:00:00",
    time: "6:00 AM",
    location: "Quirino Grandstand, Rizal Park, Manila",
    locationShort: "Rizal Park, Manila",
    lat: 14.5831,
    lng: 120.9794,
    registrationUrl: "https://shoepreme.vercel.app/register/fun-run-2026",
    registrationDeadline: "2026-07-31T23:59:00",
    registrationFee: "₱350",
    slots: 500,
    slotsLeft: 143,
    description:
      "Annual Shoepreme fun run. 3K, 5K, and 10K categories. Every participant gets a finisher tee, medal, and entry into the exclusive colorway raffle.",
    rules: [
      {
        title: "Registration",
        body: "Online pre-registration only. No walk-in on race day. Non-transferable and non-refundable.",
      },
      {
        title: "Race Kit Claiming",
        body: "August 7–9 at Shoepreme Gensan. Valid ID required.",
      },
      { title: "Cut-off Time", body: "3K: 45 min · 5K: 1.5 hrs · 10K: 2 hrs." },
      {
        title: "Prohibited Items",
        body: "No strollers, pets, skates, or bicycles on the course.",
      },
    ],
    tags: ["3K", "5K", "10K", "Finisher Tee", "Medal"],
    coverColor: "#e8a830",
  },
  {
    id: "ev-003",
    title: "Crew Night Market Vol. 3",
    subtitle: "Sneakers. Streetwear. Sounds.",
    category: "meetup",
    status: "upcoming",
    date: "2026-07-26T18:00:00",
    endDate: "2026-07-27T00:00:00",
    time: "6:00 PM – 12:00 AM",
    location: "SM City Gensan Activity Center, General Santos City",
    locationShort: "SM Gensan, GenSan",
    lat: 6.1107,
    lng: 125.1716,
    registrationUrl: "https://shoepreme.vercel.app/register/night-market-3",
    registrationFee: "Free Entry",
    description:
      "Third edition of the Crew Night Market. Vendors, live DJ sets, raffles, and an exclusive drop for attendees only.",
    rules: [
      {
        title: "Vendor Applications",
        body: "Apply via vendor form. Deadline July 20. Table fee: ₱500 flat.",
      },
      {
        title: "Trade Guidelines",
        body: "All trades are between individuals. Shoepreme is not liable. Always authenticate before you trade.",
      },
      {
        title: "Exclusive Drop",
        body: "One colorway available only at the event. Limit one pair per attendee. Raffle-based — stubs distributed at the gate from 6 PM.",
      },
    ],
    tags: ["Free Entry", "Live DJ", "Raffle", "Vendors"],
    coverColor: "#4a7fa5",
  },
  {
    id: "ev-004",
    title: "Shoepreme x Local Breed Collab Drop",
    subtitle: "Limited. Announced here first.",
    category: "collab",
    status: "ongoing",
    date: "2026-07-05T10:00:00",
    endDate: "2026-07-20T23:59:00",
    time: "Online drop — 10:00 AM",
    location: "Shoepreme Store + Online",
    locationShort: "GenSan + Online",
    lat: 6.1098,
    lng: 125.172,
    registrationUrl: "https://shoepreme.vercel.app/products",
    registrationFee: "See product page",
    description:
      "Shoepreme x Local Breed limited collab. Two colorways, 100 pairs each. In-store raffle alongside an online cart drop.",
    rules: [
      {
        title: "In-Store Raffle",
        body: "Entries July 5–7. One entry per valid ID. Winners notified July 8 via SMS.",
      },
      {
        title: "Online Drop",
        body: "Cart opens July 5, 10:00 AM. Limit one pair per account. Reservations expire in 10 minutes.",
      },
      {
        title: "Payment",
        body: "Full payment within 24 hrs. Unclaimed wins roll to waitlist.",
      },
    ],
    tags: ["Limited", "Collab", "Raffle", "100 Pairs"],
    coverColor: "#a78bfa",
  },
  {
    id: "ev-005",
    title: "Crew Run: Koronadal City Loop",
    subtitle: "15K casual group run.",
    category: "fun-run",
    status: "past",
    date: "2026-06-01T05:30:00",
    time: "5:30 AM",
    location: "Marbel Public Plaza, Koronadal City",
    locationShort: "Marbel Plaza, Koronadal",
    lat: 6.5027,
    lng: 124.8474,
    description:
      "Monthly crew run through the Koronadal loop. Casual pace, no race clock — vibes, kicks, and post-run breakfast.",
    tags: ["15K", "Casual", "Monthly"],
    coverColor: "rgba(245,247,249,0.15)",
    photosUrl: "https://shoepreme.vercel.app/gallery/koronadal-loop-2026",
  },
];

function crewCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Ended", urgent: false };
  if (days === 0) return { label: "Today", urgent: true };
  if (days === 1) return { label: "Tomorrow", urgent: true };
  if (days <= 7) return { label: `${days}d away`, urgent: true };
  return { label: `${days} days away`, urgent: false };
}

function crewFormatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function crewSlotsPct(left: number, total: number) {
  return Math.round(((total - left) / total) * 100);
}

function crewCalUrl(event: CrewEvent) {
  const start =
    new Date(event.date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = event.endDate
    ? new Date(event.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] +
      "Z"
    : new Date(new Date(event.date).getTime() + 3 * 60 * 60 * 1000)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description.slice(0, 200))}&location=${encodeURIComponent(event.location)}`;
}

function CrewMapPreview({ event }: { event: CrewEvent }) {
  const span = 0.015;
  const accentColor = event.coverColor?.startsWith("#")
    ? event.coverColor
    : CREW_CATEGORY_COLORS[event.category];
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${event.lng - span},${event.lat - span},${event.lng + span},${event.lat + span}&layer=mapnik&marker=${event.lat},${event.lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <iframe
        src={src}
        width="100%"
        height="160"
        style={{
          border: 0,
          display: "block",
          filter: "brightness(0.62) saturate(0.65)",
          pointerEvents: "none",
        }}
        loading="lazy"
        title={event.locationShort}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "56px",
          background:
            "linear-gradient(to top, rgba(13,17,23,0.96), transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -65%)",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", width: "24px", height: "24px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `${accentColor}30`,
              animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "4px",
              borderRadius: "50%",
              background: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#0d1117">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" fill="#0d1117" />
            </svg>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "7px",
          left: "10px",
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "7px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(245,247,249,0.45)",
            margin: 0,
          }}
        >
          {event.locationShort}
        </p>
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          bottom: "7px",
          right: "10px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(13,17,23,0.85)",
          border: `1px solid ${accentColor}50`,
          borderRadius: "20px",
          padding: "2px 8px",
          textDecoration: "none",
          zIndex: 2,
        }}
      >
        <svg
          width="7"
          height="7"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "7px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: accentColor,
          }}
        >
          Maps
        </span>
      </a>
    </div>
  );
}

function CrewRulesAccordion({
  rules,
  accentColor,
}: {
  rules: CrewEventRule[];
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          background: `${accentColor}08`,
          border: `1px solid ${accentColor}25`,
          borderRadius: open ? "8px 8px 0 0" : "8px",
          padding: "10px 14px",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accentColor,
            }}
          >
            Rules & Guidelines
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "7px",
              color: `${accentColor}80`,
              background: `${accentColor}15`,
              borderRadius: "10px",
              padding: "1px 6px",
            }}
          >
            {rules.length}
          </span>
        </div>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            border: `1px solid ${accentColor}20`,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            overflow: "hidden",
          }}
        >
          {rules.map((rule, i) => (
            <div
              key={i}
              style={{
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "10px 14px",
                  background:
                    expanded === i
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(13,17,23,0.5)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "9px" }}
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      background: `${accentColor}15`,
                      border: `1px solid ${accentColor}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontFamily: "monospace",
                      fontSize: "7px",
                      fontWeight: 800,
                      color: accentColor,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: "rgba(245,247,249,0.65)",
                    }}
                  >
                    {rule.title}
                  </span>
                </div>
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(245,247,249,0.25)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    transform: expanded === i ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {expanded === i && (
                <div style={{ padding: "0 14px 12px 39px" }}>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.42)",
                      letterSpacing: "0.03em",
                      lineHeight: 1.75,
                      margin: 0,
                    }}
                  >
                    {rule.body}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CrewLiveCountdown({ targetIso }: { targetIso: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    function calc() {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    }
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  const units = [
    { l: "D", v: t.d },
    { l: "H", v: t.h },
    { l: "M", v: t.m },
    { l: "S", v: t.s },
  ];
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {units.map((u, i) => (
        <div
          key={u.l}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                letterSpacing: "0.06em",
                color: "#f5f7f9",
                lineHeight: 1,
                minWidth: "36px",
                textAlign: "center",
              }}
            >
              {String(u.v).padStart(2, "0")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "6px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.28)",
                textAlign: "center",
              }}
            >
              {u.l}
            </div>
          </div>
          {i < 3 && (
            <div
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.1rem",
                color: "rgba(245,247,249,0.2)",
                paddingBottom: "12px",
              }}
            >
              :
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RegisterButton({
  event,
  accentColor,
  customerName,
  customerEmail,
  customerPhone,
}: {
  event: CrewEvent;
  accentColor: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: customerName ?? "",
    email: customerEmail ?? "",
    phone: customerPhone ?? "",
  });
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!customerEmail) return;
    fetch(`/api/admin/crew-events/${event.id}/registrations`)
      .then((r) => r.json())
      .then((data) => {
        const regs = data.registrations ?? [];
        if (regs.some((r: any) => r.email === customerEmail)) {
          setAlreadyRegistered(true);
        }
      })
      .catch(() => {});
  }, [event.id, customerEmail]);

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/crew/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setOpen(false);
      } else if (data.error === "Already registered") {
        setAlreadyRegistered(true);
        setOpen(false);
      } else setError(data.error ?? "Registration failed.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done || alreadyRegistered) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px",
          background: alreadyRegistered
            ? "rgba(232,168,48,0.06)"
            : "rgba(74,222,128,0.06)",
          border: `1px solid ${alreadyRegistered ? "rgba(232,168,48,0.2)" : "rgba(74,222,128,0.2)"}`,
          borderRadius: "9px",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={alreadyRegistered ? "#e8a830" : "#4ade80"}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            color: alreadyRegistered ? "#e8a830" : "#4ade80",
            letterSpacing: "0.08em",
            fontWeight: 700,
          }}
        >
          {alreadyRegistered
            ? "Already registered for this event."
            : "You're registered!"}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          width: "100%",
          padding: "12px",
          background: done
            ? "rgba(74,222,128,0.06)"
            : event.status === "ongoing"
              ? accentColor
              : `${accentColor}12`,
          border: `1px solid ${done ? "rgba(74,222,128,0.2)" : accentColor}${event.status === "ongoing" ? "" : "32"}`,
          borderRadius: "9px",
          color: done
            ? "#4ade80"
            : event.status === "ongoing"
              ? "#0d1117"
              : accentColor,
          fontFamily: "monospace",
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        {event.status === "ongoing" ? "Join Now →" : "Register →"}
      </button>
      {mounted &&
        open &&
        createPortal(
          <>
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 99998,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(400px, calc(100vw - 48px))",
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                padding: "28px",
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: accentColor,
                    margin: "0 0 4px",
                  }}
                >
                  Register
                </p>
                <h3
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.5rem",
                    letterSpacing: "0.05em",
                    color: "#f5f7f9",
                    margin: 0,
                  }}
                >
                  {event.title}
                </h3>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(245,247,249,0.3)",
                    margin: "4px 0 0",
                    letterSpacing: "0.04em",
                  }}
                >
                  {event.locationShort}
                </p>
              </div>
              {[
                {
                  label: "Full Name *",
                  key: "name",
                  placeholder: "Juan dela Cruz",
                },
                {
                  label: "Email *",
                  key: "email",
                  placeholder: "juan@email.com",
                },
                {
                  label: "Phone (optional)",
                  key: "phone",
                  placeholder: "+639123456789",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
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
                    {label}
                  </p>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "#f5f7f9",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              {error && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "#f87171",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    color: "rgba(245,247,249,0.4)",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: accentColor,
                    border: "none",
                    borderRadius: "10px",
                    color: "#0d1117",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor: submitting ? "default" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Submitting…" : "Confirm Registration"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function CrewEventCard({
  event,
  defaultOpen = false,
  customerName,
  customerEmail,
  customerPhone,
}: {
  event: CrewEvent;
  defaultOpen?: boolean;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const catColor = CREW_CATEGORY_COLORS[event.category];
  const accentColor = event.coverColor?.startsWith("#")
    ? event.coverColor
    : catColor;
  const cd = crewCountdown(event.date);

  function copyShare() {
    navigator.clipboard
      .writeText(`${window.location.origin}/account#crew-${event.id}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }

  return (
    <div
      id={`crew-${event.id}`}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          `${accentColor}35`)
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(255,255,255,0.07)")
      }
    >
      {/* Accent top bar */}
      <div
        style={{
          height: "3px",
          background:
            event.status === "past"
              ? "rgba(255,255,255,0.05)"
              : `linear-gradient(90deg, ${accentColor}, ${accentColor}30)`,
        }}
      />

      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: "5px",
                flexWrap: "wrap",
                marginBottom: "7px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: catColor,
                  background: `${catColor}14`,
                  border: `1px solid ${catColor}30`,
                  borderRadius: "5px",
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}
              >
                {CREW_CATEGORY_LABELS[event.category]}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: CREW_STATUS_COLORS[event.status],
                  background: `${CREW_STATUS_COLORS[event.status]}14`,
                  border: `1px solid ${CREW_STATUS_COLORS[event.status]}30`,
                  borderRadius: "5px",
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}
              >
                {event.status === "ongoing" && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#4ade80",
                      flexShrink: 0,
                    }}
                  />
                )}
                {CREW_STATUS_LABELS[event.status]}
              </span>
            </div>
            <h3
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.3rem",
                letterSpacing: "0.05em",
                color:
                  event.status === "past"
                    ? "rgba(245,247,249,0.38)"
                    : "#f5f7f9",
                margin: "0 0 2px",
                lineHeight: 1,
              }}
            >
              {event.title}
            </h3>
            {event.subtitle && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "rgba(245,247,249,0.28)",
                  letterSpacing: "0.04em",
                  margin: 0,
                }}
              >
                {event.subtitle}
              </p>
            )}
          </div>
          {event.status !== "past" && (
            <div
              style={{
                flexShrink: 0,
                background: `${accentColor}0e`,
                border: `1px solid ${accentColor}25`,
                borderRadius: "7px",
                padding: "5px 10px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "0.95rem",
                  letterSpacing: "0.06em",
                  color: cd.urgent ? accentColor : "rgba(245,247,249,0.4)",
                  margin: 0,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {cd.label}
              </p>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "7px",
            marginBottom: "12px",
          }}
        >
          {[
            {
              icon: (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={catColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
              label: "Date",
              value: crewFormatDate(event.date),
            },
            {
              icon: (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={catColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
              label: "Time",
              value: event.time ?? "TBA",
            },
            {
              icon: (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={catColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
              label: "Venue",
              value: event.locationShort,
            },
            {
              icon: (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={catColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              ),
              label: "Entry",
              value: event.registrationFee ?? "Free",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "7px",
                padding: "8px 10px",
                display: "flex",
                gap: "7px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ marginTop: "1px", flexShrink: 0 }}>
                {item.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "6px",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.2)",
                    margin: "0 0 2px",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(245,247,249,0.62)",
                    letterSpacing: "0.03em",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tags */}
        {event.tags && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            {event.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "monospace",
                  fontSize: "7px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.28)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Slot progress */}
        {event.slots &&
          event.slotsLeft !== undefined &&
          event.status !== "past" && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "5px",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "7px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.22)",
                  }}
                >
                  Slots
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    color:
                      event.slotsLeft < event.slots * 0.2
                        ? "#f87171"
                        : catColor,
                    fontWeight: 700,
                  }}
                >
                  {event.slotsLeft} left / {event.slots}
                </span>
              </div>
              <div
                style={{
                  height: "3px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${crewSlotsPct(event.slotsLeft, event.slots)}%`,
                    background:
                      event.slotsLeft < event.slots * 0.2
                        ? "#f87171"
                        : catColor,
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          )}

        {/* Reg deadline warning */}
        {event.registrationDeadline && event.status !== "past" && (
          <div
            style={{
              background: "rgba(248,113,113,0.04)",
              border: "1px solid rgba(248,113,113,0.12)",
              borderRadius: "7px",
              padding: "6px 11px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                color: "rgba(248,113,113,0.62)",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              Reg closes {crewFormatDate(event.registrationDeadline)}
            </p>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 0 12px",
            color: "rgba(245,247,249,0.26)",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {expanded ? "Less" : "More Info"}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Expanded body */}
        {expanded && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Live countdown for featured upcoming */}
            {event.featured && event.status !== "past" && (
              <div
                style={{
                  background: `${accentColor}08`,
                  border: `1px solid ${accentColor}20`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "7px",
                    fontWeight: 800,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.25)",
                    margin: "0 0 8px",
                  }}
                >
                  Starts In
                </p>
                <CrewLiveCountdown targetIso={event.date} />
              </div>
            )}
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "rgba(245,247,249,0.45)",
                letterSpacing: "0.04em",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              {event.description}
            </p>
            <div
              style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke={catColor}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ marginTop: "2px", flexShrink: 0 }}
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "7px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.2)",
                    margin: "0 0 3px",
                  }}
                >
                  Full Address
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(245,247,249,0.48)",
                    letterSpacing: "0.03em",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {event.location}
                </p>
              </div>
            </div>
            <CrewMapPreview event={event} />
            {event.rules && event.rules.length > 0 && (
              <CrewRulesAccordion
                rules={event.rules}
                accentColor={accentColor}
              />
            )}
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {event.status !== "past" && (
                <a
                  href={crewCalUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "7px",
                    color: "rgba(245,247,249,0.45)",
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Add to Calendar
                </a>
              )}
              <button
                onClick={copyShare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "7px",
                  color: "rgba(245,247,249,0.45)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {copied ? "Copied!" : "Share"}
              </button>
              {event.photosUrl && (
                <a
                  href={event.photosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "7px",
                    color: "rgba(245,247,249,0.45)",
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Photos
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA button */}
        {event.status !== "past" ? (
          <RegisterButton
            event={event}
            accentColor={accentColor}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
          />
        ) : event.status === "past" ? (
          <div style={{ display: "flex", gap: "7px" }}>
            {event.photosUrl && !expanded ? (
              <a
                href={event.photosUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  padding: "10px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "9px",
                  color: "rgba(245,247,249,0.28)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                View Photos
              </a>
            ) : !event.photosUrl ? (
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "9px",
                  textAlign: "center",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.16)",
                }}
              >
                Event Ended
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const CREW_STATUS_TABS = [
  { key: "all" as const, label: "All" },
  { key: "ongoing" as const, label: "Live" },
  { key: "upcoming" as const, label: "Upcoming" },
  { key: "past" as const, label: "Past" },
];

function TheCrewSection({
  customerName,
  customerEmail,
  customerPhone,
}: {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  const [activeTab, setActiveTab] = useState<CrewEventStatus | "all">("all");
  const [activeCategory, setActiveCategory] = useState<
    CrewEventCategory | "all"
  >("all");
  const [crewEvents, setCrewEvents] = useState<CrewEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/crew-events", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: any[]) => {
        const now = new Date();
        const mapped: CrewEvent[] = (data ?? []).map((ev) => {
          const evDate = new Date(ev.isoDate);
          const category: CrewEventCategory =
            ev.type === "RUN"
              ? "fun-run"
              : ev.type === "RACE"
                ? "marathon"
                : ev.type === "LAUNCH"
                  ? "drop"
                  : "meetup";
          const status: CrewEventStatus = evDate > now ? "upcoming" : "past";
          return {
            id: ev.id,
            title: ev.title,
            subtitle: ev.description ? ev.description.slice(0, 80) : undefined,
            category,
            status,
            date: ev.isoDate,
            time: ev.time ?? undefined,
            location: ev.location,
            locationShort: ev.location.split(",")[0] ?? ev.location,
            lat: ev.lat ? parseFloat(ev.lat) : 6.1098,
            lng: ev.lng ? parseFloat(ev.lng) : 125.172,
            description: ev.description ?? "",
            registrationUrl: ev.registrationUrl ?? undefined,
          };
        });
        setCrewEvents(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(245,247,249,0.3)",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Loading events…
        </p>
      </div>
    );

  const ongoingCount = crewEvents.filter((e) => e.status === "ongoing").length;
  const categories = Array.from(
    new Set(crewEvents.map((e) => e.category)),
  ) as CrewEventCategory[];

  const filtered = crewEvents.filter((e) => {
    const tabMatch = activeTab === "all" || e.status === activeTab;
    const catMatch = activeCategory === "all" || e.category === activeCategory;
    return tabMatch && catMatch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`@keyframes ping { 75%, 100% { transform: scale(1.9); opacity: 0; } }`}</style>

      {/* Stats */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {[
          { label: "Total", value: crewEvents.length, color: "#e8a830" },
          {
            label: "Upcoming",
            value: crewEvents.filter((e) => e.status === "upcoming").length,
            color: "#e8a830",
          },
          { label: "Live Now", value: ongoingCount, color: "#4ade80" },
          {
            label: "Past",
            value: crewEvents.filter((e) => e.status === "past").length,
            color: "rgba(245,247,249,0.3)",
          },
        ].map((s) => (
          <div key={s.label}>
            <p
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.8rem",
                letterSpacing: "0.06em",
                color: s.color,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "7px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.25)",
                margin: 0,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexWrap: "wrap",
          }}
        >
          {CREW_STATUS_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? crewEvents.length
                : crewEvents.filter((e) => e.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 12px",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #e8a830"
                    : "2px solid transparent",
                  marginBottom: "-1px",
                  background: "transparent",
                  color: isActive ? "#e8a830" : "rgba(245,247,249,0.32)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab.key === "ongoing" && ongoingCount > 0 && (
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#4ade80",
                      flexShrink: 0,
                      animation: "ping 1.5s ease-in-out infinite",
                    }}
                  />
                )}
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(232,168,48,0.15)"
                        : "rgba(255,255,255,0.05)",
                      color: isActive ? "#e8a830" : "rgba(245,247,249,0.22)",
                      borderRadius: "20px",
                      padding: "1px 6px",
                      fontSize: "7px",
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              border:
                activeCategory === "all"
                  ? "1px solid rgba(232,168,48,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                activeCategory === "all"
                  ? "rgba(232,168,48,0.1)"
                  : "transparent",
              color:
                activeCategory === "all" ? "#e8a830" : "rgba(245,247,249,0.32)",
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            All
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const color = CREW_CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: isActive
                    ? `1px solid ${color}50`
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive ? `${color}10` : "transparent",
                  color: isActive ? color : "rgba(245,247,249,0.32)",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {CREW_CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events list */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
            padding: "56px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.08em",
              color: "rgba(245,247,249,0.1)",
              margin: "0 0 6px",
            }}
          >
            No Events Found
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(245,247,249,0.2)",
              margin: 0,
            }}
          >
            Try a different filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((event) => (
            <CrewEventCard
              key={event.id}
              event={event}
              defaultOpen={
                !!(
                  event.featured &&
                  event.status !== "past" &&
                  activeTab === "all" &&
                  activeCategory === "all"
                )
              }
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
            />
          ))}
        </div>
      )}

      {/* Social footer */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "14px",
          padding: "18px 20px",
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "8px",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245,247,249,0.22)",
            margin: "0 0 12px",
          }}
        >
          Follow The Crew
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            {
              label: "Facebook",
              url: "https://facebook.com/shoepreme",
              color: "#4a7fa5",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              ),
            },
            {
              label: "Instagram",
              url: "https://instagram.com/shoepreme_ph",
              color: "#a78bfa",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              ),
            },
            {
              label: "Messenger",
              url: "https://m.me/shoepreme",
              color: "#4ade80",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              ),
            },
            {
              label: "TikTok",
              url: "https://tiktok.com/@shoepreme",
              color: "#f87171",
              icon: (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
                </svg>
              ),
            },
          ].map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 13px",
                background: `${s.color}08`,
                border: `1px solid ${s.color}20`,
                borderRadius: "8px",
                color: s.color,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  `${s.color}14`;
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  `${s.color}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  `${s.color}08`;
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  `${s.color}20`;
              }}
            >
              {s.icon}
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
interface AccountClientPropsExtended extends AccountClientProps {
  customerId: string;
  shopifyToken?: string;
  initialOrders?: any[];
}

export default function AccountClient({
  customer,
  customerId,
  shopifyToken,
  initialOrders = [],
  SignOutButton,
}: AccountClientPropsExtended) {
  const [activeSection, setActiveSection] = useState<Section>("orders");
  const [liveCustomer, setLiveCustomer] = useState<CustomerData>(customer);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [ordersLoading, setOrdersLoading] = useState(
    initialOrders.length === 0,
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState("all");
  const [mobileOrdersView, setMobileOrdersView] = useState(false);
  const [mobileSelectedOrder, setMobileSelectedOrder] = useState<Order | null>(
    null,
  );
  const [trackSidebarOrder, setTrackSidebarOrder] = useState<Order | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load(showSpinner = false) {
      if (showSpinner) setOrdersLoading(true);
      try {
        const res = await fetch(
          `/api/account-api/orders?customerAccessToken=${encodeURIComponent(shopifyToken ?? "")}`,
        );
        const data = await res.json();
        if (!cancelled) setOrders(data.orders ?? []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    load(true);
    const interval = setInterval(() => load(), 10000); // silent refresh every 10s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [customerId, shopifyToken]);
  useEffect(() => {
    let cancelled = false;
    async function load(showSpinner = false) {
      if (showSpinner) setOrdersLoading(true);
      try {
        const res = await fetch(
          `/api/account-api/orders?customerAccessToken=${encodeURIComponent(shopifyToken ?? "")}`,
        );
        const data = await res.json();
        if (!cancelled) setOrders(data.orders ?? []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    load(true);
    const interval = setInterval(() => load(), 10000); // silent refresh every 10s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [customerId, shopifyToken]);

  const sectionTitles: Record<Section, string> = {
    orders: selectedOrder
      ? `Order #${selectedOrder.orderNumber}`
      : "Order History",
    addresses: "Saved Addresses",
    "recently-viewed": "Recently Viewed",
    profile: "My Profile",
    "pre-orders": "Pre-orders",
    "the-crew": "The Crew",
  };

  function handleNavClick(key: Section) {
    setActiveSection(key);
    if (key !== "orders") setSelectedOrder(null);
  }

  return (
    <>
      <style>{`
        .mobile-account-header { display: none; }
        .mobile-hide-orders { display: block; }
        @media (max-width: 768px) {
          .mobile-account-header { display: block; }
          .account-layout { flex-direction: column !important; width: 100% !important; }
          .account-sidebar { display: none !important; }
          .account-content { padding: 20px 16px 80px !important; width: 100% !important; max-width: 100% !important; overflow: hidden !important; box-sizing: border-box !important; }
          .mobile-hide-orders { display: none !important; }
          .account-outer { padding: 0 !important; width: 100% !important; overflow: hidden !important; }
        }
        @media (min-width: 769px) {
          .account-sidebar { position: fixed !important; top: 80px !important; left: calc((100vw - 1280px) / 2 + 32px) !important; width: 240px !important; height: calc(100vh - 80px) !important; overflow-y: auto !important; z-index: 10 !important; }
          .account-content { margin-left: 240px !important; }
        }
      `}</style>

      {/* ── Mobile Header ── */}
      <div
        className="mobile-account-header"
        style={{
          background: "#0d1117",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "20px 20px 16px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "rgba(232,168,48,0.1)",
              border: "2px solid rgba(232,168,48,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                color: "#e8a830",
              }}
            >
              {liveCustomer.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.1rem",
                letterSpacing: "0.06em",
                color: "#f5f7f9",
                margin: "0 0 2px",
              }}
            >
              {liveCustomer.displayName}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                color: "rgba(245,247,249,0.3)",
                letterSpacing: "0.04em",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {liveCustomer.email}
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>{SignOutButton}</div>
        </div>
        <div
          style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {NAV_ITEMS.filter((n) => n.key !== "orders").map(
            ({ key, label, icon }) => {
              const isActive = activeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveSection(key as Section);
                    setSelectedOrder(null);
                  }}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    padding: "12px 8px",
                    background: "none",
                    border: "none",
                    borderTop: isActive
                      ? "2px solid #e8a830"
                      : "2px solid transparent",
                    cursor: "pointer",
                    color: isActive ? "#e8a830" : "rgba(245,247,249,0.35)",
                    transition: "all 0.15s",
                  }}
                >
                  {icon}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}
        className="account-outer"
      >
        <div
          className="account-layout"
          style={{
            display: "flex",
            gap: "0",
            minHeight: "calc(100vh - 80px)",
            alignItems: "flex-start",
          }}
        >
          {/* ── Sidebar ── */}
          <aside
            className="account-sidebar"
            style={{
              width: "240px",
              flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                padding: "0 24px 32px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(232,168,48,0.1)",
                  border: "2px solid rgba(232,168,48,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.2rem",
                    color: "#e8a830",
                  }}
                >
                  {liveCustomer.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.06em",
                  color: "#f5f7f9",
                  margin: "0 0 2px",
                }}
              >
                {liveCustomer.displayName}
              </p>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  color: "rgba(245,247,249,0.3)",
                  letterSpacing: "0.06em",
                  margin: 0,
                  wordBreak: "break-all",
                }}
              >
                {liveCustomer.email}
              </p>
            </div>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "0 12px",
                flex: 1,
              }}
            >
              {NAV_ITEMS.map(({ key, label, icon }) => {
                const isActive = activeSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleNavClick(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      background: isActive
                        ? "rgba(232,168,48,0.08)"
                        : "transparent",
                      color: isActive ? "#e8a830" : "rgba(245,247,249,0.4)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "rgba(245,247,249,0.7)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "rgba(245,247,249,0.4)";
                      }
                    }}
                  >
                    <span
                      style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}
                    >
                      {icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: "#e8a830",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
            <div
              style={{
                padding: "16px 12px 0",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                marginTop: "16px",
              }}
            >
              {SignOutButton}
            </div>
          </aside>

          {/* ── Content ── */}
          <main
            className="account-content"
            style={{ flex: 1, minWidth: 0, padding: "40px 40px 80px" }}
          >
            <div
              style={{ marginBottom: "28px" }}
              className={activeSection === "orders" ? "mobile-hide-orders" : ""}
            >
              {selectedOrder ? (
                <>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      background: "none",
                      border: "none",
                      color: "rgba(245,247,249,0.35)",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      padding: 0,
                      marginBottom: "12px",
                    }}
                  >
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
                      <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    All Orders
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <h1
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                        letterSpacing: "0.04em",
                        color: "#f5f7f9",
                        margin: 0,
                        lineHeight: 0.95,
                      }}
                    >
                      Order #{selectedOrder.orderNumber}
                    </h1>
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      <StatusBadge label={selectedOrder.financialStatus} />
                      <StatusBadge label={selectedOrder.fulfillmentStatus} />
                    </div>
                  </div>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.3)",
                      letterSpacing: "0.08em",
                      margin: "10px 0 0",
                    }}
                  >
                    Placed on {formatDate(selectedOrder.processedAt, true)}
                  </p>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(245,247,249,0.25)",
                      margin: "0 0 4px",
                    }}
                  >
                    Shoepreme Account
                  </p>
                  <h1
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                      letterSpacing: "0.04em",
                      color: "#f5f7f9",
                      margin: 0,
                      lineHeight: 0.95,
                    }}
                  >
                    {sectionTitles[activeSection]}
                  </h1>
                </>
              )}
            </div>

            <div
              className={activeSection === "orders" ? "mobile-hide-orders" : ""}
            >
              {activeSection === "orders" && !selectedOrder && (
                <OrdersSection
                  orders={orders}
                  loading={ordersLoading}
                  onSelect={setSelectedOrder}
                  activeTab={activeOrderTab}
                  setActiveTab={setActiveOrderTab}
                />
              )}
              {activeSection === "orders" && selectedOrder && (
                <OrderDetail
                  order={selectedOrder}
                  onTrack={() => setTrackSidebarOrder(selectedOrder)}
                />
              )}
            </div>
            {activeSection === "addresses" && (
              <AddressesSection customerId={customerId} />
            )}
            {activeSection === "pre-orders" && (
              <PreOrdersSection email={liveCustomer.email} />
            )}
            {activeSection === "the-crew" && (
              <TheCrewSection
                customerName={liveCustomer.displayName}
                customerEmail={liveCustomer.email}
                customerPhone={liveCustomer.phone}
              />
            )}
            {activeSection === "profile" && (
              <ProfileSection
                customer={liveCustomer}
                customerId={customerId}
                onCustomerUpdate={(updated) => setLiveCustomer(updated)}
              />
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile Orders Bottom Bar ── */}
      <div
        className="mobile-account-header"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          background: "rgba(13,17,23,0.97)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 20px 4px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.4)",
            }}
          >
            My Orders
          </span>
          <button
            onClick={() => {
              setActiveOrderTab("all");
              setMobileSelectedOrder(null);
              setMobileOrdersView(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#e8a830",
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            View All{" "}
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            padding: "4px 8px 10px",
          }}
        >
          {[
            {
              label: "To Pay",
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              ),
              tab: "to-pay",
              count: orders.filter((o) => o.financialStatus === "PENDING")
                .length,
            },
            {
              label: "To Ship",
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              ),
              tab: "to-ship",
              count: orders.filter(
                (o) =>
                  o.financialStatus === "PAID" &&
                  o.fulfillmentStatus === "UNFULFILLED",
              ).length,
            },
            {
              label: "To Receive",
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 3v5h-7V8zM1 16h15M5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              ),
              tab: "to-receive",
              count: orders.filter(
                (o) =>
                  o.fulfillmentStatus === "FULFILLED" &&
                  o.financialStatus === "PAID",
              ).length,
            },
            {
              label: "Completed",
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ),
              tab: "completed",
              count: 0,
            },
            {
              label: "Cancelled",
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              ),
              tab: "cancelled",
              count: orders.filter(
                (o) =>
                  o.financialStatus === "REFUNDED" ||
                  o.financialStatus === "VOIDED" ||
                  !!o.cancelledAt,
              ).length,
            },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                setActiveOrderTab(item.tab);
                setMobileSelectedOrder(null);
                setMobileOrdersView(true);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 4px",
                position: "relative",
              }}
            >
              {item.count > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "6px",
                    background: "#e8a830",
                    color: "#0d1117",
                    fontSize: "7px",
                    fontWeight: 900,
                    minWidth: "14px",
                    height: "14px",
                    borderRadius: "7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {item.count}
                </span>
              )}
              <span style={{ color: "rgba(245,247,249,0.6)" }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "7px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.4)",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Track Order Sidebar ── */}
      {mounted && trackSidebarOrder && (
        <TrackOrderSidebar
          orders={orders}
          initialOrder={trackSidebarOrder}
          onClose={() => setTrackSidebarOrder(null)}
        />
      )}

      {/* ── Mobile Orders Overlay ── */}
      {mounted &&
        mobileOrdersView &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: "94px",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#0d1117",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              overflowY: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  setMobileOrdersView(false);
                  setMobileSelectedOrder(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#f5f7f9",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              <h2
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.3rem",
                  letterSpacing: "0.06em",
                  color: "#f5f7f9",
                  margin: 0,
                  flex: 1,
                }}
              >
                {mobileSelectedOrder
                  ? `Order #${mobileSelectedOrder.orderNumber}`
                  : "My Purchases"}
              </h2>
            </div>
            {mobileSelectedOrder ? (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 16px 40px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                  }}
                >
                  <StatusBadge label={mobileSelectedOrder.financialStatus} />
                  <StatusBadge label={mobileSelectedOrder.fulfillmentStatus} />
                </div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "rgba(245,247,249,0.3)",
                    letterSpacing: "0.06em",
                    margin: "0 0 20px",
                  }}
                >
                  Placed on {formatDate(mobileSelectedOrder.processedAt, true)}
                </p>
                <OrderDetail
                  order={mobileSelectedOrder}
                  onTrack={() => setTrackSidebarOrder(mobileSelectedOrder)}
                />
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    flexShrink: 0,
                  }}
                >
                  {ORDER_TABS.map((t) => {
                    const count = orders.filter(t.filter).length;
                    const isActive = activeOrderTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setActiveOrderTab(t.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "13px 16px",
                          border: "none",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          borderBottom: isActive
                            ? "2px solid #e8a830"
                            : "2px solid transparent",
                          marginBottom: "-1px",
                          background: "transparent",
                          color: isActive
                            ? "#e8a830"
                            : "rgba(245,247,249,0.35)",
                          fontFamily: "monospace",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        {t.label}
                        {count > 0 && (
                          <span
                            style={{
                              background: isActive
                                ? "rgba(232,168,48,0.15)"
                                : "rgba(255,255,255,0.06)",
                              color: isActive
                                ? "#e8a830"
                                : "rgba(245,247,249,0.25)",
                              borderRadius: "20px",
                              padding: "1px 6px",
                              fontSize: "8px",
                              fontWeight: 800,
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 16px 40px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {(() => {
                    const tab = ORDER_TABS.find(
                      (t) => t.key === activeOrderTab,
                    )!;
                    const filtered = orders.filter(tab.filter);
                    if (ordersLoading)
                      return (
                        <div style={{ padding: "60px 0", textAlign: "center" }}>
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: "10px",
                              color: "rgba(245,247,249,0.3)",
                              margin: 0,
                            }}
                          >
                            Loading orders…
                          </p>
                        </div>
                      );
                    if (filtered.length === 0)
                      return (
                        <div style={{ padding: "60px 0", textAlign: "center" }}>
                          <p
                            style={{
                              fontFamily: "Bebas Neue, sans-serif",
                              fontSize: "1.4rem",
                              letterSpacing: "0.08em",
                              color: "rgba(245,247,249,0.12)",
                              margin: "0 0 6px",
                            }}
                          >
                            No {tab.label} orders.
                          </p>
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: "10px",
                              color: "rgba(245,247,249,0.2)",
                              margin: 0,
                            }}
                          >
                            Nothing here yet.
                          </p>
                        </div>
                      );
                    return filtered.map((order) => {
                      const items = order.lineItems.edges.map((e) => e.node);
                      const firstImage = items[0]?.variant?.image?.url;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setMobileSelectedOrder(order)}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "14px",
                            padding: "14px 16px",
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            cursor: "pointer",
                            textAlign: "left",
                            width: "100%",
                            boxSizing: "border-box",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              minWidth: "48px",
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
                              <img
                                src={firstImage}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgba(74,127,165,0.5)"
                                strokeWidth="1.5"
                              >
                                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            )}
                          </div>
                          <div
                            style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                                marginBottom: "5px",
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
                            </div>
                            <p
                              style={{
                                fontFamily: "monospace",
                                fontSize: "10px",
                                color: "rgba(245,247,249,0.35)",
                                letterSpacing: "0.04em",
                                margin: "0 0 3px",
                              }}
                            >
                              {formatDate(order.processedAt)} · {items.length}{" "}
                              item{items.length !== 1 ? "s" : ""}
                            </p>
                            <p
                              style={{
                                fontFamily: "monospace",
                                fontSize: "10px",
                                color: "rgba(245,247,249,0.45)",
                                margin: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {items
                                .slice(0, 2)
                                .map((i) => i.title)
                                .join(", ")}
                              {items.length > 2 && ` +${items.length - 2} more`}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Bebas Neue, sans-serif",
                                fontSize: "1.05rem",
                                letterSpacing: "0.06em",
                                color: "#e8a830",
                                margin: 0,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatPrice(
                                order.currentTotalPrice.amount,
                                order.currentTotalPrice.currencyCode,
                              )}
                            </p>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="rgba(245,247,249,0.25)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
