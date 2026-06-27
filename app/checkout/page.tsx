"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

type PaymentMethod = "gcash" | "maya" | "card" | "qrph";

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("gcash");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zip: "",
  });

  const lines = cart?.lines?.edges?.map((e) => e.node) ?? [];
  const total = parseFloat(cart?.cost?.totalAmount?.amount ?? "0");
  const currency = cart?.cost?.totalAmount?.currencyCode ?? "PHP";

  function formatPrice(amount: number) {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
  }

  async function handleSubmit() {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.phone ||
      !form.address
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/paymongo/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency,
          method,
          description: `Shoepreme Order - ${lines.map((l) => l.merchandise.product.title).join(", ")}`,
          billing: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
            address: {
              line1: form.address,
              city: form.city,
              state: form.province,
              postal_code: form.zip,
              country: "PH",
            },
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Payment failed. Please try again.");
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.status === "succeeded") {
        router.push("/checkout/success");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: "gcash", label: "GCash", icon: "💚" },
    { key: "maya", label: "Maya", icon: "💚" },
    { key: "qrph", label: "QR Ph", icon: "📱" },
    { key: "card", label: "Card", icon: "💳" },
  ];

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "11px 14px",
    color: "#f5f7f9",
    fontFamily: "monospace",
    fontSize: "11px",
    letterSpacing: "0.04em",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontFamily: "monospace",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "rgba(245,247,249,0.3)",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117" }}>
      <Navbar />
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "100px 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* ── Left: Form ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Contact */}
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                margin: "0 0 16px",
              }}
            >
              Contact Information
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  style={inputStyle}
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  placeholder="Marc"
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  style={inputStyle}
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  placeholder="Esber"
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="marc@email.com"
                />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+639123456789"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                margin: "0 0 16px",
              }}
            >
              Shipping Address
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label style={labelStyle}>Address *</label>
                <input
                  style={inputStyle}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="123 Rizal St., Brgy. Poblacion"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    style={inputStyle}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Koronadal"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Province</label>
                  <input
                    style={inputStyle}
                    value={form.province}
                    onChange={(e) =>
                      setForm({ ...form, province: e.target.value })
                    }
                    placeholder="South Cotabato"
                  />
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input
                    style={inputStyle}
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    placeholder="9506"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.3)",
                margin: "0 0 16px",
              }}
            >
              Payment Method
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px",
              }}
            >
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  style={{
                    padding: "14px 8px",
                    background:
                      method === m.key
                        ? "rgba(232,168,48,0.08)"
                        : "rgba(255,255,255,0.02)",
                    border: `1px solid ${method === m.key ? "rgba(232,168,48,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{m.icon}</span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color:
                        method === m.key ? "#e8a830" : "rgba(245,247,249,0.4)",
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "#f87171",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: "8px",
                padding: "12px 16px",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: loading ? "rgba(232,168,48,0.4)" : "#e8a830",
              border: "none",
              borderRadius: "12px",
              color: "#0d1117",
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : `Pay ${formatPrice(total)}`}
          </button>
        </div>

        {/* ── Right: Order Summary ── */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "24px",
            position: "sticky",
            top: "100px",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.3)",
              margin: "0 0 16px",
            }}
          >
            Order Summary
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {lines.map((line) => {
              const img =
                line.merchandise.product.images?.edges?.[0]?.node?.url;
              return (
                <div
                  key={line.id}
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      background: "rgba(74,127,165,0.1)",
                      border: "1px solid rgba(74,127,165,0.2)",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {img && (
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#f5f7f9",
                        margin: "0 0 2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {line.merchandise.product.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "9px",
                        color: "rgba(245,247,249,0.35)",
                        margin: 0,
                      }}
                    >
                      {line.merchandise.selectedOptions
                        .map((o) => o.value)
                        .join(" · ")}{" "}
                      × {line.quantity}
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1rem",
                      color: "#e8a830",
                      margin: 0,
                      flexShrink: 0,
                    }}
                  >
                    {formatPrice(parseFloat(line.cost.totalAmount.amount))}
                  </p>
                </div>
              );
            })}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.35)",
                }}
              >
                Subtotal
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.6)",
                }}
              >
                {formatPrice(
                  parseFloat(cart?.cost?.subtotalAmount?.amount ?? "0"),
                )}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.35)",
                }}
              >
                Shipping
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "rgba(245,247,249,0.6)",
                }}
              >
                Calculated at next step
              </span>
            </div>
            <div
              style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.5)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "1.6rem",
                  color: "#e8a830",
                }}
              >
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
