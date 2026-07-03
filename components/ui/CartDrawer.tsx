"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { cart, isOpen, closeCart, removeFromCart, updateQuantity, checkout } =
    useCart();
  const [loadingLines, setLoadingLines] = useState<Record<string, boolean>>({});

  async function handleUpdate(lineId: string, qty: number) {
    setLoadingLines((p) => ({ ...p, [lineId]: true }));
    try {
      if (qty < 1) await removeFromCart(lineId);
      else await updateQuantity(lineId, qty);
    } finally {
      setLoadingLines((p) => ({ ...p, [lineId]: false }));
    }
  }

  const lines = cart?.lines?.edges?.map((e) => e.node) ?? [];
  const total = cart?.cost?.totalAmount;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "420px",
          background: "#141c28",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.6rem",
                letterSpacing: "0.08em",
                color: "#f5f7f9",
              }}
            >
              YOUR BAG
            </span>
            {(cart?.totalQuantity ?? 0) > 0 && (
              <span
                style={{
                  marginLeft: "10px",
                  background: "#4a7fa5",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {cart?.totalQuantity}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "#8896a7",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ×
          </button>
        </div>

        {/* Lines */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {lines.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "12px",
                color: "#8896a7",
              }}
            >
              <svg
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p style={{ fontSize: "14px", letterSpacing: "0.05em" }}>
                Your bag is empty
              </p>
              <button
                onClick={() => {
                  closeCart();
                  window.location.href = "/products";
                }}
                style={{
                  marginTop: "8px",
                  background: "#4a7fa5",
                  color: "#fff",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {lines.map((line) => {
                const img = line.merchandise.product.images.edges[0]?.node;
                const price = parseFloat(line.merchandise.price.amount);
                return (
                  <div
                    key={line.id}
                    style={{
                      display: "flex",
                      gap: "14px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "12px",
                      padding: "12px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Link
                      href={`/products/${line.merchandise.product.handle}`}
                      onClick={closeCart}
                      style={{ flexShrink: 0, display: "block" }}
                    >
                      {img && (
                        <img
                          src={img.url}
                          alt={img.altText ?? ""}
                          style={{
                            width: "72px",
                            height: "72px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            background: "#1a2332",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/products/${line.merchandise.product.handle}`}
                        onClick={closeCart}
                        style={{ textDecoration: "none" }}
                      >
                        <p
                          style={{
                            fontFamily: "Bebas Neue, sans-serif",
                            fontSize: "1rem",
                            letterSpacing: "0.05em",
                            color: "#f5f7f9",
                            lineHeight: 1.2,
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {line.merchandise.product.title}
                        </p>
                      </Link>
                      {line.merchandise.selectedOptions.map((opt) => (
                        <p
                          key={opt.name}
                          style={{ fontSize: "11px", color: "#8896a7" }}
                        >
                          {opt.name}: {opt.value}
                        </p>
                      ))}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "10px",
                        }}
                      >
                        {/* Qty stepper */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <button
                            onClick={() =>
                              handleUpdate(line.id, line.quantity - 1)
                            }
                            disabled={!!loadingLines[line.id]}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "6px 0 0 6px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRight: "none",
                              background: "rgba(255,255,255,0.04)",
                              color: loadingLines[line.id]
                                ? "rgba(245,247,249,0.2)"
                                : "rgba(245,247,249,0.6)",
                              fontSize: "14px",
                              cursor: loadingLines[line.id]
                                ? "not-allowed"
                                : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1,
                              transition: "color 0.15s",
                            }}
                          >
                            {loadingLines[line.id] ? (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3}
                                style={{
                                  animation: "spin 0.6s linear infinite",
                                }}
                              >
                                <path
                                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                                  strokeLinecap="round"
                                />
                              </svg>
                            ) : line.quantity === 1 ? (
                              "×"
                            ) : (
                              "−"
                            )}
                          </button>
                          <div
                            style={{
                              width: "32px",
                              height: "26px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "rgba(255,255,255,0.04)",
                              color: "rgba(245,247,249,0.9)",
                              fontSize: "12px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {line.quantity}
                          </div>
                          <button
                            onClick={() =>
                              handleUpdate(line.id, line.quantity + 1)
                            }
                            disabled={!!loadingLines[line.id]}
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "0 6px 6px 0",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderLeft: "none",
                              background: "rgba(255,255,255,0.04)",
                              color: loadingLines[line.id]
                                ? "rgba(245,247,249,0.2)"
                                : "rgba(245,247,249,0.6)",
                              fontSize: "14px",
                              cursor: loadingLines[line.id]
                                ? "not-allowed"
                                : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1,
                              transition: "color 0.15s",
                            }}
                          >
                            +
                          </button>
                        </div>
                        <span
                          style={{
                            color: "#4a7fa5",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          ₱
                          {(price * line.quantity).toLocaleString("en-PH", {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <span style={{ color: "#8896a7", fontSize: "13px" }}>
                Subtotal
              </span>
              <span
                style={{ color: "#f5f7f9", fontWeight: 700, fontSize: "15px" }}
              >
                {total &&
                  `₱${parseFloat(total.amount).toLocaleString("en-PH", { minimumFractionDigits: 0 })}`}
              </span>
            </div>
            <button
              onClick={checkout}
              style={{
                width: "100%",
                background: "#e8a830",
                color: "#0d1117",
                border: "none",
                padding: "16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Checkout
            </button>
            <p
              style={{
                textAlign: "center",
                color: "#8896a7",
                fontSize: "11px",
                marginTop: "10px",
              }}
            >
              Free shipping on orders over ₱5,000
            </p>
          </div>
        )}
      </div>
    </>
  );
}
