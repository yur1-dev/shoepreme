"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import ReserveModal from "@/components/ui/ReserveModal";

interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

interface Option {
  id: string;
  name: string;
  values: string[];
}

export default function AddToCartSection({
  variants,
  options,
  productTitle,
  customerEmail,
  customerName,
}: {
  variants: Variant[];
  options: Option[];
  productTitle: string;
  customerEmail?: string;
  customerName?: string;
}) {
  const { addToCart, isLoading, checkout } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(Object.fromEntries(options.map((o) => [o.name, o.values[0]])));
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [showReserve, setShowReserve] = useState(false);

  // Find matching variant for selected options
  const selectedVariant =
    variants.find((v) =>
      v.selectedOptions.every((opt) => selectedOptions[opt.name] === opt.value),
    ) ?? variants[0];

  const isAvailable = selectedVariant?.availableForSale ?? false;
  const maxQty = selectedVariant?.quantityAvailable ?? 1;

  function selectOption(name: string, value: string) {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
    setAdded(false);
    setQuantity(1);
  }

  async function handleAddToCart() {
    if (!selectedVariant?.id || !isAvailable || adding) return;
    setAdding(true);
    try {
      await addToCart(selectedVariant.id, quantity);
      setAdded(true);
      setQuantity(1);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      {/* Variant options */}
      {options.map((option) => (
        <div key={option.id} style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.35)",
              marginBottom: "12px",
            }}
          >
            {option.name}:{" "}
            <span style={{ color: "#e8a830" }}>
              {selectedOptions[option.name]}
            </span>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              const hasAvailable = variants.some(
                (v) =>
                  v.selectedOptions.find((o) => o.name === option.name)
                    ?.value === value && v.availableForSale,
              );
              return (
                <button
                  key={value}
                  onClick={() => selectOption(option.name, value)}
                  disabled={!hasAvailable}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    border: isSelected
                      ? "1.5px solid #e8a830"
                      : "1.5px solid rgba(255,255,255,0.1)",
                    background: isSelected
                      ? "rgba(232,168,48,0.1)"
                      : "rgba(255,255,255,0.04)",
                    color: isSelected
                      ? "#e8a830"
                      : hasAvailable
                        ? "rgba(245,247,249,0.7)"
                        : "rgba(245,247,249,0.2)",
                    fontSize: "12px",
                    fontWeight: isSelected ? 800 : 500,
                    cursor: hasAvailable ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    textDecoration: !hasAvailable ? "line-through" : "none",
                    opacity: !hasAvailable ? 0.4 : 1,
                    transition: "all 0.15s ease",
                    letterSpacing: "0.04em",
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(245,247,249,0.35)",
            marginRight: "16px",
          }}
        >
          Quantity
        </p>
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px 0 0 8px",
            border: "1.5px solid rgba(255,255,255,0.1)",
            borderRight: "none",
            background: "rgba(255,255,255,0.04)",
            color:
              quantity <= 1 ? "rgba(245,247,249,0.2)" : "rgba(245,247,249,0.7)",
            fontSize: "16px",
            cursor: quantity <= 1 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <div
          style={{
            width: "44px",
            height: "36px",
            border: "1.5px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(245,247,249,0.9)",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}
        >
          {quantity}
        </div>
        <button
          onClick={() => setQuantity((q) => Math.min(q + 1, maxQty))}
          disabled={quantity >= maxQty}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "0 8px 8px 0",
            border: "1.5px solid rgba(255,255,255,0.1)",
            borderLeft: "none",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(245,247,249,0.7)",
            fontSize: "16px",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>

      {isAvailable && maxQty <= 3 && (
        <p
          style={{
            fontSize: "11px",
            color: "#e8a830",
            letterSpacing: "0.06em",
            marginBottom: "10px",
          }}
        >
          Only {maxQty} left in stock
        </p>
      )}

      {/* Add to cart */}
      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
        <button
          onClick={async () => {
            if (!selectedVariant?.id) return;
            if (!isAvailable) {
              setShowReserve(true);
              return;
            }
            if (buyingNow) return;
            setBuyingNow(true);
            try {
              await addToCart(selectedVariant.id, quantity);
              checkout();
            } finally {
              setBuyingNow(false);
            }
          }}
          disabled={buyingNow || isLoading}
          style={{
            flex: 1,
            background: "#e8a830",
            color: "#06090e",
            border: "none",
            padding: "17px 32px",
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: !buyingNow && !isLoading ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
        >
          {!isAvailable
            ? "Reserve — Pay Once Confirmed"
            : buyingNow
              ? "Checking Out…"
              : "Buy Now"}
        </button>

        <button
          onClick={() => {
            if (!isAvailable) {
              setShowReserve(true);
              return;
            }
            handleAddToCart();
          }}
          disabled={adding || isLoading}
          style={{
            flex: 1,
            minWidth: 0,
            background: added
              ? "rgba(34,197,94,0.15)"
              : isAvailable
                ? "#f5f7f9"
                : "rgba(255,255,255,0.06)",
            color: added
              ? "#22c55e"
              : isAvailable
                ? "#06090e"
                : "rgba(245,247,249,0.7)",
            border: added ? "1px solid rgba(34,197,94,0.3)" : "none",
            padding: "17px 32px",
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: !adding && !isLoading ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
        >
          {!isAvailable
            ? "Reserve"
            : added
              ? "✓ Added to Bag"
              : adding
                ? "Adding…"
                : "Add to Bag"}
        </button>

        <a
          href="https://m.me/shoepreme"
          target="_blank"
          rel="noopener noreferrer"
          title="Message us on Messenger"
          style={{
            padding: "17px 20px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#4a7fa5",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            flexShrink: 0,
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.929 1.453 5.546 3.731 7.255V22l3.405-1.869c.909.252 1.871.388 2.864.388 5.523 0 10-4.145 10-9.276C22 6.145 17.523 2 12 2zm1.008 12.5l-2.548-2.717-4.97 2.717 5.467-5.804 2.61 2.717 4.908-2.717-5.467 5.804z" />
          </svg>
        </a>
      </div>

      {!isAvailable && (
        <p
          style={{
            marginTop: "12px",
            color: "rgba(245,247,249,0.3)",
            fontSize: "12px",
            letterSpacing: "0.04em",
          }}
        >
          Sourced from abroad — reserve now, no payment required until we
          confirm stock.
        </p>
      )}

      {showReserve && selectedVariant && (
        <ReserveModal
          variantId={selectedVariant.id}
          productTitle={productTitle}
          variantTitle={selectedVariant.title}
          customerEmail={customerEmail}
          customerName={customerName}
          onClose={() => setShowReserve(false)}
        />
      )}
    </div>
  );
}
