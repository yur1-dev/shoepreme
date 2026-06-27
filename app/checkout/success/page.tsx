import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function CheckoutSuccess() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117" }}>
      <Navbar />
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          padding: "140px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(74,222,128,0.1)",
            border: "2px solid rgba(74,222,128,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(245,247,249,0.3)",
            margin: "0 0 8px",
          }}
        >
          Payment Confirmed
        </p>
        <h1
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "3rem",
            letterSpacing: "0.04em",
            color: "#f5f7f9",
            margin: "0 0 12px",
          }}
        >
          Thank You!
        </h1>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "rgba(245,247,249,0.4)",
            letterSpacing: "0.04em",
            lineHeight: 1.7,
            margin: "0 0 32px",
          }}
        >
          Your order has been confirmed and is being processed. You'll receive a
          confirmation email shortly.
        </p>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "#e8a830",
            borderRadius: "10px",
            color: "#0d1117",
            fontFamily: "monospace",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
