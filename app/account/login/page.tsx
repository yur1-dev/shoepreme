"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function AppealModal({
  onClose,
  initialEmail = "",
}: {
  onClose: () => void;
  initialEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim() || !message.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account-api/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to submit appeal.");
      }
    } catch {
      setError("Failed to submit appeal.");
    } finally {
      setSubmitting(false);
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
        {submitted ? (
          <>
            <h3
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                color: "#4ade80",
                margin: "0 0 10px",
              }}
            >
              Appeal Submitted
            </h3>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: "rgba(245,247,249,0.5)",
                lineHeight: 1.7,
                margin: "0 0 20px",
              }}
            >
              We've received your appeal and will review it shortly.
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                width: "100%",
                padding: 12,
                background: "#e8a830",
                border: "none",
                borderRadius: 8,
                color: "#0d1117",
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <h3
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.4rem",
                color: "#f5f7f9",
                margin: "0 0 6px",
              }}
            >
              Appeal Disabled Account
            </h3>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: "rgba(245,247,249,0.4)",
                lineHeight: 1.6,
                margin: "0 0 18px",
              }}
            >
              Tell us why you believe this was a mistake.
            </p>
            {error && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "#f87171",
                  margin: "0 0 12px",
                }}
              >
                {error}
              </p>
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your account email"
              readOnly={!!initialEmail}
              style={{
                width: "100%",
                background: initialEmail
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 12px",
                color: initialEmail ? "rgba(245,247,249,0.5)" : "#f5f7f9",
                fontFamily: "monospace",
                fontSize: 11,
                outline: "none",
                marginBottom: 10,
                boxSizing: "border-box",
                cursor: initialEmail ? "not-allowed" : "text",
              }}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain your situation..."
              rows={4}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#f5f7f9",
                fontFamily: "monospace",
                fontSize: 11,
                outline: "none",
                marginBottom: 16,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                disabled={submitting}
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
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: 12,
                  background: "#e8a830",
                  border: "none",
                  borderRadius: 8,
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting…" : "Submit Appeal"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const error = searchParams.get("error");
  const disableReason = searchParams.get("reason");
  const prefillEmail = searchParams.get("email") || "";
  const [isPending, setIsPending] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);

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
      {error === "AccountDisabled" && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
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
                color: "#f87171",
                letterSpacing: "0.02em",
                lineHeight: 1.5,
              }}
            >
              Your account has been disabled.
            </span>
          </div>
        </div>
      )}

      {showAppeal && (
        <AppealModal
          onClose={() => setShowAppeal(false)}
          initialEmail={prefillEmail}
        />
      )}

      {error === "AccountDisabled" ? (
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
          {disableReason
            ? `Reason: ${decodeURIComponent(disableReason)}`
            : "No reason was provided. You can submit an appeal below."}
        </p>
      ) : (
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
      )}

      {error === "AccountDisabled" ? (
        <button
          onClick={() => setShowAppeal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "#e8a830",
            color: "#0d1117",
            fontFamily: "monospace",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            padding: "14px 24px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Submit an Appeal
        </button>
      ) : (
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
      )}
    </div>
  );
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/account");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return <main style={{ minHeight: "100vh", background: "#0d1117" }} />;
  }

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
