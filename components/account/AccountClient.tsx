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
type Section = "orders" | "addresses" | "recently-viewed" | "profile";

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
  FULFILLED: "#4a7fa5",
  UNFULFILLED: "rgba(245,247,249,0.4)",
  PARTIALLY_FULFILLED: "#e8a830",
  IN_PROGRESS: "#e8a830",
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

// ─── Shared types (now describing API data instead of mock data) ─────────────
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
  currentTotalPrice: MoneyV2;
  subtotalPrice: MoneyV2;
  totalShippingPrice: MoneyV2;
  shippingAddress?: Address | null;
  lineItems: { edges: { node: LineItemNode }[] };
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
    key: "cancelled",
    label: "Cancelled",
    filter: (o) => o.financialStatus === "REFUNDED",
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
      {/* ── Tabs ── */}
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

      {/* ── Empty filtered state ── */}
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

      {/* ── Order rows ── */}
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
function CancelOrderButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/account-api/orders/${order.id}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setCancelled(true);
        setOpen(false);
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
                  margin: "0 0 24px",
                  lineHeight: 1.7,
                }}
              >
                This will send a cancellation request to the store. If payment
                hasn't been made yet, the order will be voided. This action
                cannot be undone.
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
                  Keep Order
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

// ─── Order Detail (inline panel) ──────────────────────────────────────────────
function OrderDetail({ order }: { order: Order }) {
  const items = order.lineItems.edges.map((e) => e.node);
  const addr = order.shippingAddress;
  const isPending = order.financialStatus === "PENDING";
  const [trackingOpen, setTrackingOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* ── Payment Due Banner ── */}
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
          {/* Header */}
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

          {/* Payment methods */}
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                margin: "0 0 10px",
              }}
            >
              How to Pay
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                {
                  label: "GCash",
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <path d="M12 18h.01" />
                    </svg>
                  ),
                },
                {
                  label: "Cash on Delivery",
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                    </svg>
                  ),
                },
                {
                  label: "Pay In-Store",
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  ),
                },
              ].map((method) => (
                <div
                  key={method.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "rgba(245,247,249,0.6)",
                  }}
                >
                  {method.icon}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {method.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
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
            Your order is confirmed and reserved. Complete payment using any
            method above to proceed with fulfillment.
          </p>
        </div>
      )}
      {/* Items */}
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
      {/* Map Preview + Address + Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* ── Left column: mini map ON TOP of shipping address ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {/* Mini map — clickable, same width as the shipping address card below */}
          <button
            onClick={() => setTrackingOpen(true)}
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
            {/* Map iframe */}
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

              {/* Bottom fade into the card below */}
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

              {/* Pulsing shop pin */}
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

              {/* "Tap to Track" pill — bottom right */}
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

              {/* Shop name — bottom left */}
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

          {/* Shipping address card — flush under the map, shares border */}
          {addr && (
            <div>
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
            </div>
          )}
        </div>

        {/* ── Right column: Summary (unchanged) ── */}
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
      {/* Track CTA */}
      <button
        onClick={() => setTrackingOpen(true)}
        style={{
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
          cursor: "pointer",
        }}
      >
        Track Order →
      </button>

      {/* Cancel Order — only for pending/unfulfilled orders */}
      {isPending && <CancelOrderButton order={order} />}
      {/* Tracking modal — rendered via portal so it escapes any overflow:hidden */}
      {trackingOpen && (
        <TrackOrderModal order={order} onClose={() => setTrackingOpen(false)} />
      )}
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
// ─── TrackOrderModal ──────────────────────────────────────────────────────────
function TrackOrderModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const addr = order.shippingAddress;

  const isPaid = order.financialStatus === "PAID";
  const isPending = order.financialStatus === "PENDING";
  const isVoided =
    order.financialStatus === "VOIDED" || order.financialStatus === "REFUNDED";
  const isFulfilled = order.fulfillmentStatus === "FULFILLED";
  const isInProgress =
    order.fulfillmentStatus === "IN_PROGRESS" ||
    order.fulfillmentStatus === "PARTIALLY_FULFILLED";

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
      status: "done",
    },
    {
      label: "Payment Confirmed",
      sub: isPending
        ? "Awaiting your payment"
        : isVoided
          ? "Order voided"
          : "Payment has been verified",
      time: isPaid ? "Confirmed" : isPending ? "Pending" : undefined,
      status: isPaid ? "done" : isPending ? "active" : "pending",
    },
    {
      label: "Preparing Order",
      sub: "Store is packing your items",
      status:
        isFulfilled || isInProgress ? "done" : isPaid ? "active" : "pending",
    },
    {
      label: "Out for Delivery",
      sub: "Your order is on the way",
      status: isFulfilled ? "done" : isInProgress ? "active" : "pending",
    },
    {
      label: "Delivered",
      sub: "Order has been received",
      status: isFulfilled ? "active" : "pending",
    },
  ];

  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${SHOP_LOCATION.lng - 0.02},${SHOP_LOCATION.lat - 0.02},${SHOP_LOCATION.lng + 0.02},${SHOP_LOCATION.lat + 0.02}&layer=mapnik&marker=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`;

  return createPortal(
    <>
      <div
        onClick={onClose}
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
          width: "min(760px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 48px)",
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
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
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                margin: "0 0 4px",
              }}
            >
              Order #{order.orderNumber}
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.7rem",
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

        {/* Body — two-column */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: 0,
          }}
        >
          {/* ── Left: Map + addresses ── */}
          <div
            style={{
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Map */}
            <div
              style={{ position: "relative", height: "220px", flexShrink: 0 }}
            >
              <iframe
                src={osmSrc}
                width="100%"
                height="220"
                style={{
                  border: 0,
                  display: "block",
                  filter: "brightness(0.68) saturate(0.75)",
                }}
                loading="lazy"
                title="Shop location"
              />
              {/* fade */}
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
              {/* pulsing pin */}
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
                  style={{
                    position: "relative",
                    width: "32px",
                    height: "32px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "rgba(232,168,48,0.22)",
                      animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "6px",
                      borderRadius: "50%",
                      background: "#e8a830",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
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
            </div>

            {/* Shop + delivery info */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                flex: 1,
              }}
            >
              {/* Shop */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
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

              {/* Delivery address */}
              {addr && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    paddingTop: "12px",
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

              {/* Open maps CTA */}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
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
                  marginTop: "auto",
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

          {/* ── Right: Order status timeline ── */}
          <div
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
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
                margin: "0 0 4px",
              }}
            >
              Delivery Info
            </p>
            <p
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.6rem",
                letterSpacing: "0.06em",
                color: "#f5f7f9",
                margin: "0 0 6px",
              }}
            >
              #{order.orderNumber}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "28px",
              }}
            >
              <StatusBadge label={order.financialStatus} />
              <StatusBadge label={order.fulfillmentStatus} />
            </div>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {stages.map((stage, i) => {
                const isLast = i === stages.length - 1;
                const isDone = stage.status === "done";
                const isActive = stage.status === "active";
                const dotColor = isDone
                  ? "#e8a830"
                  : isActive
                    ? "#e8a830"
                    : "rgba(255,255,255,0.1)";
                const lineColor = isDone
                  ? "rgba(232,168,48,0.4)"
                  : "rgba(255,255,255,0.07)";

                return (
                  <div
                    key={stage.label}
                    style={{ display: "flex", gap: "16px" }}
                  >
                    {/* Dot + connector line */}
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
                            minHeight: "36px",
                            background: lineColor,
                            margin: "5px 0",
                          }}
                        />
                      )}
                    </div>

                    {/* Text content */}
                    <div
                      style={{
                        paddingBottom: isLast ? "0" : "24px",
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
        </div>

        <style>{`@keyframes ping { 75%, 100% { transform: scale(1.9); opacity: 0; } }`}</style>
      </div>
    </>,
    document.body,
  );
}

// ─── Addresses Section ────────────────────────────────────────────────────────
// ─── Address cache (module-level, survives tab switches) ──────────────────────
// Drop this near the top of account-client.tsx, outside any component.
// Key = customerId, Value = Address[]
const addressCache = new Map<string, Address[]>();

// ─── Skeleton card ────────────────────────────────────────────────────────────
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
          {/* icon + name row */}
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
          {/* button row */}
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

// ─── Addresses Section (replace the existing one) ────────────────────────────
function AddressesSection({ customerId }: { customerId: string }) {
  // Seed state from cache so revisiting the tab is instant
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
    // Already have cached data — skip the network call entirely
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

  // ── helpers that also keep the cache in sync ──────────────────────────────

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
    // Optimistic update — UI reflects instantly, no spinner
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

  // ── render ────────────────────────────────────────────────────────────────

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

      {/* Show skeleton only on first load (no cache). If we have cached data,
          render it immediately even while a background refresh is happening. */}
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

      {/* Portals unchanged */}
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

  // Keep the form in sync if the parent refreshes customer data (e.g. after
  // the initial fetch resolves with real values from MongoDB).
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
        onCustomerUpdate({
          ...customer, // keep email, numberOfOrders, etc.
          ...result.customer, // overwrite only what the server returned
        });
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
      {/* Avatar + name */}
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

      {/* Success banner */}
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

      {/* Form / Display */}
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

      {/* Shopify note */}
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

// ─── Main Export ──────────────────────────────────────────────────────────────
interface AccountClientPropsExtended extends AccountClientProps {
  customerId: string;
  shopifyToken?: string;
}

export default function AccountClient({
  customer,
  customerId,
  shopifyToken,
  SignOutButton,
}: AccountClientPropsExtended) {
  const [activeSection, setActiveSection] = useState<Section>("orders");
  const [liveCustomer, setLiveCustomer] = useState<CustomerData>(customer);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState("all");
  const [mobileOrdersView, setMobileOrdersView] = useState(false);
  const [mobileSelectedOrder, setMobileSelectedOrder] = useState<Order | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch orders for this customer once on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setOrdersLoading(true);
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
    load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const sectionTitles: Record<Section, string> = {
    orders: selectedOrder
      ? `Order #${selectedOrder.orderNumber}`
      : "Order History",
    addresses: "Saved Addresses",
    "recently-viewed": "Recently Viewed",
    profile: "My Profile",
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
          .account-layout { flex-direction: column !important; }
          .account-sidebar { display: none !important; }
            .account-content { padding: 20px 16px 80px !important; }
                      .mobile-hide-orders { display: none !important; }
                    }
            @media (min-width: 769px) {
          .account-sidebar { position: sticky !important; top: 80px !important; align-self: flex-start !important; height: calc(100vh - 80px) !important; overflow-y: auto !important; }
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
        {/* Profile strip */}
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

        {/* Addresses + Profile tabs */}
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

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
        <div
          className="account-layout"
          style={{
            display: "flex",
            gap: "0",
            minHeight: "calc(100vh - 80px)",
            alignItems: "flex-start",
          }}
        >
          {/* ── Sidebar ────────────────────────────────────────────── */}
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
              className="sidebar-user"
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
              className="sidebar-nav"
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
              className="sidebar-signout"
              style={{
                padding: "16px 12px 0",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                marginTop: "16px",
              }}
            >
              {SignOutButton}
            </div>
          </aside>

          {/* ── Content ────────────────────────────────────────────── */}
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
                <OrderDetail order={selectedOrder} />
              )}
            </div>
            {activeSection === "addresses" && (
              <AddressesSection customerId={customerId} />
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
              count: orders.filter((o) => o.financialStatus === "REFUNDED")
                .length,
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
            {/* Header */}
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
              /* Order Detail */
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
                <OrderDetail order={mobileSelectedOrder} />
              </div>
            ) : (
              <>
                {/* Tabs */}
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

                {/* Orders list */}
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
