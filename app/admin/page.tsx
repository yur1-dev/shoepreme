"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useToast,
  Toast,
  StatCard,
  FilterTabs,
  SearchInput,
  StatusPill,
  Spinner,
  EmptyState,
  ActionButton,
  FieldLabel,
} from "@/lib/admin-ui";

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(parseFloat(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAddress(addr: any) {
  if (!addr) return null;
  return [
    addr.address1,
    addr.address2,
    [addr.city, addr.provinceCode || addr.province, addr.zip]
      .filter(Boolean)
      .join(", "),
    addr.country,
  ].filter(Boolean);
}

type FilterVal = "ALL" | "UNFULFILLED" | "PENDING" | "FULFILLED" | "PAID";

type PaymentMethod =
  | "Pay In-Store (Cash)"
  | "Cash on Delivery (COD)"
  | "GCash"
  | "Other";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterVal>("ALL");
  const [search, setSearch] = useState("");
  const [markPaidOrder, setMarkPaidOrder] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    "Pay In-Store (Cash)",
  );
  const { toast, showToast } = useToast();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [localInProgress, setLocalInProgress] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("shoepreme_inprogress");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Sync to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("shoepreme_inprogress", JSON.stringify([...localInProgress]));
    } catch {}
  }, [localInProgress]);

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

  async function handleFulfill(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/fulfill-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      data.success
        ? showToast("Order fulfilled ✓")
        : showToast("Fulfill failed: " + data.error, false);
      if (data.success) {
        await handleClearProgress(orderId);
        await fetchOrders();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkAsPaid(orderId: string, method: PaymentMethod) {
    setMarkPaidOrder(null);
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentMethod: method }),
      });
      const data = await res.json();
      data.success
        ? showToast("Order marked as paid ✓")
        : showToast("Failed: " + data.error, false);
      if (data.success) await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Order cancelled");
        await fetchOrders();
      } else if (data.error?.toLowerCase().includes("already been canceled")) {
        showToast("Already cancelled — refreshing");
        await fetchOrders();
      } else {
        showToast("Cancel failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }
  async function handleSetStatus(
    e: React.MouseEvent,
    orderId: string,
    status: "IN_PROGRESS" | "ON_HOLD" | "RELEASE_HOLD",
  ) {
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/set-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      data.success
        ? showToast(`Order updated ✓`)
        : showToast("Failed: " + data.error, false);
      if (data.success) {
        await handleClearProgress(orderId);
        await fetchOrders();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnfulfill(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/unfulfill-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      data.success
        ? showToast("Order marked unfulfilled ✓")
        : showToast("Failed: " + data.error, false);
      if (data.success) await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReleaseHold(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/release-hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Hold released ✓");
        setLocalInProgress((prev) => {
          const next = new Set(prev);
          next.add(orderId);
          return next;
        });
        await fetchOrders();
      } else {
        showToast("Release failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStartProgress(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/start-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Order marked in progress ✓");
        const order = orders.find((o) => o.id === orderId);
        if (order) handlePrintPackingSlip(order);
        await fetchOrders();
      } else {
        showToast("Failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleClearProgress(orderId: string) {
    try {
      await fetch("/api/admin/clear-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
    } catch {}
  }

  async function handleAddTracking() {
    if (!trackingOrder) return;
    setActionLoading(trackingOrder.id);
    try {
      const res = await fetch("/api/admin/add-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: trackingOrder.id,
          carrier: trackingCarrier,
          number: trackingNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Tracking added ✓");
        setTrackingOrder(null);
        setTrackingCarrier("");
        setTrackingNumber("");
        await fetchOrders();
      } else {
        showToast("Failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkDelivered(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      const res = await fetch("/api/admin/mark-delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      data.success
        ? showToast("Order marked delivered ✓")
        : showToast("Failed: " + data.error, false);
      if (data.success) await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  }

  const unfulfilled = orders.filter(
    (o) =>
      o.displayFulfillmentStatus === "UNFULFILLED" ||
      o.displayFulfillmentStatus === "PARTIALLY_FULFILLED",
  );
  function handlePrintPackingSlip(order: any) {
    const addressLines = formatAddress(order.shippingAddress) || [];
    const items = order.lineItems?.edges?.map((e: any) => e.node) ?? [];
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;

    const rows = items
      .map(
        (item: any) => `
          <tr>
            <td style="padding:8px 0;">${item.title}</td>
            <td style="padding:8px 0;text-align:center;">${item.quantity}</td>
          </tr>`,
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>Packing Slip - ${order.name}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 40px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .muted { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { text-align: left; border-bottom: 1px solid #ccc; padding: 8px 0; font-size: 12px; text-transform: uppercase; }
            td { border-bottom: 1px solid #eee; font-size: 13px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Shoepreme</h1>
          <div class="muted">Your Store Address, City, Province, ZIP</div>
          <div class="muted">your@email.com · yourstore.com</div>
          <hr style="margin:20px 0;" />
          <p><strong>Order:</strong> ${order.name}<br/>
          <strong>Date:</strong> ${formatDate(order.createdAt)}</p>
          <p><strong>Ship To:</strong><br/>
          ${order.customer?.displayName ?? "Guest"}<br/>
          ${addressLines.join("<br/>")}</p>
          <table>
            <thead><tr><th>Item</th><th style="text-align:center;">Qty</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">Thank you for shopping with us!</div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }
  const pending = orders.filter((o) => o.displayFinancialStatus === "PENDING");
  const totalValue = orders.reduce(
    (s, o) => s + parseFloat(o.totalPriceSet.shopMoney.amount),
    0,
  );

  const filtered = useMemo(() => {
    let list = orders;
    if (filter === "UNFULFILLED")
      list = list.filter(
        (o) =>
          o.displayFulfillmentStatus === "UNFULFILLED" ||
          o.displayFulfillmentStatus === "PARTIALLY_FULFILLED",
      );
    if (filter === "PENDING")
      list = list.filter((o) => o.displayFinancialStatus === "PENDING");
    if (filter === "FULFILLED")
      list = list.filter((o) => o.displayFulfillmentStatus === "FULFILLED");
    if (filter === "PAID")
      list = list.filter((o) => o.displayFinancialStatus === "PAID");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name?.toLowerCase().includes(q) ||
          o.customer?.displayName?.toLowerCase().includes(q) ||
          o.customer?.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, filter, search]);

  return (
    <div style={{ padding: "32px 36px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(240,244,248,0.28)",
                margin: "0 0 4px",
              }}
            >
              Shoepreme
            </p>
            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "2.4rem",
                letterSpacing: "0.04em",
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              Orders
            </h1>
          </div>
          <ActionButton onClick={fetchOrders} variant="ghost">
            ↻ Refresh
          </ActionButton>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Total Orders"
            value={String(orders.length)}
            sub="all time"
          />
          <StatCard
            label="Unfulfilled"
            value={String(unfulfilled.length)}
            color="#e8a830"
            sub={unfulfilled.length > 0 ? "needs action" : "all clear"}
          />
          <StatCard
            label="Pending Payment"
            value={String(pending.length)}
            color={pending.length > 0 ? "#f87171" : "#e8a830"}
            sub={pending.length > 0 ? "awaiting payment" : "none"}
          />
          <StatCard
            label="Total Value"
            value={`₱${totalValue.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`}
            color="#4ade80"
            sub="combined orders"
          />
        </div>

        {/* Filters + Search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <FilterTabs
            tabs={[
              { label: "All", value: "ALL", count: orders.length },
              {
                label: "Unfulfilled",
                value: "UNFULFILLED",
                count: unfulfilled.length,
              },
              { label: "Pending", value: "PENDING", count: pending.length },
              {
                label: "Fulfilled",
                value: "FULFILLED",
                count: orders.filter(
                  (o) => o.displayFulfillmentStatus === "FULFILLED",
                ).length,
              },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as FilterVal)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search order, customer…"
          />
        </div>

        {/* Table */}
        <div
          style={{
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "22px 100px 1fr 140px 110px 140px 110px 200px",
              padding: "12px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "monospace",
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(240,244,248,0.28)",
            }}
          >
            <span />
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Payment</span>
            <span>Fulfillment</span>
            <span style={{ textAlign: "right" }}>Total</span>
            <span />
          </div>

          {loading && <Spinner />}

          {!loading && filtered.length === 0 && (
            <EmptyState
              label={
                search ? `No orders matching "${search}"` : "No orders found"
              }
            />
          )}

          {!loading &&
            filtered.map((order) => {
              const isBusy = actionLoading === order.id;
              const isExpanded = expandedId === order.id;
              const isVoided =
                !!order.cancelledAt ||
                order.displayFinancialStatus === "VOIDED" ||
                order.displayFinancialStatus === "REFUNDED" ||
                order.displayFinancialStatus === "CANCELLED" ||
                order.displayFulfillmentStatus === "CANCELLED" ||
                order.displayFulfillmentStatus === "RESTOCKED";
              const canMarkPaid = order.displayFinancialStatus === "PENDING";
              const isFulfilled =
                order.displayFulfillmentStatus === "FULFILLED";
              const canFulfill =
                !isVoided &&
                order.displayFinancialStatus === "PAID" &&
                (order.displayFulfillmentStatus === "UNFULFILLED" ||
                  order.displayFulfillmentStatus === "PARTIALLY_FULFILLED" ||
                  order.displayFulfillmentStatus === "ON_HOLD");
              const canChangeStatus =
                !isVoided && order.displayFinancialStatus === "PAID";
              const canCancel =
                !isVoided &&
                !isFulfilled &&
                order.displayFinancialStatus !== "PAID";
              const onHold = order.displayFulfillmentStatus === "ON_HOLD";
              const inProgress = order.displayFulfillmentStatus === "IN_PROGRESS" || (order.tags ?? []).includes("in-progress");
              const isDelivered = (order.tags ?? []).includes("delivered");
              const addressLines = formatAddress(order.shippingAddress);
              const items =
                order.lineItems?.edges?.map((e: any) => e.node) ?? [];
              const tracking =
                order.fulfillments?.flatMap((f: any) => f.trackingInfo ?? []) ??
                [];

              return (
                <div key={order.id}>
                  {/* Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    onMouseEnter={(e) => {
                      if (!isExpanded)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.022)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded)
                        e.currentTarget.style.background = "transparent";
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "22px 100px 1fr 140px 110px 140px 110px 200px",
                      padding: "14px 22px",
                      borderBottom: isExpanded
                        ? "none"
                        : "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                      cursor: "pointer",
                      background: isExpanded
                        ? "rgba(255,255,255,0.022)"
                        : "transparent",
                      transition: "background 0.12s",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(240,244,248,0.3)",
                        fontSize: 9,
                        display: "inline-block",
                        transform: isExpanded ? "rotate(90deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    >
                      ▸
                    </span>

                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
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
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#f0f4f8",
                          margin: "0 0 2px",
                        }}
                      >
                        {order.customer?.displayName ?? "Guest"}
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: 9,
                          color: "rgba(240,244,248,0.32)",
                          margin: 0,
                        }}
                      >
                        {order.customer?.email ?? "—"}
                      </p>
                    </div>

                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: "rgba(240,244,248,0.45)",
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </span>

                    <StatusPill label={order.displayFinancialStatus} />
                    <StatusPill label={order.displayFulfillmentStatus} />

                    <span
                      style={{
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: "1.1rem",
                        color: "#f0f4f8",
                        textAlign: "right",
                      }}
                    >
                      {formatPrice(
                        order.totalPriceSet.shopMoney.amount,
                        order.totalPriceSet.shopMoney.currencyCode,
                      )}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canMarkPaid && (
                        <ActionButton
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setPaymentMethod("Pay In-Store (Cash)");
                            setMarkPaidOrder(order);
                          }}
                          disabled={isBusy}
                          variant="green"
                          small
                        >
                          {isBusy ? "…" : "Mark Paid"}
                        </ActionButton>
                      )}

           {!isVoided && order.displayFinancialStatus === "PAID" && (
                        <>
                          {isFulfilled ? (
                            isDelivered ? null : (
                              <>
                                <ActionButton
                                  onClick={(e: any) => { e.stopPropagation(); setTrackingOrder(order); }}
                                  disabled={isBusy}
                                  variant="ghost"
                                  small
                                >
                                  + Tracking
                                </ActionButton>
                                <ActionButton
                                  onClick={(e: any) => handleMarkDelivered(e, order.id)}
                                  disabled={isBusy}
                                  variant="green"
                                  small
                                >
                                  {isBusy ? "…" : "Delivered"}
                                </ActionButton>
                              </>
                            )
                          ) : onHold ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReleaseHold(e, order.id); }}
                                disabled={isBusy}
                                style={{ padding: "5px 10px", borderRadius: 7, background: "rgba(232,168,48,0.08)", border: "1px solid rgba(232,168,48,0.3)", color: "#e8a830", fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", cursor: isBusy ? "not-allowed" : "pointer" }}
                              >
                                {isBusy ? "…" : "Release"}
                              </button>
                              <div style={{ position: "relative", display: "flex" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === order.id ? null : order.id); }}
                                  disabled={isBusy}
                                  style={{ padding: "5px 9px", borderRadius: 7, background: "rgba(232,168,48,0.08)", border: "1px solid rgba(232,168,48,0.3)", color: "#e8a830", fontSize: 9, cursor: isBusy ? "not-allowed" : "pointer" }}
                                >
                                  ▾
                                </button>
                                {openDropdown === order.id && (
                                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#0f131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", zIndex: 100, minWidth: 150, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                                    {[
                                      { label: "Fulfill", action: "fulfill" as const, color: "#4ade80" },
                                    ].map((opt, i, arr) => (
                                      <button key={opt.label}
                                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); if (opt.action === "fulfill") handleFulfill(e, order.id); }}
                                        style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: opt.color, fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", textAlign: "left" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                      >{opt.label}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          ) : inProgress ? (
                            <>
                              <ActionButton
                                onClick={(e: any) => { e.stopPropagation(); handleSetStatus(e, order.id, "ON_HOLD"); }}
                                disabled={isBusy}
                                variant="red"
                                small
                              >
                                {isBusy ? "…" : "On Hold"}
                              </ActionButton>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFulfill(e, order.id); }}
                                disabled={isBusy}
                                style={{ padding: "5px 10px", borderRadius: "7px 0 0 7px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRight: "none", color: "#4ade80", fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", cursor: isBusy ? "not-allowed" : "pointer" }}
                              >
                                {isBusy ? "…" : "Fulfill"}
                              </button>
                              <div style={{ position: "relative", display: "flex" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === order.id ? null : order.id); }}
                                  disabled={isBusy}
                                  style={{ padding: "5px 9px", borderRadius: "0 7px 7px 0", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: 9, cursor: isBusy ? "not-allowed" : "pointer" }}
                                >
                                  ▾
                                </button>
                                {openDropdown === order.id && (
                                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#0f131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", zIndex: 100, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                                    {[
                                      { label: "On Hold", action: "on_hold" as const, color: "#f87171" },
                                      { label: "Print Packing Slip", action: "print_slip" as const, color: "#e8a830" },
                                    ].map((opt, i, arr) => (
                                      <button key={opt.label}
                                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); if (opt.action === "on_hold") handleSetStatus(e, order.id, "ON_HOLD"); else if (opt.action === "print_slip") handlePrintPackingSlip(order); }}
                                        style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", color: opt.color, fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", textAlign: "left" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                      >{opt.label}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStartProgress(e, order.id); }}
                                disabled={isBusy}
                                style={{ padding: "5px 10px", borderRadius: "7px 0 0 7px", background: "rgba(232,168,48,0.08)", border: "1px solid rgba(232,168,48,0.3)", borderRight: "none", color: "#e8a830", fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", cursor: isBusy ? "not-allowed" : "pointer" }}
                              >
                                {isBusy ? "…" : "In Progress"}
                              </button>
                              <div style={{ position: "relative", display: "flex" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === order.id ? null : order.id); }}
                                  disabled={isBusy}
                                  style={{ padding: "5px 9px", borderRadius: "0 7px 7px 0", background: "rgba(232,168,48,0.08)", border: "1px solid rgba(232,168,48,0.3)", color: "#e8a830", fontSize: 9, cursor: isBusy ? "not-allowed" : "pointer" }}
                                >
                                  ▾
                                </button>
                                {openDropdown === order.id && (
                                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#0f131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", zIndex: 100, minWidth: 150, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                                    {[
                                      { label: "On Hold", action: "on_hold" as const, color: "#f87171" },
                                      { label: "Fulfill", action: "fulfill" as const, color: "#4ade80" },
                                    ].map((opt, i, arr) => (
                                      <button key={opt.label}
                                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); if (opt.action === "on_hold") handleSetStatus(e, order.id, "ON_HOLD"); else if (opt.action === "fulfill") handleFulfill(e, order.id); }}
                                        style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", color: opt.color, fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", textAlign: "left" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                      >{opt.label}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {canCancel && (
                        <ActionButton
                          onClick={(e: any) => handleCancel(e, order.id)}
                          disabled={isBusy}
                          variant="red"
                          small
                        >
                          {isBusy ? "…" : "Cancel"}
                        </ActionButton>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 28,
                        padding: "22px 22px 26px 60px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: "rgba(255,255,255,0.016)",
                      }}
                    >
                      {/* Left: address + payment + tracking */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 20,
                        }}
                      >
                        <div>
                          <FieldLabel>Shipping Address</FieldLabel>
                          {addressLines ? (
                            <div
                              style={{
                                fontFamily: "Poppins, sans-serif",
                                fontSize: 12,
                                color: "rgba(240,244,248,0.65)",
                                lineHeight: 1.7,
                              }}
                            >
                              {addressLines.map((l: string, i: number) => (
                                <div key={i}>{l}</div>
                              ))}
                              {order.shippingAddress?.phone && (
                                <div
                                  style={{
                                    marginTop: 6,
                                    fontFamily: "monospace",
                                    fontSize: 10,
                                    color: "rgba(240,244,248,0.38)",
                                  }}
                                >
                                  {order.shippingAddress.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p
                              style={{
                                fontSize: 11,
                                color: "rgba(240,244,248,0.28)",
                                fontFamily: "monospace",
                              }}
                            >
                              No address on file
                            </p>
                          )}
                        </div>

                        <div>
                          <FieldLabel>Payment Method</FieldLabel>
                          <p
                            style={{
                              fontFamily: "Poppins, sans-serif",
                              fontSize: 12,
                              color: "rgba(240,244,248,0.65)",
                              margin: 0,
                            }}
                          >
                            {order.paymentGatewayNames?.join(", ") || "—"}
                          </p>
                        </div>

                        {tracking.length > 0 && (
                          <div>
                            <FieldLabel>Tracking</FieldLabel>
                            {tracking.map((t: any, i: number) => (
                              <a
                                key={i}
                                href={t.url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "block",
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                  color: "#4a7fa5",
                                  marginBottom: 3,
                                }}
                              >
                                {t.number}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: items */}
                      <div>
                        <FieldLabel>Items ({items.length})</FieldLabel>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {items.map((item: any, i: number) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "rgba(255,255,255,0.025)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 10,
                                padding: "10px 12px",
                              }}
                            >
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  overflow: "hidden",
                                  flexShrink: 0,
                                }}
                              >
                                {(item.variant?.image?.url || item.variant?.product?.featuredImage?.url) && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.variant?.image?.url || item.variant?.product?.featuredImage?.url}
                                    alt={item.title}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p
                                  style={{
                                    fontFamily: "Poppins, sans-serif",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#f0f4f8",
                                    margin: "0 0 2px",
                                  }}
                                >
                                  {item.title}
                                </p>
                                <p
                                  style={{
                                    fontFamily: "monospace",
                                    fontSize: 9,
                                    color: "rgba(240,244,248,0.38)",
                                    margin: 0,
                                  }}
                                >
                                  Qty {item.quantity} ·{" "}
                                  {formatPrice(
                                    item.originalUnitPriceSet.shopMoney.amount,
                                    item.originalUnitPriceSet.shopMoney
                                      .currencyCode,
                                  )}
                                </p>
                              </div>
                              <span
                                style={{
                                  fontFamily: "Bebas Neue, sans-serif",
                                  fontSize: "1rem",
                                  color: "#f0f4f8",
                                }}
                              >
                                {formatPrice(
                                  String(
                                    parseFloat(
                                      item.originalUnitPriceSet.shopMoney
                                        .amount,
                                    ) * item.quantity,
                                  ),
                                  item.originalUnitPriceSet.shopMoney
                                    .currencyCode,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      <Toast toast={toast} />

      {/* ── Mark as Paid Modal ── */}
      {markPaidOrder && (
        <>
          <div
            onClick={() => setMarkPaidOrder(null)}
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
              width: "min(420px, calc(100vw - 48px))",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "28px",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(74,222,128,0.08)",
                    border: "1px solid rgba(74,222,128,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4ade80"
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
                      color: "rgba(240,244,248,0.3)",
                      margin: "0 0 3px",
                    }}
                  >
                    Confirm Payment
                  </p>
                  <h3
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.5rem",
                      letterSpacing: "0.05em",
                      color: "#f0f4f8",
                      margin: 0,
                    }}
                  >
                    {markPaidOrder.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setMarkPaidOrder(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(240,244,248,0.4)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Amount */}
            <div
              style={{
                background: "rgba(74,222,128,0.04)",
                border: "1px solid rgba(74,222,128,0.12)",
                borderRadius: "12px",
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,248,0.35)",
                }}
              >
                Amount Due
              </span>
              <span
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.06em",
                  color: "#4ade80",
                }}
              >
                {formatPrice(
                  markPaidOrder.totalPriceSet.shopMoney.amount,
                  markPaidOrder.totalPriceSet.shopMoney.currencyCode,
                )}
              </span>
            </div>

            {/* Payment method */}
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,248,0.3)",
                  margin: "0 0 10px",
                }}
              >
                Payment Method
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {(
                  [
                    "Pay In-Store (Cash)",
                    "GCash",
                    "Cash on Delivery (COD)",
                    "Other",
                  ] as PaymentMethod[]
                ).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 14px",
                      background:
                        paymentMethod === m
                          ? "rgba(74,222,128,0.06)"
                          : "rgba(255,255,255,0.02)",
                      border: `1px solid ${paymentMethod === m ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.12s",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: `2px solid ${paymentMethod === m ? "#4ade80" : "rgba(255,255,255,0.15)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "border-color 0.12s",
                      }}
                    >
                      {paymentMethod === m && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#4ade80",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color:
                          paymentMethod === m
                            ? "#4ade80"
                            : "rgba(240,244,248,0.5)",
                      }}
                    >
                      {m}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setMarkPaidOrder(null)}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "rgba(240,244,248,0.4)",
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
                onClick={() =>
                  handleMarkAsPaid(markPaidOrder.id, paymentMethod)
                }
                style={{
                  flex: 2,
                  padding: "13px",
                  background: "#4ade80",
                  border: "none",
                  borderRadius: "10px",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add Tracking Modal ── */}
      {trackingOrder && (
        <>
          <div
            onClick={() => setTrackingOrder(null)}
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
              width: "min(420px, calc(100vw - 48px))",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "28px",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,248,0.3)",
                  margin: "0 0 3px",
                }}
              >
                Add Tracking
              </p>
              <h3
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.5rem",
                  letterSpacing: "0.05em",
                  color: "#f0f4f8",
                  margin: 0,
                }}
              >
                {trackingOrder.name}
              </h3>
            </div>
            <div>
              <FieldLabel>Shipping Carrier</FieldLabel>
              <input
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                placeholder="e.g. J&T Express, LBC, Ninja Van"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "#f5f7f9",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <FieldLabel>Tracking Number</FieldLabel>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "#f5f7f9",
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setTrackingOrder(null)}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "rgba(240,244,248,0.4)",
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
                onClick={handleAddTracking}
                disabled={!trackingCarrier.trim() || !trackingNumber.trim()}
                style={{
                  flex: 2,
                  padding: "13px",
                  background: "#e8a830",
                  border: "none",
                  borderRadius: "10px",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor:
                    !trackingCarrier.trim() || !trackingNumber.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !trackingCarrier.trim() || !trackingNumber.trim() ? 0.6 : 1,
                }}
              >
                Save Tracking
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
