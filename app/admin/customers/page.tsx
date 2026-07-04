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
import { useLayoutMode as useLayoutModeRaw } from "@/lib/use-layout-mode";

function useLayoutMode() {
  const layout = useLayoutModeRaw();
  return {
    ...layout,
    mode: layout.isMobile ? "mobile" : layout.isTablet ? "tablet" : "desktop",
  };
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type FilterVal = "ALL" | "ACTIVE" | "DISABLED";

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  numberOfOrders: number;
  amountSpent: { amount: string; currencyCode: string };
  createdAt: string;
  state: string;
  tags: string[];
  disabled: boolean;
  displayName?: string;
  appeal?: {
    message: string;
    submittedAt: string;
    status: "pending" | "resolved";
  };
  disableReason?: string;
}

interface CustomerOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
}

function CustomerDetailDrawer({
  customer,
  onClose,
  onToggleDisabled,
  onAppealResolved,
}: {
  customer: Customer;
  onClose: () => void;
  onToggleDisabled: (id: string, disabled: boolean, reason?: string) => void;
  onAppealResolved: (id: string) => void;
}) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showDisableReason, setShowDisableReason] = useState(false);
  const [disableReasonInput, setDisableReasonInput] = useState("");
  const { mode } = useLayoutMode();
  const isMobile = mode === "mobile";
  const name =
    customer.displayName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Guest";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/customers/${encodeURIComponent(customer.id)}/orders`,
        );
        const data = await res.json();
        if (!cancelled) setOrders(data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  async function handleToggle() {
    if (!customer.disabled) {
      // about to disable — ask for a reason first
      setDisableReasonInput("");
      setShowDisableReason(true);
      return;
    }
    setToggling(true);
    try {
      await onToggleDisabled(customer.id, !customer.disabled);
    } finally {
      setToggling(false);
    }
  }

  async function handleConfirmDisable() {
    if (!disableReasonInput.trim()) return;
    setToggling(true);
    try {
      await onToggleDisabled(customer.id, true, disableReasonInput.trim());
      setShowDisableReason(false);
    } finally {
      setToggling(false);
    }
  }

  async function handleResolveAppeal(action: "enable" | "dismiss") {
    setResolving(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${encodeURIComponent(customer.id)}/resolve-appeal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      const data = await res.json();
      if (data.success) {
        if (action === "enable") {
          await onToggleDisabled(customer.id, false);
        }
        onAppealResolved(customer.id);
        setShowAppeal(false);
      }
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          background: "#0f131c",
          borderLeft: "1px solid rgba(255,255,255,0.09)",
          width: "min(480px, 100vw)",
          height: "100%",
          overflowY: "auto",
          boxShadow: "-40px 0 100px rgba(0,0,0,0.85)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 28px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            top: 0,
            background: "#0f131c",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,248,0.25)",
                  margin: "0 0 3px",
                }}
              >
                Customer
              </p>
              <h2
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.5rem",
                  letterSpacing: "0.04em",
                  color: "#f0f4f8",
                  margin: 0,
                }}
              >
                {name}
              </h2>
            </div>

            {/* Pending appeal — clickable icon button */}
            {customer.appeal?.status === "pending" && (
              <button
                onClick={() => setShowAppeal(true)}
                title="Pending appeal — click to view"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(232,168,48,0.1)",
                  border: "1px solid rgba(232,168,48,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e8a830"
                  strokeWidth="2"
                >
                  <path
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.73 21a2 2 0 0 1-3.46 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#e8a830",
                    border: "2px solid #0f131c",
                  }}
                />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(240,244,248,0.5)",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Status badge */}
          {customer.disabled && (
            <div
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f87171",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#f87171",
                  }}
                >
                  Account Disabled
                </span>
              </div>
              {customer.disableReason && (
                <p
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 11,
                    color: "rgba(248,113,113,0.75)",
                    margin: "0 0 0 14px",
                    lineHeight: 1.5,
                  }}
                >
                  {customer.disableReason}
                </p>
              )}
            </div>
          )}

          {/* Contact info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <FieldLabel>Email</FieldLabel>
              <p
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12,
                  color: "rgba(240,244,248,0.7)",
                  margin: 0,
                  wordBreak: "break-all",
                }}
              >
                {customer.email}
              </p>
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "rgba(240,244,248,0.6)",
                  margin: 0,
                }}
              >
                {customer.phone || "—"}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <FieldLabel>Joined</FieldLabel>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "rgba(240,244,248,0.6)",
                  margin: 0,
                }}
              >
                {formatDate(customer.createdAt)}
              </p>
            </div>
            <div>
              <FieldLabel>Total Spent</FieldLabel>
              <p
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.2rem",
                  color: "#e8a830",
                  margin: 0,
                }}
              >
                {formatPrice(
                  customer.amountSpent.amount,
                  customer.amountSpent.currencyCode,
                )}
              </p>
            </div>
          </div>

          {/* Disable toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255,255,255,0.024)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,248,0.28)",
                  margin: "0 0 4px",
                }}
              >
                Account Access
              </p>
              <p
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12,
                  color: customer.disabled ? "#f87171" : "#4ade80",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {customer.disabled ? "Disabled — cannot sign in" : "Active"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                background: customer.disabled
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(248,113,113,0.1)",
                border: customer.disabled
                  ? "1px solid rgba(74,222,128,0.28)"
                  : "1px solid rgba(248,113,113,0.28)",
                color: customer.disabled ? "#4ade80" : "#f87171",
                fontFamily: "monospace",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: toggling ? "not-allowed" : "pointer",
                opacity: toggling ? 0.6 : 1,
              }}
            >
              {toggling
                ? "…"
                : customer.disabled
                  ? "Enable Account"
                  : "Disable Account"}
            </button>
          </div>

          {/* Orders */}
          <div>
            <FieldLabel>Order History ({orders.length})</FieldLabel>
            {loading && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "rgba(240,244,248,0.3)",
                }}
              >
                Loading orders…
              </p>
            )}
            {!loading && orders.length === 0 && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "rgba(240,244,248,0.25)",
                }}
              >
                No orders yet.
              </p>
            )}
            {!loading && orders.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#e8a830",
                          margin: "0 0 3px",
                        }}
                      >
                        {order.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: 9,
                          color: "rgba(240,244,248,0.32)",
                          margin: 0,
                        }}
                      >
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <StatusPill label={order.displayFinancialStatus} />
                      <span
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "1rem",
                          color: "#f0f4f8",
                        }}
                      >
                        {formatPrice(
                          order.totalPriceSet.shopMoney.amount,
                          order.totalPriceSet.shopMoney.currencyCode,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appeal detail modal */}
      {showAppeal && customer.appeal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAppeal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 28,
              width: "min(420px, 100%)",
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(232,168,48,0.6)",
                margin: "0 0 6px",
              }}
            >
              Appeal Submitted
            </p>
            <h3
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                color: "#f5f7f9",
                margin: "0 0 4px",
              }}
            >
              {formatDate(customer.appeal.submittedAt)}
            </h3>
            <p
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                color: "rgba(240,244,248,0.7)",
                lineHeight: 1.7,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "14px 16px",
                margin: "16px 0 24px",
              }}
            >
              {customer.appeal.message}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleResolveAppeal("dismiss")}
                disabled={resolving}
                style={{
                  flex: 1,
                  padding: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "rgba(245,247,249,0.4)",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: resolving ? "not-allowed" : "pointer",
                  opacity: resolving ? 0.6 : 1,
                }}
              >
                Dismiss
              </button>
              <button
                onClick={() => handleResolveAppeal("enable")}
                disabled={resolving}
                style={{
                  flex: 2,
                  padding: 12,
                  background: "#4ade80",
                  border: "none",
                  borderRadius: 8,
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: resolving ? "not-allowed" : "pointer",
                  opacity: resolving ? 0.6 : 1,
                }}
              >
                {resolving ? "…" : "Enable Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable reason modal */}
      {showDisableReason && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDisableReason(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 28,
              width: "min(420px, 100%)",
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(248,113,113,0.6)",
                margin: "0 0 6px",
              }}
            >
              Disable Account
            </p>
            <h3
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                color: "#f5f7f9",
                margin: "0 0 14px",
              }}
            >
              Why is this account being disabled?
            </h3>
            <textarea
              value={disableReasonInput}
              onChange={(e) => setDisableReasonInput(e.target.value)}
              placeholder="e.g. Suspicious order activity, repeated chargebacks…"
              rows={4}
              style={{
                width: "100%",
                resize: "vertical",
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                color: "#f0f4f8",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "12px 14px",
                outline: "none",
                boxSizing: "border-box",
                margin: "0 0 20px",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowDisableReason(false)}
                disabled={toggling}
                style={{
                  flex: 1,
                  padding: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "rgba(245,247,249,0.4)",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: toggling ? "not-allowed" : "pointer",
                  opacity: toggling ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisable}
                disabled={toggling || !disableReasonInput.trim()}
                style={{
                  flex: 2,
                  padding: 12,
                  background: "#f87171",
                  border: "none",
                  borderRadius: 8,
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor:
                    toggling || !disableReasonInput.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity: toggling || !disableReasonInput.trim() ? 0.6 : 1,
                }}
              >
                {toggling ? "…" : "Confirm Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomersPage() {
  const { mode } = useLayoutMode();
  const isMobile = mode === "mobile";
  const isTablet = mode === "tablet";
  const gridColsDesktop = "1fr 130px 110px 110px 100px";
  const gridColsMobile = "1fr 90px";
  const gridCols = isMobile ? gridColsMobile : gridColsDesktop;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterVal>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const { toast, showToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/customers", { cache: "no-store" });
    const data = await res.json();
    setCustomers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleToggleDisabled(
    id: string,
    disabled: boolean,
    reason?: string,
  ) {
    const res = await fetch(
      `/api/admin/customers/${encodeURIComponent(id)}/toggle-disabled`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled, reason }),
      },
    );
    const data = await res.json();
    if (data.success) {
      showToast(disabled ? "Account disabled" : "Account enabled");
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, disabled, disableReason: disabled ? reason : undefined }
            : c,
        ),
      );
      setSelected((prev) =>
        prev
          ? { ...prev, disabled, disableReason: disabled ? reason : undefined }
          : prev,
      );
    } else {
      showToast("Failed: " + data.error, false);
    }
  }

  function handleAppealResolved(id: string) {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id && c.appeal
          ? { ...c, appeal: { ...c.appeal, status: "resolved" } }
          : c,
      ),
    );
    setSelected((prev) =>
      prev && prev.appeal
        ? { ...prev, appeal: { ...prev.appeal, status: "resolved" } }
        : prev,
    );
  }

  const disabledCount = customers.filter((c) => c.disabled).length;

  const filtered = useMemo(() => {
    let list = customers;
    if (filter === "ACTIVE") list = list.filter((c) => !c.disabled);
    if (filter === "DISABLED") list = list.filter((c) => c.disabled);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.email?.toLowerCase().includes(q) ||
          c.firstName?.toLowerCase().includes(q) ||
          c.lastName?.toLowerCase().includes(q) ||
          c.displayName?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [customers, filter, search]);

  return (
    <div style={{ padding: isMobile ? "20px 16px 40px" : "32px 36px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 12 : 0,
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
                fontSize: isMobile ? "1.9rem" : "2.4rem",
                letterSpacing: "0.04em",
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              Customers
            </h1>
          </div>
          <ActionButton onClick={fetchCustomers} variant="ghost">
            ↻ Refresh
          </ActionButton>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Total Customers"
            value={String(customers.length)}
            sub="registered"
          />
          <StatCard
            label="Active"
            value={String(customers.length - disabledCount)}
            color="#4ade80"
            sub="can sign in"
          />
          <StatCard
            label="Disabled"
            value={String(disabledCount)}
            color={disabledCount > 0 ? "#f87171" : "#4ade80"}
            sub={disabledCount > 0 ? "blocked accounts" : "none"}
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
              { label: "All", value: "ALL", count: customers.length },
              {
                label: "Active",
                value: "ACTIVE",
                count: customers.length - disabledCount,
              },
              { label: "Disabled", value: "DISABLED", count: disabledCount },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as FilterVal)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customers…"
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
          <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
            <div style={{ minWidth: isMobile ? 460 : "auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  padding: isMobile ? "12px 16px" : "12px 22px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontFamily: "monospace",
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(240,244,248,0.28)",
                }}
              >
                <span>Customer</span>
                {!isMobile && (
                  <span style={{ textAlign: "right" }}>Joined</span>
                )}
                {!isMobile && (
                  <span style={{ textAlign: "right" }}>Orders</span>
                )}
                {!isMobile && <span style={{ textAlign: "right" }}>Spent</span>}
                <span style={{ textAlign: "right" }}>Status</span>
              </div>

              {loading && <Spinner />}
              {!loading && filtered.length === 0 && (
                <EmptyState
                  label={
                    search
                      ? `No customers matching "${search}"`
                      : "No customers found"
                  }
                />
              )}

              {!loading &&
                filtered.map((customer) => {
                  const name =
                    customer.displayName ||
                    [customer.firstName, customer.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    "Guest";

                  return (
                    <div
                      key={customer.id}
                      onClick={() => setSelected(customer)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.022)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns: gridCols,
                        padding: isMobile ? "13px 16px" : "13px 22px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontFamily: "Poppins, sans-serif",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#f0f4f8",
                              margin: "0 0 2px",
                            }}
                          >
                            {name}
                          </p>
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: 9,
                              color: "rgba(240,244,248,0.3)",
                              margin: 0,
                            }}
                          >
                            {customer.email}
                          </p>
                          {isMobile && (
                            <p
                              style={{
                                fontFamily: "monospace",
                                fontSize: 9,
                                color: "rgba(240,244,248,0.35)",
                                margin: "4px 0 0",
                              }}
                            >
                              {customer.numberOfOrders} orders ·{" "}
                              {formatPrice(
                                customer.amountSpent.amount,
                                customer.amountSpent.currencyCode,
                              )}
                            </p>
                          )}
                        </div>
                        {customer.appeal?.status === "pending" && (
                          <span
                            title="Pending appeal"
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "rgba(232,168,48,0.12)",
                              border: "1px solid rgba(232,168,48,0.35)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#e8a830"
                              strokeWidth="2.5"
                            >
                              <path
                                d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M13.73 21a2 2 0 0 1-3.46 0"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                      </div>

                      {!isMobile && (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            textAlign: "right",
                            color: "rgba(240,244,248,0.45)",
                          }}
                        >
                          {formatDate(customer.createdAt)}
                        </span>
                      )}

                      {!isMobile && (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            textAlign: "right",
                            color: "rgba(240,244,248,0.5)",
                          }}
                        >
                          {customer.numberOfOrders}
                        </span>
                      )}

                      {!isMobile && (
                        <span
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "1.05rem",
                            color: "#f0f4f8",
                            textAlign: "right",
                          }}
                        >
                          {formatPrice(
                            customer.amountSpent.amount,
                            customer.amountSpent.currencyCode,
                          )}
                        </span>
                      )}

                      <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <StatusPill
                          label={customer.disabled ? "DISABLED" : "ACTIVE"}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <CustomerDetailDrawer
          customer={selected}
          onClose={() => setSelected(null)}
          onToggleDisabled={handleToggleDisabled}
          onAppealResolved={handleAppealResolved}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
