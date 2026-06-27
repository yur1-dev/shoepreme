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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterVal>("ALL");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

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
      data.success
        ? showToast("Order cancelled")
        : showToast("Cancel failed: " + data.error, false);
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
              const canFulfill =
                order.displayFulfillmentStatus === "UNFULFILLED" ||
                order.displayFulfillmentStatus === "PARTIALLY_FULFILLED";
              const canCancel =
                order.displayFinancialStatus !== "VOIDED" &&
                order.displayFinancialStatus !== "REFUNDED";
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
                      {canFulfill && (
                        <ActionButton
                          onClick={(e: any) => handleFulfill(e, order.id)}
                          disabled={isBusy}
                          variant="green"
                          small
                        >
                          {isBusy ? "…" : "Fulfill"}
                        </ActionButton>
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
                                {item.variant?.image?.url && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.variant.image.url}
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
    </div>
  );
}
