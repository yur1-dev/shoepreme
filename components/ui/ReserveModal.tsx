"use client";

import { useState } from "react";

interface ReserveModalProps {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  onClose: () => void;
}

export default function ReserveModal({
  variantId,
  productTitle,
  variantTitle,
  onClose,
}: ReserveModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          variantId,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#f5f7f9",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        {success ? (
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#f5f7f9",
                marginBottom: "8px",
              }}
            >
              Reserved
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,247,249,0.6)",
                lineHeight: 1.6,
              }}
            >
              We'll confirm availability for {productTitle} ({variantTitle}) and
              send you a secure payment link by email once stock is confirmed.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: "20px",
                width: "100%",
                background: "#e8a830",
                color: "#06090e",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#f5f7f9",
                marginBottom: "4px",
              }}
            >
              Reserve This Item
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,247,249,0.5)",
                marginBottom: "4px",
              }}
            >
              {productTitle} — {variantTitle}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(245,247,249,0.3)",
                marginBottom: "20px",
              }}
            >
              Sourced from abroad. No payment now — we'll confirm stock and send
              you a payment link.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <input
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ ...inputStyle, width: "50%" }}
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ ...inputStyle, width: "50%" }}
                />
              </div>
              <input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>

            {error && (
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#f87171",
                }}
              >
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(245,247,249,0.6)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#e8a830",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#06090e",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Reserving..." : "Reserve Now"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
