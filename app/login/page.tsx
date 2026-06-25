"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await signIn("shopify", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Incorrect email or password. Try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
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
        {/* Glow */}
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
          {/* Header */}
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

          {/* Card */}
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
            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#f87171",
                  letterSpacing: "0.04em",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Email */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(245,247,249,0.35)",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "13px 16px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#f5f7f9",
                    letterSpacing: "0.04em",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "rgba(232,168,48,0.5)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
              </div>

              {/* Password */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(245,247,249,0.35)",
                    }}
                  >
                    Password
                  </label>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "8px",
                      color: "#e8a830",
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "13px 44px 13px 16px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#f5f7f9",
                      letterSpacing: "0.04em",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(232,168,48,0.5)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(245,247,249,0.25)",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    {showPw ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isPending || !email || !password}
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
                transition: "opacity 0.15s",
              }}
            >
              {isPending ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Footer link */}
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
              href="/account/register"
              style={{ color: "#e8a830", textDecoration: "none" }}
            >
              Create one →
            </Link>
          </p>
        </div>
      </section>

      {/* Spinner keyframe — scoped inline since no style tags allowed in rest of app but this is auth-specific */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </main>
  );
}
