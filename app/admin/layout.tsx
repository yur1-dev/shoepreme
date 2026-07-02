"use client";

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

const NAV = [
  { href: "/admin", label: "Orders", icon: ICON_ORDERS },
  { href: "/admin/pre-orders", label: "Pre-orders", icon: ICON_PREORDERS },
  { href: "/admin/products", label: "Products", icon: ICON_PRODUCTS },
  { href: "/admin/customers", label: "Customers", icon: ICON_CUSTOMERS },
  { href: "/admin/crew", label: "The Crew", icon: ICON_CREW },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090c12",
        display: "flex",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: "#0d1017",
          borderRight: "1px solid rgba(255,255,255,0.055)",
          position: "fixed",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "20px 22px 18px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            <img
              src="/logo.png"
              alt="Shoepreme"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
            />
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
          </Link>
          {/* <p
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(240,244,248,0.25)",
              margin: "0 0 10px",
            }}
          >
            Admin Panel
          </p> */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
        </div>
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 13px",
                  borderRadius: 9,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
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
                  }}
                >
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}

          {/* Coming soon items — visible but disabled so layout feels complete */}
          {[
            {
              label: "Analytics",
              icon: (
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
              ),
            },
          ].map(({ label, icon }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 13px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(240,244,248,0.18)",
                borderLeft: "2px solid transparent",
                cursor: "not-allowed",
                position: "relative",
              }}
            >
              <span
                style={{ color: "rgba(240,244,248,0.15)", display: "flex" }}
              >
                {icon}
              </span>
              {label}
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "monospace",
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "rgba(232,168,48,0.4)",
                  background: "rgba(232,168,48,0.07)",
                  border: "1px solid rgba(232,168,48,0.15)",
                  borderRadius: 4,
                  padding: "2px 5px",
                }}
              >
                SOON
              </span>
            </div>
          ))}
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 13px",
              borderRadius: 9,
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600,
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
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View Store
          </Link>
        </div>
      </aside>

      <main
        style={{ flex: 1, minWidth: 0, overflowX: "auto", marginLeft: 220 }}
      >
        {children}
      </main>
    </div>
  );
}
