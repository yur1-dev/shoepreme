"use client";

import { useState, useEffect, useCallback } from "react";

const STATUS_COLORS: Record<string, string> = {
  PAID: "#4ade80",
  PENDING: "#e8a830",
  REFUNDED: "#f87171",
  VOIDED: "#f87171",
  EXPIRED: "#f87171",
  FULFILLED: "#4a7fa5",
  UNFULFILLED: "rgba(245,247,249,0.4)",
  PARTIALLY_FULFILLED: "#e8a830",
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleFulfill(orderId: string) {
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/fulfill-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Failed to fulfill: " + data.error);
      } else {
        await fetchOrders();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(orderId: string) {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Failed to cancel: " + data.error);
      } else {
        await fetchOrders();
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "2.2rem",
              letterSpacing: "0.04em",
              color: "#f5f7f9",
              margin: 0,
            }}
          >
            Orders
          </h1>
          <button
            onClick={fetchOrders}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "rgba(245,247,249,0.6)",
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 130px 110px 130px 110px 220px",
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.3)",
            }}
          >
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Payment</span>
            <span>Fulfillment</span>
            <span>Total</span>
            <span>Actions</span>
          </div>

          {loading && (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "rgba(245,247,249,0.3)",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              Loading orders...
            </div>
          )}

          {!loading &&
            orders.map((order: any) => {
              const isBusy = actionLoading === order.id;
              const canFulfill =
                order.displayFulfillmentStatus === "UNFULFILLED" ||
                order.displayFulfillmentStatus === "PARTIALLY_FULFILLED";
              const canCancel =
                order.displayFinancialStatus !== "VOIDED" &&
                order.displayFinancialStatus !== "REFUNDED";

              return (
                <div
                  key={order.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "100px 1fr 130px 110px 130px 110px 220px",
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#e8a830",
                    }}
                  >
                    {order.name}
                  </span>

                  <div>
                    <p
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#f5f7f9",
                        margin: "0 0 2px",
                      }}
                    >
                      {order.customer?.displayName ?? "Guest"}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "9px",
                        color: "rgba(245,247,249,0.35)",
                        margin: 0,
                      }}
                    >
                      {order.customer?.email ?? "—"}
                    </p>
                  </div>

                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.5)",
                    }}
                  >
                    {formatDate(order.createdAt)}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: statusColor(order.displayFinancialStatus),
                      width: "fit-content",
                    }}
                  >
                    <span
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: statusColor(order.displayFinancialStatus),
                      }}
                    />
                    {order.displayFinancialStatus}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: statusColor(order.displayFulfillmentStatus),
                      width: "fit-content",
                    }}
                  >
                    <span
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: statusColor(order.displayFulfillmentStatus),
                      }}
                    />
                    {order.displayFulfillmentStatus}
                  </span>

                  <span
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.1rem",
                      color: "#f5f7f9",
                    }}
                  >
                    {formatPrice(
                      order.totalPriceSet.shopMoney.amount,
                      order.totalPriceSet.shopMoney.currencyCode,
                    )}
                  </span>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {canFulfill && (
                      <button
                        onClick={() => handleFulfill(order.id)}
                        disabled={isBusy}
                        style={{
                          background: "rgba(74,222,128,0.1)",
                          border: "1px solid rgba(74,222,128,0.3)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          color: "#4ade80",
                          fontFamily: "monospace",
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: isBusy ? "not-allowed" : "pointer",
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {isBusy ? "..." : "Fulfill"}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={isBusy}
                        style={{
                          background: "rgba(248,113,113,0.1)",
                          border: "1px solid rgba(248,113,113,0.3)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          color: "#f87171",
                          fontFamily: "monospace",
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: isBusy ? "not-allowed" : "pointer",
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        {isBusy ? "..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
