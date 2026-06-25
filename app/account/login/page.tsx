"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const [isPending, setIsPending] = useState(false);

  async function handleContinue() {
    setIsPending(true);
    await signIn("shopify", { callbackUrl });
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding: "clamp(24px, 5vw, 36px)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: "10px",
          color: "rgba(245,247,249,0.4)",
          letterSpacing: "0.04em",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        We'll send you to a secure Shopify sign-in page — enter a code or use
        Google, whichever's faster.
      </p>

      <button
        onClick={handleContinue}
        disabled={isPending}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: isPending ? "rgba(232,168,48,0.5)" : "#e8a830",
          color: "#0d1117",
          fontFamily: "monospace",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          padding: "14px 24px",
          borderRadius: "8px",
          border: "none",
          cursor: isPending ? "not-allowed" : "pointer",
          width: "100%",
        }}
      >
        {isPending ? "Redirecting..." : "Continue"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0d1117" }}>
      <Navbar />
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(120px, 15vw, 160px) 24px 80px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,168,48,0.1) 0%, transparent 65%)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                marginBottom: "10px",
              }}
            >
              Shoepreme Account
            </p>
            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(2.8rem, 8vw, 4rem)",
                letterSpacing: "0.04em",
                color: "#f5f7f9",
                lineHeight: 0.95,
                margin: 0,
              }}
            >
              Sign <span style={{ color: "#e8a830" }}>In.</span>
            </h1>
          </div>

          <Suspense fallback={<div style={{ height: "120px" }} />}>
            <LoginForm />
          </Suspense>

          <p
            style={{
              textAlign: "center",
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(245,247,249,0.28)",
              letterSpacing: "0.06em",
            }}
          >
            No account yet?{" "}
            <Link
              href="/account/signup"
              style={{ color: "#e8a830", textDecoration: "none" }}
            >
              Create one →
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
