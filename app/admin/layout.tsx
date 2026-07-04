"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON_ORDERS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2 4.5L8 1.5L14 4.5V11.5L8 14.5L2 11.5V4.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M2 4.5L8 7.5L14 4.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 7.5V14.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const ICON_PRODUCTS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect
      x="2"
      y="3"
      width="12"
      height="10"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M5.5 9.5H10.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const ICON_CUSTOMERS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M2.5 13c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const ICON_PREORDERS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 4.5V8L10.5 9.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ICON_CREW = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="5.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="11" cy="5.5" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M1.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M9.5 9.3c1.9.2 3.4 1.8 3.4 3.7"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const ICON_ANALYTICS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2 12.5L5.5 8.5L8.5 10.5L12 6L14 7.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 14H14"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const ICON_HAMBURGER = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M3 6H17M3 10H17M3 14H17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const ICON_CLOSE = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M4 4L14 14M14 4L4 14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const NAV = [
  { href: "/admin", label: "Orders", icon: ICON_ORDERS },
  { href: "/admin/pre-orders", label: "Pre-orders", icon: ICON_PREORDERS },
  { href: "/admin/products", label: "Products", icon: ICON_PRODUCTS },
  { href: "/admin/customers", label: "Customers", icon: ICON_CUSTOMERS },
  { href: "/admin/crew", label: "The Crew", icon: ICON_CREW },
  { href: "/admin/analytics", label: "Analytics", icon: ICON_ANALYTICS },
];

// ── Breakpoints ──────────────────────────────────────────────────────────
const TABLET_MAX = 1023;
const MOBILE_MAX = 767;

type Layout = "desktop" | "tablet" | "mobile";

function useLayoutMode(): { mode: Layout; ready: boolean } {
  // Start as "desktop" on the server / before mount to avoid a flash of
  // the wrong (collapsed/drawer) layout during hydration.
  const [mode, setMode] = useState<Layout>("desktop");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const compute = (): Layout => {
      const w = window.innerWidth;
      if (w <= MOBILE_MAX) return "mobile";
      if (w <= TABLET_MAX) return "tablet";
      return "desktop";
    };

    setMode(compute());
    setReady(true);

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setMode(compute()));
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { mode, ready };
}

const SIDEBAR_WIDTH = 220;
const RAIL_WIDTH = 68;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { mode, ready } = useLayoutMode();
  const [railHovered, setRailHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDesktop = mode === "desktop";
  const isTablet = mode === "tablet";
  const isMobile = mode === "mobile";

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close the mobile drawer if the viewport grows out of mobile
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Effective expanded state for tablet rail (hover-to-expand)
  const railExpanded = isTablet && railHovered;

  // Sidebar visual width (used for main's margin-left on desktop/tablet)
  const mainMarginLeft = isMobile ? 0 : isTablet ? RAIL_WIDTH : SIDEBAR_WIDTH;

  // Whether nav labels/text should render (hidden on collapsed tablet rail)
  const showLabels = isDesktop || isMobile || railExpanded;

  // Sidebar transform/width per mode
  const sidebarWidth = isMobile
    ? SIDEBAR_WIDTH
    : isTablet
      ? railExpanded
        ? SIDEBAR_WIDTH
        : RAIL_WIDTH
      : SIDEBAR_WIDTH;

  const sidebarTransform = isMobile
    ? drawerOpen
      ? "translateX(0)"
      : "translateX(-100%)"
    : "translateX(0)";

  const topBarHeight = 56;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090c12",
        display: "flex",
        fontFamily: "Poppins, sans-serif",
        // Prevent a flash of unstyled/wrong layout before mount
        visibility: ready ? "visible" : "visible",
      }}
    >
      {/* ── Mobile top bar ── */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: topBarHeight,
            background: "#0d1017",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            zIndex: 1000,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/logo.png"
              alt="Shoepreme"
              width={24}
              height={24}
              style={{ objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.15rem",
                letterSpacing: "0.08em",
                color: "#f0f4f8",
              }}
            >
              SHOEPREME
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f0f4f8",
              cursor: "pointer",
            }}
          >
            {drawerOpen ? ICON_CLOSE : ICON_HAMBURGER}
          </button>
        </div>
      )}

      {/* ── Mobile overlay ── */}
      {isMobile && (
        <div
          onClick={closeDrawer}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 998,
            opacity: drawerOpen ? 1 : 0,
            pointerEvents: drawerOpen ? "auto" : "none",
            transition: "opacity 220ms ease",
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        onMouseEnter={() => isTablet && setRailHovered(true)}
        onMouseLeave={() => isTablet && setRailHovered(false)}
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          background: "#0d1017",
          borderRight: "1px solid rgba(255,255,255,0.055)",
          position: "fixed",
          top: isMobile ? topBarHeight : 0,
          left: 0,
          height: isMobile ? `calc(100vh - ${topBarHeight}px)` : "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 999,
          transform: sidebarTransform,
          transition:
            "width 220ms ease, transform 220ms ease, box-shadow 220ms ease",
          boxShadow:
            isTablet && railExpanded ? "8px 0 24px rgba(0,0,0,0.35)" : "none",
        }}
      >
        {/* Logo — hidden on mobile sidebar since it's in the top bar */}
        {!isMobile && (
          <div style={{ padding: "20px 22px 18px" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                marginBottom: 8,
                whiteSpace: "nowrap",
              }}
            >
              <img
                src="/logo.png"
                alt="Shoepreme"
                width={28}
                height={28}
                style={{ objectFit: "contain", flexShrink: 0 }}
              />
              {showLabels && (
                <span
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "0.08em",
                    color: "#f0f4f8",
                  }}
                >
                  SHOEPREME
                </span>
              )}
            </Link>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
          </div>
        )}
        {isMobile && <div style={{ height: 14 }} />}

        {/* Nav */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: "0 10px",
            flex: 1,
          }}
        >
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={!showLabels ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 13px",
                  borderRadius: 9,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  color: active ? "#f0f4f8" : "rgba(240,244,248,0.4)",
                  background: active ? "rgba(232,168,48,0.09)" : "transparent",
                  borderLeft: active
                    ? "2px solid #e8a830"
                    : "2px solid transparent",
                  transition: "all 0.13s",
                }}
              >
                <span
                  style={{
                    color: active ? "#e8a830" : "rgba(240,244,248,0.3)",
                    display: "flex",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                {showLabels && label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 10px 28px" }}>
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.05)",
              marginBottom: 14,
            }}
          />
          <Link
            href="/"
            title={!showLabels ? "View Store" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 13px",
              borderRadius: 9,
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              color: "rgba(240,244,248,0.3)",
              transition: "color 0.14s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(240,244,248,0.6)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(240,244,248,0.3)")
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {showLabels && "View Store"}
          </Link>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          marginLeft: mainMarginLeft,
          marginTop: isMobile ? topBarHeight : 0,
          transition: "margin-left 220ms ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}
