"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StatCard, Spinner } from "@/lib/admin-ui";
import { useLayoutMode } from "@/lib/use-layout-mode";

const GOLD = "#e8a830";
const GREEN = "#4ade80";
const TEAL = "#2dd4bf";
const PURPLE = "#a78bfa";
const RED = "#f87171";
const PALETTE = [GOLD, GREEN, TEAL, PURPLE, RED];

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function Panel({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 22,
        minWidth: 0,
        ...style,
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(240,244,248,0.28)",
          margin: "0 0 18px",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Custom SVG line chart, matches the CalendarView / bento aesthetic ──
function RevenueLineChart({
  data,
}: {
  data: { date: string; amount: number }[];
}) {
  const width = 700;
  const height = 220;
  const padL = 44;
  const padB = 26;
  const padT = 10;

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(240,244,248,0.25)",
          }}
        >
          No revenue in this range
        </span>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.amount), 1);
  const stepX = (width - padL - 16) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = padL + i * stepX;
    const y = padT + (1 - d.amount / max) * (height - padT - padB);
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padB} L ${points[0].x} ${height - padB} Z`;

  const yTicks = 4;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grid */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padT + (i / yTicks) * (height - padT - padB);
        const val = Math.round(max - (i / yTicks) * max);
        return (
          <g key={i}>
            <line
              x1={padL}
              x2={width - 10}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
            />
            <text
              x={0}
              y={y + 3}
              fontSize="9"
              fontFamily="monospace"
              fill="rgba(240,244,248,0.28)"
            >
              {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#revFill)" />
      <path d={linePath} fill="none" stroke={GOLD} strokeWidth="2" />

      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3}
            fill={hover === i ? GOLD : "#0d1117"}
            stroke={GOLD}
            strokeWidth="2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          />
          <rect
            x={p.x - stepX / 2}
            y={0}
            width={stepX}
            height={height - padB}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        </g>
      ))}

      {hover !== null && (
        <g>
          <line
            x1={points[hover].x}
            x2={points[hover].x}
            y1={padT}
            y2={height - padB}
            stroke="rgba(232,168,48,0.3)"
            strokeDasharray="3 3"
          />
          <foreignObject
            x={Math.min(Math.max(points[hover].x - 60, 0), width - 130)}
            y={-6}
            width="130"
            height="50"
          >
            <div
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "6px 10px",
                fontFamily: "monospace",
                fontSize: 10,
              }}
            >
              <div style={{ color: "rgba(240,244,248,0.4)" }}>
                {formatDate(points[hover].date)}
              </div>
              <div style={{ color: GOLD, fontWeight: 700 }}>
                {formatPrice(points[hover].amount)}
              </div>
            </div>
          </foreignObject>
        </g>
      )}

      {/* x-axis labels (sparse) */}
      {points
        .filter((_, i) => i % Math.ceil(points.length / 6 || 1) === 0)
        .map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 6}
            fontSize="9"
            fontFamily="monospace"
            fill="rgba(240,244,248,0.28)"
            textAnchor="middle"
          >
            {formatDate(p.date)}
          </text>
        ))}
    </svg>
  );
}

// ── Custom SVG donut, matches your gold/green/teal/purple palette ──
function Donut({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const size = 160;
  const r = 60;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = 22;

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const fraction = total > 0 ? d.count / total : 0;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    return { ...d, startAngle, endAngle, color: PALETTE[i % PALETTE.length] };
  });

  function arcPath(startAngle: number, endAngle: number) {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  if (total === 0) {
    return (
      <div
        style={{
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(240,244,248,0.25)",
          }}
        >
          No payment data yet
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width={size} height={size}>
        {segments.map((s, i) => (
          <path
            key={i}
            d={arcPath(s.startAngle, s.endAngle)}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
          />
        ))}
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          fontFamily="Bebas Neue, sans-serif"
          fontSize="22"
          fill="#f0f4f8"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="8"
          letterSpacing="0.1em"
          fill="rgba(240,244,248,0.3)"
        >
          ORDERS
        </text>
      </svg>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}
      >
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: "rgba(240,244,248,0.55)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                color: "#f0f4f8",
              }}
            >
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Custom funnel, styled like your existing progress bars ──
function Funnel({ data }: { data: { stage: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((d, i) => (
        <div key={d.stage}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(240,244,248,0.5)",
              }}
            >
              {d.stage}
            </span>
            <span
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: 15,
                color: "#f0f4f8",
              }}
            >
              {d.value}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(d.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]}88, ${PALETTE[i % PALETTE.length]})`,
                borderRadius: 4,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { isMobile, isTablet } = useLayoutMode();
  const [range, setRange] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (days: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/analytics?days=${days}`, {
      cache: "no-store",
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  // ── group similar payment gateway names into clean buckets ──
  const groupedPayments = useMemo(() => {
    if (!data?.paymentBreakdown) return [];
    const buckets: Record<string, number> = {};
    for (const p of data.paymentBreakdown) {
      const n = p.name.toLowerCase();
      let bucket = "Other";
      if (n.includes("gcash")) bucket = "GCash";
      else if (
        n.includes("cash") ||
        n.includes("cod") ||
        n.includes("in-store") ||
        n.includes("in person")
      )
        bucket = "Cash";
      else if (
        n.includes("card") ||
        n.includes("paymongo") ||
        n.includes("bank")
      )
        bucket = "Card / Bank";
      else if (n.includes("manual")) bucket = "Manual";
      buckets[bucket] = (buckets[bucket] ?? 0) + p.count;
    }
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [data]);

 const funnelData = data
  ? [
      { stage: "Pending", value: data.statusCounts.PENDING },
      { stage: "Paid", value: data.statusCounts.PAID },
      { stage: "Unfulfilled", value: data.fulfillCounts.UNFULFILLED },
      { stage: "In Progress", value: data.fulfillCounts.IN_PROGRESS },
      { stage: "Fulfilled", value: data.fulfillCounts.FULFILLED },
      { stage: "Refunded", value: data.statusCounts.REFUNDED },
      { stage: "Voided", value: data.statusCounts.VOIDED },
      { stage: "Cancelled", value: data.cancelledCount },
    ].filter((d) => d.value > 0)
  : [];

  const preOrderConversion =
    data?.preOrders?.total > 0
      ? Math.round((data.preOrders.completed / data.preOrders.total) * 100)
      : 0;

  const maxProductRevenue = data?.topProducts?.[0]?.revenue || 1;

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
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
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
              Analytics
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              gap: 4,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: 4,
              width: isMobile ? "100%" : "auto",
            }}
          >
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setRange(r.days)}
                style={{
                  flex: isMobile ? 1 : "none",
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  background: range === r.days ? GOLD : "transparent",
                  color: range === r.days ? "#0d1117" : "rgba(240,244,248,0.4)",
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <Spinner />}

        {!loading && data && (
          <>
            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr 1fr"
                  : isTablet
                    ? "1fr 1fr"
                    : "repeat(4, 1fr)",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <StatCard
                label="Total Revenue"
                value={formatPrice(data.totalRevenue)}
                color={GREEN}
                sub={`${data.paidCount} paid orders`}
              />
              <StatCard
                label="Total Orders"
                value={String(data.totalOrders)}
                sub="in range"
              />
              <StatCard
                label="Avg Order Value"
                value={formatPrice(data.avgOrderValue)}
                color={GOLD}
                sub="per paid order"
              />
              <StatCard
                label="Pre-order Conversion"
                value={`${preOrderConversion}%`}
                color={TEAL}
                sub={`${data.preOrders.completed}/${data.preOrders.total} confirmed`}
              />
            </div>

            {/* Revenue trend + Payment donut */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile || isTablet ? "1fr" : "2fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Panel title="Revenue Trend">
                <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
                  <div style={{ minWidth: isMobile ? 600 : "auto" }}>
                    <RevenueLineChart data={data.revenueTrend} />
                  </div>
                </div>
              </Panel>
              <Panel title="Payment Methods">
                <Donut data={groupedPayments} />
              </Panel>
            </div>

            {/* Funnel + Top products */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1.3fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Panel title="Order Funnel">
                <Funnel data={funnelData} />
              </Panel>

              <Panel title="Top Products">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {data.topProducts.map((p: any, i: number) => (
                    <div
                      key={p.title}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? 8 : 12,
                        flexWrap: isMobile ? "wrap" : "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: 16,
                          color: i === 0 ? GOLD : "rgba(240,244,248,0.25)",
                          width: 20,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: isMobile ? "100%" : 0 }}>
                        <p
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#f0f4f8",
                            margin: "0 0 5px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.title}
                        </p>
                        <div
                          style={{
                            height: 5,
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.max(4, (p.revenue / maxProductRevenue) * 100)}%`,
                              background: GOLD,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 9,
                          color: "rgba(240,244,248,0.4)",
                          flexShrink: 0,
                          minWidth: 44,
                          textAlign: "right",
                        }}
                      >
                        {p.units}× sold
                      </span>
                      <span
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: 14,
                          color: GREEN,
                          flexShrink: 0,
                          minWidth: 66,
                          textAlign: "right",
                        }}
                      >
                        {formatPrice(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Recent activity */}
            <Panel title="Recent Activity">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {data.recentOrders.map((o: any, i: number) => (
                  <div
                    key={o.id}
                    style={{
                      display: "flex",
                      flexWrap: isMobile ? "wrap" : "nowrap",
                      alignItems: "center",
                      gap: isMobile ? 8 : 16,
                      padding: "10px 0",
                      borderBottom:
                        i < data.recentOrders.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        minWidth: isMobile ? "auto" : 70,
                      }}
                    >
                      {o.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: "rgba(240,244,248,0.35)",
                        minWidth: isMobile ? "auto" : 70,
                      }}
                    >
                      {formatDate(o.createdAt)}
                    </span>
                    {isMobile && (
                      <span style={{ flexBasis: "100%", height: 0 }} />
                    )}
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 4,
                        color: o.financialStatus === "PAID" ? GREEN : GOLD,
                        background:
                          o.financialStatus === "PAID"
                            ? "rgba(74,222,128,0.08)"
                            : "rgba(232,168,48,0.08)",
                        border: `1px solid ${o.financialStatus === "PAID" ? "rgba(74,222,128,0.2)" : "rgba(232,168,48,0.2)"}`,
                      }}
                    >
                      {o.financialStatus}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: "Bebas Neue, sans-serif",
                        fontSize: 15,
                        color: "#f0f4f8",
                      }}
                    >
                      {formatPrice(parseFloat(o.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}
