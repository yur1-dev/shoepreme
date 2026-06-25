"use client";
// components/account/SignOutButton.tsx
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => {
        window.location.href = "/api/auth/shopify-logout";
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        background: "rgba(248,113,113,0.06)",
        border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: "8px",
        padding: "10px 16px",
        color: "#f87171",
        fontFamily: "monospace",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(248,113,113,0.12)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(248,113,113,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(248,113,113,0.06)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(248,113,113,0.2)";
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign Out
    </button>
  );
}
