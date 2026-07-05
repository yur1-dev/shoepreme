"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  title: string;
  handle: string;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  compareAtPriceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: { edges: { node: { id: string; availableForSale: boolean } }[] };
  tags?: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();

  const image = product.images.edges[0]?.node;
  const secondImage = product.images.edges[1]?.node;
  const firstVariant = product.variants.edges[0]?.node;
  const isAvailable = product.variants.edges.some((e) => e.node.availableForSale);
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const comparePrice = product.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
    : null;
  const isOnSale = comparePrice !== null && comparePrice > price;

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!firstVariant?.id || !isAvailable || adding) return;
    setAdding(true);
    try {
      await addToCart(firstVariant.id, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link
      href={`/products/${product.handle}`}
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image box */}
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          background: "#0d1520",
          aspectRatio: "1",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Badges */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {!isAvailable && (
            <span
              style={{
                background: "rgba(13,17,23,0.9)",
                color: "rgba(245,247,249,0.5)",
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "4px 9px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              Sold Out
            </span>
          )}
          {isOnSale && isAvailable && (
            <span
              style={{
                background: "#e8a830",
                color: "#06090e",
                fontSize: "8px",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "4px 9px",
                borderRadius: "4px",
              }}
            >
              Sale
            </span>
          )}
        </div>

        {/* Image with swap on hover */}
        {image ? (
          <>
            <img
              src={image.url}
              alt={image.altText ?? product.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transform: hovered ? "scale(1.07)" : "scale(1)",
                opacity: hovered && secondImage ? 0 : 1,
                transition:
                  "transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
              }}
            />
            {secondImage && (
              <img
                src={secondImage.url}
                alt={image.altText ?? product.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform: hovered ? "scale(1.07)" : "scale(1.02)",
                  opacity: hovered ? 1 : 0,
                  transition:
                    "transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
                }}
              />
            )}
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "rgba(245,247,249,0.15)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              No image
            </span>
          </div>
        )}

        {/* Gradient overlay + quick add */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hovered
              ? "linear-gradient(to top, rgba(6,9,14,0.88) 0%, transparent 55%)"
              : "linear-gradient(to top, rgba(6,9,14,0.4) 0%, transparent 55%)",
            transition: "background 0.3s ease",
            zIndex: 2,
          }}
        />

        {isAvailable && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "10px",
              zIndex: 3,
              transform: hovered ? "translateY(0)" : "translateY(110%)",
              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <button
              onClick={handleQuickAdd}
              style={{
                width: "100%",
                background: adding ? "rgba(232,168,48,0.6)" : "#e8a830",
                color: "#06090e",
                border: "none",
                padding: "11px",
                borderRadius: "7px",
                fontSize: "10px",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: adding ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s ease",
              }}
            >
              {adding ? "Adding…" : "Quick Add"}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ marginTop: "10px", padding: "0 2px" }}>
        <h3
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "1.05rem",
            letterSpacing: "0.05em",
            color: hovered ? "#f5f7f9" : "rgba(245,247,249,0.75)",
            lineHeight: 1.2,
            marginBottom: "5px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s ease",
          }}
        >
          {product.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {price > 0 && (
            <span
              style={{
                color: isOnSale ? "#e8a830" : "rgba(245,247,249,0.55)",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "0.02em",
              }}
            >
              ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </span>
          )}
          {isOnSale && (
            <span
              style={{
                color: "rgba(245,247,249,0.25)",
                fontSize: "11px",
                textDecoration: "line-through",
              }}
            >
              ₱
              {comparePrice!.toLocaleString("en-PH", {
                minimumFractionDigits: 0,
              })}
            </span>
          )}
          {!isAvailable && (
            <span
              style={{
                color: "rgba(245,247,249,0.2)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginLeft: "auto",
              }}
            >
              Sold out
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
