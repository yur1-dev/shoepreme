// components/Navbar.js
"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import SearchModal from "@/components/SearchModal";

type CategoryLabel =
  | "Men"
  | "Women"
  | "Basketball & Court"
  | "Running"
  | "Trail"
  | "Sneakers";

const NAV_LINKS: {
  label: string;
  href: string;
  accent?: boolean;
  children?: { label: CategoryLabel; href: string }[];
}[] = [
  {
    label: "Shop",
    href: "/collections",
    children: [
      { label: "Men", href: "/collections/men" },
      { label: "Women", href: "/collections/women" },
      { label: "Basketball & Court", href: "/collections/basketball" },
      { label: "Running", href: "/collections/running" },
      { label: "Trail", href: "/collections/trail" },
      { label: "Sneakers", href: "/collections/sneakers" },
    ],
  },
  { label: "In-Store", href: "/collections/in-store" },
  { label: "Pre-order", href: "/collections/pre-order" },
  { label: "Sale", href: "/collections/sale", accent: true },
  { label: "New In Stock", href: "/collections/new", accent: true },
  { label: "The Crew", href: "/crew", accent: true },
];

const CATEGORY_ICONS: Record<CategoryLabel, React.ReactElement> = {
  Men: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="6" r="3" />
      <path
        d="M6 21v-2a6 6 0 0112 0v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Women: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="5" r="3" />
      <path
        d="M9 9l-3.5 8h13L15 9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  ),
  "Basketball & Court": (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <path
        d="M3 12h18M12 3v18M5.8 5.8c2.2 2.6 2.2 9.8 0 12.4M18.2 5.8c-2.2 2.6-2.2 9.8 0 12.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  Running: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="15.5" cy="4.5" r="1.7" />
      <path
        d="M5 20l3-4 2.5-1.5-1-3.5 3.5-1.5 2 3 3.5 1.5M9.5 12l1.5-4.5 3.5 1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trail: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        d="M2.5 19l5-9.5 2.8 4 2.7-6L20 19H2.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Sneakers: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        d="M3 17.5l2.5-1 2-2.5 4 1 3-1.8 3.2 1.8L20.5 17v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-1.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalQuantity, openCart } = useCart();
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Fixed wrapper holds BOTH bars stacked in normal flow — no magic top offsets, no gap */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Announcement bar */}
        <div
          style={{
            background: "#080b10",
            color: "#e8a830",
            overflow: "hidden",
            height: "30px",
            display: "flex",
            alignItems: "center",
            position: "relative",
            borderBottom: "1px solid rgba(232,168,48,0.15)",
          }}
        >
          {/* Gradient fade edges */}
          {/* Shimmer sweep */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(232,168,48,0.06) 50%, transparent 100%)",
              animation: "announceSweep 3s ease-in-out infinite",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "80px",
              background: "linear-gradient(90deg, #080b10, transparent)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "80px",
              background: "linear-gradient(-90deg, #080b10, transparent)",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          <div className="ticker-track">
            {[0, 1].map((dupe) => (
              <div key={dupe} className="ticker-inner">
                {[
                  "Free Shipping over ₱5,000",
                  "100% Authentic",
                  "JP · TW · US Sourced",
                  "Returns within 7 Days",
                  "Pre-order Available",
                  "Zero Fakes. Ever.",
                ].map((text, i) => (
                  <span key={i} className="ticker-item">
                    <svg
                      width="5"
                      height="5"
                      viewBox="0 0 5 5"
                      style={{ flexShrink: 0 }}
                    >
                      <rect
                        x="0"
                        y="0"
                        width="5"
                        height="5"
                        fill="#e8a830"
                        transform="rotate(45 2.5 2.5)"
                      />
                    </svg>
                    <span className="ticker-text">{text}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>

          <style>{`
            .ticker-track {
              display: flex;
              width: max-content;
              animation: tickerScroll 28s linear infinite;
            }
            .ticker-track:hover { animation-play-state: paused; }
            .ticker-inner {
              display: flex;
              align-items: center;
              flex-shrink: 0;
            }
            .ticker-item {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 0 28px;
              white-space: nowrap;
            }
            .ticker-text {
              font-size: 9.5px;
              font-weight: 700;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: rgba(232,168,48,0.75);
            }
            .ticker-item:hover .ticker-text { color: #e8a830; }
            @keyframes tickerScroll {
              from { transform: translateX(0); }
              to   { transform: translateX(-50%); }
            }
          `}</style>
        </div>

        {/* Nav — transparent text-only at top, morphs into blurred pill on scroll */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0",
          }}
        >
          <nav
            className="nav-grid"
            style={{
              width: "100%",
              maxWidth: "1280px",
              background: scrolled ? "rgba(13,17,23,0.6)" : "transparent",
              backdropFilter: scrolled ? "blur(20px)" : "none",
              WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
              border: "none",
              borderBottom: scrolled
                ? "1px solid rgba(255,255,255,0.06)"
                : "none",
              borderRadius: scrolled ? "20px" : "0px",
              padding: "0 32px",
              height: "64px",
              alignItems: "center",
              boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
              transition:
                "background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease",
            }}
          >
            {/* Logo — sits in column 1, pinned left regardless of icon-column width */}
            <Link
              href="/"
              style={{
                justifySelf: "start",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Image
                src="/logo.png"
                alt="Shoepreme"
                width={34}
                height={34}
                style={{ objectFit: "contain" }}
              />
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  color: "#f5f7f9",
                  fontSize: "1.55rem",
                  letterSpacing: "0.08em",
                  lineHeight: 1,
                }}
              >
                SHOEPREME
              </span>
            </Link>

            {/* Desktop links — column 2, truly centered via grid (not space-between) */}
            <ul
              style={{
                display: "none",
                listStyle: "none",
                gap: "20px",
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
                padding: 0,
                justifySelf: "center",
                whiteSpace: "nowrap",
                flexWrap: "nowrap",
              }}
              className="md-nav-links"
            >
              {NAV_LINKS.map((item) => (
                <li
                  key={item.label}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                  className={item.children ? "nav-dropdown-parent" : ""}
                >
                  {item.children ? (
                    <>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(245,247,249,0.6)",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          transition: "color 0.2s",
                          lineHeight: 1,
                          verticalAlign: "middle",
                        }}
                        className="nav-link nav-dropdown-trigger"
                      >
                        {item.label}
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" d="M6 9l6 6 6-6" />
                        </svg>
                      </button>

                      {/* Outer hit-box: flush against the trigger (top:100%), gap lives
                          in padding-top so the hover area is continuous — this is what
                          stops the dropdown from dying mid-hover */}
                      <div className="nav-dropdown">
                        <div className="nav-dropdown-inner">
                          <div className="nav-dropdown-label">
                            Shop by Category
                          </div>
                          <div className="nav-dropdown-grid">
                            {item.children.map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className="nav-dropdown-item"
                              >
                                <span className="nav-dropdown-icon">
                                  {CATEGORY_ICONS[child.label]}
                                </span>
                                <span>{child.label}</span>
                              </Link>
                            ))}
                          </div>
                          <Link
                            href={item.href}
                            className="nav-dropdown-viewall"
                          >
                            View All Products
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12h14M13 6l6 6-6 6"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      style={{
                        color: item.accent
                          ? "#e8a830"
                          : "rgba(245,247,249,0.6)",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        transition: "color 0.2s",
                      }}
                      className={item.accent ? "nav-link-accent" : "nav-link"}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Icons — column 3, pinned right */}
            <div
              style={{
                justifySelf: "end",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                marginRight: "-10px",
              }}
            >
              <Link
                href={session ? "/account" : "/account/login"}
                aria-label="Account"
                style={{
                  background: "none",
                  border: "none",
                  color: session ? "#e8a830" : "rgba(245,247,249,0.55)",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                className="icon-btn"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="7" r="4" />
                  <path strokeLinecap="round" d="M4 21v-1a8 8 0 0116 0v1" />
                </svg>
              </Link>

              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(245,247,249,0.55)",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "9999px",
                  cursor: "pointer",
                }}
                className="icon-btn search-btn"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </button>

              <button
                onClick={openCart}
                aria-label={`Cart (${totalQuantity})`}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  color: "rgba(245,247,249,0.55)",
                  padding: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "9999px",
                }}
                className="icon-btn"
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {totalQuantity > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#e8a830",
                      color: "#0d1117",
                      fontSize: "8px",
                      fontWeight: 900,
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {totalQuantity}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
                style={{
                  background: "none",
                  border: "none",
                  color: "#f5f7f9",
                  padding: "10px",
                  cursor: "pointer",
                  display: "flex",
                  borderRadius: "9999px",
                }}
                className="hamburger-btn icon-btn"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d={
                      menuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              alignSelf: "center",
              width: "calc(100% - 32px)",
              maxWidth: "1100px",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              padding: "8px 20px 12px",
              marginTop: "-4px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  color: item.accent ? "#e8a830" : "rgba(245,247,249,0.75)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* <div style={{ height: "101px" }} /> */}

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      <style>{`
        @keyframes announceSweep {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
.nav-grid {
          display: flex;
          justify-content: space-between;
        }
        @media (min-width: 768px) {
          .nav-grid {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            column-gap: 24px;
          }
          .md-nav-links { display: flex !important; }
          .hamburger-btn { display: none !important; }
        }
        .nav-link:hover { color: #f5f7f9 !important; }
        .nav-link-accent:hover { color: #fff !important; }
        .icon-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .nav-dropdown-trigger:hover { color: #f5f7f9 !important; }
        .nav-dropdown-trigger svg { transition: transform 0.2s ease; }
        .nav-dropdown-parent:hover .nav-dropdown-trigger svg { transform: rotate(180deg); }

        /* Outer hit-box — flush against trigger, no gap. The 12px breathing room
           is padding (part of the box, still hoverable), not a top offset (dead zone). */
        .nav-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding-top: 12px;
          width: max-content;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease;
          z-index: 100;
        }
        .nav-dropdown-parent:hover .nav-dropdown {
          opacity: 1;
          pointer-events: auto;
        }

        /* Visual card — separate from the hit-box so it can scale/slide independently */
        .nav-dropdown-inner {
          position: relative;
          min-width: 230px;
          background: linear-gradient(180deg, rgba(22,28,37,0.97), rgba(13,17,23,0.97));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.55);
          transform: translateY(-6px) scale(0.97);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        .nav-dropdown-parent:hover .nav-dropdown-inner {
          transform: translateY(0) scale(1);
        }
        .nav-dropdown-inner::before {
          content: '';
          position: absolute;
          top: 0; left: 14px; right: 14px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(74,127,165,0.6), rgba(232,168,48,0.6), transparent);
        }
        .nav-dropdown-inner::after {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 10px;
          height: 10px;
          background: rgb(22,28,37);
          border-left: 1px solid rgba(255,255,255,0.08);
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .nav-dropdown-label {
          color: rgba(245,247,249,0.32);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 8px 10px 6px;
        }
        .nav-dropdown-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(245,247,249,0.7);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 10px;
          border-radius: 10px;
          transition: color 0.18s ease, background 0.18s ease, padding-left 0.18s ease;
        }
        .nav-dropdown-icon {
          display: flex;
          color: #4a7fa5;
          flex-shrink: 0;
          transition: transform 0.18s ease;
        }
        .nav-dropdown-item:hover {
          color: #f5f7f9;
          background: rgba(255,255,255,0.06);
          padding-left: 14px;
        }
        .nav-dropdown-item:hover .nav-dropdown-icon { transform: scale(1.15); }

        .nav-dropdown-viewall {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          padding: 10px 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          color: #e8a830;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .nav-dropdown-viewall svg { transition: transform 0.18s ease; }
        .nav-dropdown-viewall:hover svg { transform: translateX(3px); }
      `}</style>
    </>
  );
}
