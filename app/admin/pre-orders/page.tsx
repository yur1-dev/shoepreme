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
import { useLayoutMode } from "@/lib/use-layout-mode";

const PREORDERS_GRID_DESKTOP = "22px 100px 1fr 140px 110px 140px";
const PREORDERS_GRID_MOBILE = "20px 90px 1fr 100px";

function formatPrice(amount: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
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

type FilterVal = "ALL" | "OPEN" | "COMPLETED";

interface DraftLineItem {
  title: string;
  quantity: number;
  variantTitle?: string;
  originalUnitPrice: string;
  image?: string | null;
}

interface DraftOrder {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  invoiceUrl?: string;
  totalPrice: string;
  email?: string;
  customerName: string;
  lineItems: DraftLineItem[];
}

export default function AdminPreOrdersPage() {
  const { isMobile, isTablet } = useLayoutMode();
  const gridCols = isMobile ? PREORDERS_GRID_MOBILE : PREORDERS_GRID_DESKTOP;
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterVal>("ALL");
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<DraftOrder | null>(null);
  const { toast, showToast } = useToast();

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/draft-orders", { cache: "no-store" });
    const data = await res.json();
    setDrafts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  async function handleConfirmStock() {
    if (!confirmTarget) return;
    setActionLoading(confirmTarget.id);
    try {
      const res = await fetch("/api/admin/complete-draft-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftOrderId: confirmTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Converted to order ${data.order?.name ?? ""} ✓`);
        setConfirmTarget(null);
        await fetchDrafts();
      } else {
        showToast("Failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  const openCount = drafts.filter((d) => d.status === "OPEN").length;
  const completedCount = drafts.filter((d) => d.status === "COMPLETED").length;
  const totalValue = drafts.reduce((s, d) => s + parseFloat(d.totalPrice), 0);

  const filtered = useMemo(() => {
    let list = drafts;
    if (filter === "OPEN") list = list.filter((d) => d.status === "OPEN");
    if (filter === "COMPLETED")
      list = list.filter((d) => d.status === "COMPLETED");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.customerName?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [drafts, filter, search]);

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
              Pre-orders
            </h1>
          </div>
          <ActionButton onClick={fetchDrafts} variant="ghost">
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
            label="Total Reservations"
            value={String(drafts.length)}
            sub="all time"
          />
          <StatCard
            label="Awaiting Confirmation"
            value={String(openCount)}
            color="#e8a830"
            sub={openCount > 0 ? "needs action" : "all clear"}
          />
          <StatCard
            label="Total Value"
            value={`₱${totalValue.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`}
            color="#4ade80"
            sub="reserved orders"
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
              { label: "All", value: "ALL", count: drafts.length },
              { label: "Awaiting", value: "OPEN", count: openCount },
              {
                label: "Completed",
                value: "COMPLETED",
                count: completedCount,
              },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as FilterVal)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search reservation, customer…"
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
            <div style={{ minWidth: isMobile ? 600 : "auto" }}>
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
                <span />
                <span>Reservation</span>
                <span>Customer</span>
                {!isMobile && <span>Date</span>}
                <span>Status</span>
                {!isMobile && <span style={{ textAlign: "right" }}>Total</span>}
              </div>

              {loading && <Spinner />}

              {!loading && filtered.length === 0 && (
                <EmptyState
                  label={
                    search
                      ? `No reservations matching "${search}"`
                      : "No reservations yet"
                  }
                />
              )}

              {!loading &&
                filtered.map((draft) => {
                  const isBusy = actionLoading === draft.id;
                  const isExpanded = expandedId === draft.id;
                  const isOpen = draft.status === "OPEN";

                  return (
                    <div key={draft.id}>
                      {/* Row */}
                      <div
                        onClick={() =>
                          setExpandedId(isExpanded ? null : draft.id)
                        }
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
                          gridTemplateColumns: gridCols,
                          padding: isMobile ? "14px 16px" : "14px 22px",
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
                          {draft.name}
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
                            {draft.customerName}
                          </p>
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: 9,
                              color: "rgba(240,244,248,0.32)",
                              margin: 0,
                            }}
                          >
                            {draft.email ?? "—"}
                          </p>
                        </div>

                        {!isMobile && (
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 10,
                              color: "rgba(240,244,248,0.45)",
                            }}
                          >
                            {formatDate(draft.createdAt)}
                          </span>
                        )}

                        <StatusPill label={isOpen ? "PENDING" : draft.status} />

                        {!isMobile && (
                          <span
                            style={{
                              fontFamily: "Bebas Neue, sans-serif",
                              fontSize: "1.1rem",
                              color: "#f0f4f8",
                              textAlign: "right",
                            }}
                          >
                            {formatPrice(draft.totalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                            gap: isMobile ? 18 : 28,
                            padding: isMobile
                              ? "18px 16px 22px"
                              : "22px 22px 26px 60px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: "rgba(255,255,255,0.016)",
                          }}
                        >
                          {isMobile && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontFamily: "monospace",
                                fontSize: 10,
                                color: "rgba(240,244,248,0.45)",
                              }}
                            >
                              <span>{formatDate(draft.createdAt)}</span>
                              <span
                                style={{
                                  fontFamily: "Bebas Neue, sans-serif",
                                  fontSize: "1.1rem",
                                  color: "#f0f4f8",
                                }}
                              >
                                {formatPrice(draft.totalPrice)}
                              </span>
                            </div>
                          )}
                          {/* Left: items */}
                          <div>
                            <FieldLabel>
                              Items ({draft.lineItems.length})
                            </FieldLabel>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              {draft.lineItems.map((item, i) => (
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
                                      border:
                                        "1px solid rgba(255,255,255,0.08)",
                                      overflow: "hidden",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {item.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.image}
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
                                      {item.variantTitle &&
                                      item.variantTitle !== "Default Title"
                                        ? `${item.variantTitle} · `
                                        : ""}
                                      Qty {item.quantity}
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
                                        parseFloat(item.originalUnitPrice) *
                                          item.quantity,
                                      ),
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: action */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 14,
                              alignItems: "flex-start",
                            }}
                          >
                            <div>
                              <FieldLabel>Status</FieldLabel>
                              <p
                                style={{
                                  fontFamily: "Poppins, sans-serif",
                                  fontSize: 12,
                                  color: "rgba(240,244,248,0.6)",
                                  margin: 0,
                                }}
                              >
                                {isOpen
                                  ? "Awaiting stock confirmation from admin."
                                  : "This reservation has been converted to an order."}
                              </p>
                            </div>

                            {isOpen && (
                              <ActionButton
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  setConfirmTarget(draft);
                                }}
                                disabled={isBusy}
                                variant="green"
                              >
                                {isBusy ? "…" : "Confirm Stock & Send Invoice"}
                              </ActionButton>
                            )}

                            {draft.invoiceUrl && (
                              <a
                                href={draft.invoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 10,
                                  color: "#4a7fa5",
                                }}
                              >
                                View Invoice →
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <Toast toast={toast} />

      {/* ── Confirm Stock Modal ── */}
      {confirmTarget && (
        <>
          <div
            onClick={() => setConfirmTarget(null)}
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
                Confirm Stock
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
                {confirmTarget?.name}
              </h3>
            </div>
            <p
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                color: "rgba(240,244,248,0.55)",
                lineHeight: 1.6,
                margin: 0,
                background: "rgba(74,222,128,0.05)",
                border: "1px solid rgba(74,222,128,0.15)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              This converts the reservation into a real order and sends the
              customer a payment link. Only do this once stock has been
              verified.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirmTarget(null)}
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
                onClick={handleConfirmStock}
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
                Confirm & Send Invoice
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
