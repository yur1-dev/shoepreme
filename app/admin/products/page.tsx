"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  useToast,
  Toast,
  StatCard,
  FilterTabs,
  SearchInput,
  StatusPill,
  Spinner,
  EmptyState,
  ActionButton,
  FieldLabel,
  TextInput,
  TextArea,
} from "@/lib/admin-ui";

function formatPrice(amount: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(parseFloat(amount));
}

type FilterVal = "ALL" | "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";

interface DraftProduct {
  title: string;
  productType: string;
  descriptionHtml: string;
  status: string;
  price: string;
  variantId?: string;
  imageId?: string;
  sizes: string[];
  sizeInput: string;
  stockEdits: Record<
    string,
    {
      inventoryItemId: string;
      current: number;
      newQty: string;
      price: string;
      variantId: string;
    }
  >;
  newVariantPrice?: string;
  newVariantQty?: string;
}

type ModalState =
  | null
  | { mode: "edit"; product: any; draft: DraftProduct }
  | { mode: "new"; draft: DraftProduct };

function emptyDraft(): DraftProduct {
  return {
    title: "",
    productType: "",
    descriptionHtml: "",
    status: "ACTIVE",
    price: "",
    variantId: undefined,
    imageId: undefined,
    sizes: [],
    sizeInput: "",
    stockEdits: {},
  };
}

function draftFromProduct(product: any): DraftProduct {
  const firstVariant = product.variants?.edges?.[0]?.node;
  const sizes = (product.variants?.edges ?? [])
    .map(
      (e: any) =>
        e.node.selectedOptions?.find((o: any) => o.name === "Size")?.value ??
        e.node.title,
    )
    .filter((t: string) => t && t !== "Default Title");
  const stockEdits: DraftProduct["stockEdits"] = {};
  (product.variants?.edges ?? []).forEach((e: any) => {
    const v = e.node;
    const label =
      v.selectedOptions?.find((o: any) => o.name === "Size")?.value ?? v.title;
    if (label && label !== "Default Title") {
      stockEdits[label] = {
        inventoryItemId: v.inventoryItem?.id,
        current: v.inventoryQuantity ?? 0,
        newQty: String(v.inventoryQuantity ?? 0),
        price: v.price,
        variantId: v.id,
      };
    }
  });
  return {
    title: product.title,
    productType: product.productType ?? "",
    descriptionHtml: product.descriptionHtml?.replace(/<[^>]+>/g, "") ?? "",
    status: product.status,
    price: firstVariant?.price ?? "0.00",
    variantId: firstVariant?.id,
    imageId: product.featuredImage?.id,
    sizes,
    sizeInput: "",
    stockEdits,
  };
}

// ─── Product Modal ─────────────────────────────────────────────────────────

function ProductModal({
  modal,
  onClose,
  onSaved,
  showToast,
}: {
  modal: Exclude<ModalState, null>;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [draft, setDraft] = useState<DraftProduct>(modal.draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sizeRef = useRef<HTMLInputElement>(null);
  const isEdit = modal.mode === "edit";
  const product = isEdit ? (modal as any).product : null;
  const oos = product ? product.totalInventory === 0 : false;

  function upd(key: keyof DraftProduct, value: any) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  function addSize() {
    const v = draft.sizeInput.trim();
    if (!v || draft.sizes.includes(v)) {
      upd("sizeInput", "");
      return;
    }
    upd("sizes", [...draft.sizes, v]);
    upd("sizeInput", "");
    sizeRef.current?.focus();
  }

  async function handleImageUpload(file: File) {
    if (!product) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", product.id);
      if (draft.imageId) fd.append("oldMediaId", draft.imageId);
      const res = await fetch("/api/admin/upload-product-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) {
        showToast("Image upload failed: " + data.error, false);
        return;
      }
      showToast("Image updated ✓");
      onSaved();
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!draft.title.trim()) {
      showToast("Name is required", false);
      return;
    }
    if (!draft.price || isNaN(parseFloat(draft.price))) {
      showToast("Valid price is required", false);
      return;
    }
    setSaving(true);
    try {
      if (isEdit && product) {
        const r1 = await fetch("/api/admin/update-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: product.id,
            title: draft.title,
            descriptionHtml: draft.descriptionHtml
              ? `<p>${draft.descriptionHtml}</p>`
              : "",
            status: draft.status,
            productType: draft.productType,
          }),
        });
        const d1 = await r1.json();
        if (!d1.success) {
          showToast("Update failed: " + d1.error, false);
          return;
        }

        if (draft.variantId) {
          const r2 = await fetch("/api/admin/update-variant-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantId: draft.variantId,
              price: draft.price,
            }),
          });
          const d2 = await r2.json();
          if (!d2.success) {
            showToast("Price update failed: " + d2.error, false);
            return;
          }
        }
        // Save stock edits
        const stockEntries = Object.entries(draft.stockEdits ?? {});
        for (const [, entry] of stockEntries) {
          const newQty = parseInt(entry.newQty);
          if (!isNaN(newQty) && entry.inventoryItemId) {
            const delta = newQty - entry.current;
            if (delta !== 0) {
              await fetch("/api/admin/update-inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  inventoryItemId: entry.inventoryItemId,
                  quantity: delta,
                }),
              });
            }
          }
          if (entry.variantId && entry.price) {
            await fetch("/api/admin/update-variant-price", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                variantId: entry.variantId,
                price: entry.price,
              }),
            });
          }
        }
        showToast("Product saved ✓");
      } else {
        const res = await fetch("/api/admin/create-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title,
            productType: draft.productType,
            descriptionHtml: draft.descriptionHtml
              ? `<p>${draft.descriptionHtml}</p>`
              : "",
            status: draft.status,
            price: draft.price,
            sizes: draft.sizes,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          showToast("Create failed: " + data.error, false);
          return;
        }
        showToast("Product created ✓");
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
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
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#0f131c",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 28px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            top: 0,
            background: "#0f131c",
            zIndex: 1,
            borderRadius: "18px 18px 0 0",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(240,244,248,0.25)",
                margin: "0 0 3px",
              }}
            >
              {isEdit ? "Edit Product" : "New Product"}
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.5rem",
                letterSpacing: "0.04em",
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              {draft.title || (isEdit ? "—" : "New Shoe")}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(240,244,248,0.5)",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
        {/* Body */}
        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Images — edit only */}
          {isEdit && (
            <div>
              <FieldLabel>Product Images</FieldLabel>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {(product.media?.edges ?? []).map(
                  (e: any, i: number) =>
                    e.node?.image?.url && (
                      <div
                        key={i}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.08)",
                          flexShrink: 0,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.node.image.url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ),
                )}
              </div>
              <FieldLabel>Replace Featured Image</FieldLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  {product?.featuredImage?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.featuredImage.url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="modal-img"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  <label htmlFor="modal-img">
                    <span
                      style={{
                        display: "inline-block",
                        cursor: uploading ? "not-allowed" : "pointer",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontFamily: "monospace",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: uploading
                          ? "rgba(240,244,248,0.3)"
                          : "rgba(240,244,248,0.7)",
                      }}
                    >
                      {uploading ? "Uploading…" : "Replace Image"}
                    </span>
                  </label>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: 8,
                      color: "rgba(240,244,248,0.2)",
                      margin: "6px 0 0",
                      letterSpacing: "0.06em",
                    }}
                  >
                    JPG, PNG, WEBP · max ~4 MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vendor + Collections — edit only */}
          {isEdit &&
            (product?.vendor ||
              (product?.collections?.edges?.length ?? 0) > 0) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {product.vendor && (
                  <div>
                    <FieldLabel>Vendor</FieldLabel>
                    <p
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        color: "rgba(240,244,248,0.6)",
                        margin: 0,
                      }}
                    >
                      {product.vendor}
                    </p>
                  </div>
                )}
                {(product.collections?.edges?.length ?? 0) > 0 && (
                  <div>
                    <FieldLabel>Collections</FieldLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {product.collections.edges.map((e: any) => (
                        <span
                          key={e.node.id}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 5,
                            padding: "3px 8px",
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "rgba(240,244,248,0.5)",
                          }}
                        >
                          {e.node.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Name + Category */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <FieldLabel>Name *</FieldLabel>
              <TextInput
                value={draft.title}
                onChange={(v) => upd("title", v)}
                placeholder="e.g. Adidas Samba OG"
              />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <TextInput
                value={draft.productType}
                onChange={(v) => upd("productType", v)}
                placeholder="e.g. Sneakers, Running"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea
              value={draft.descriptionHtml}
              onChange={(v) => upd("descriptionHtml", v)}
              rows={3}
            />
          </div>

          {/* Price + Visibility */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <FieldLabel>Price (₱) *</FieldLabel>
              <TextInput
                value={draft.price}
                onChange={(v) => upd("price", v)}
                placeholder="0.00"
              />
              {isEdit && (
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    color: "rgba(240,244,248,0.2)",
                    margin: "5px 0 0",
                    letterSpacing: "0.05em",
                  }}
                >
                  Updates base / first variant
                </p>
              )}
            </div>
            <div>
              <FieldLabel>Visibility</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {(["ACTIVE", "DRAFT"] as const).map((s) => {
                  const active = draft.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => upd("status", s)}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontFamily: "monospace",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        transition: "all 0.14s",
                        border: active
                          ? s === "ACTIVE"
                            ? "1px solid rgba(74,222,128,0.45)"
                            : "1px solid rgba(240,244,248,0.18)"
                          : "1px solid rgba(255,255,255,0.07)",
                        background: active
                          ? s === "ACTIVE"
                            ? "rgba(74,222,128,0.11)"
                            : "rgba(255,255,255,0.05)"
                          : "transparent",
                        color: active
                          ? s === "ACTIVE"
                            ? "#4ade80"
                            : "rgba(240,244,248,0.6)"
                          : "rgba(240,244,248,0.22)",
                      }}
                    >
                      {s === "ACTIVE" ? "✓ Active" : "Draft"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <FieldLabel>
              {isEdit ? "Sizes (from Shopify)" : "Sizes (optional)"}
            </FieldLabel>

            {draft.sizes.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: isEdit ? 0 : 10,
                }}
              >
                {draft.sizes.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(232,168,48,0.09)",
                      border: "1px solid rgba(232,168,48,0.22)",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontFamily: "monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#e8a830",
                    }}
                  >
                    {s}
                    {!isEdit && (
                      <button
                        onClick={() =>
                          upd(
                            "sizes",
                            draft.sizes.filter((x) => x !== s),
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(232,168,48,0.55)",
                          cursor: "pointer",
                          fontSize: 13,
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {!isEdit && (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={sizeRef}
                  value={draft.sizeInput}
                  onChange={(e) => upd("sizeInput", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSize();
                    }
                  }}
                  placeholder="e.g. EU 40 — press Enter to add"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "9px 12px",
                    color: "#f0f4f8",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 12,
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(232,168,48,0.4)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.1)")
                  }
                />
                <button
                  onClick={addSize}
                  style={{
                    background: "rgba(232,168,48,0.1)",
                    border: "1px solid rgba(232,168,48,0.28)",
                    borderRadius: 8,
                    padding: "9px 18px",
                    color: "#e8a830",
                    fontFamily: "monospace",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {isEdit && draft.sizes.length === 0 && (
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "rgba(240,244,248,0.22)",
                  margin: 0,
                }}
              >
                Default variant · add sizes in Shopify admin
              </p>
            )}

            {isEdit && (
              <div style={{ marginTop: 10 }}>
                <FieldLabel>Add New Size</FieldLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 80px auto",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    value={draft.sizeInput}
                    onChange={(e) => upd("sizeInput", e.target.value)}
                    placeholder="e.g. EU 42"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#f0f4f8",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 12,
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(232,168,48,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.1)")
                    }
                  />
                  <input
                    value={draft.newVariantPrice ?? draft.price}
                    onChange={(e) =>
                      upd("newVariantPrice" as any, e.target.value)
                    }
                    placeholder="Price"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#f0f4f8",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: 12,
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(232,168,48,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.1)")
                    }
                  />
                  <input
                    value={draft.newVariantQty ?? "0"}
                    onChange={(e) =>
                      upd("newVariantQty" as any, e.target.value)
                    }
                    placeholder="Qty"
                    type="number"
                    min="0"
                    style={
                      {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "9px 12px",
                        color: "#f0f4f8",
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        outline: "none",
                        MozAppearance: "textfield",
                        appearance: "textfield",
                      } as React.CSSProperties
                    }
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(232,168,48,0.4)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.1)")
                    }
                  />
                  <button
                    onClick={async () => {
                      const size = draft.sizeInput.trim();
                      if (!size) return;
                      const price =
                        (draft as any).newVariantPrice || draft.price;
                      const qty = parseInt((draft as any).newVariantQty || "0");
                      const res = await fetch("/api/admin/add-variant", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          productId: product.id,
                          size,
                          price,
                          quantity: qty,
                        }),
                      });
                      const data = await res.json();
                      if (!data.success) {
                        showToast("Failed: " + data.error, false);
                        return;
                      }
                      showToast("Size added ✓");
                      upd("sizeInput", "");
                      onSaved();
                    }}
                    style={{
                      background: "rgba(232,168,48,0.1)",
                      border: "1px solid rgba(232,168,48,0.28)",
                      borderRadius: 8,
                      padding: "9px 16px",
                      color: "#e8a830",
                      fontFamily: "monospace",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add Size
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stock Editor */}
          {isEdit && Object.keys(draft.stockEdits ?? {}).length > 0 && (
            <div>
              <FieldLabel>Stock by Size</FieldLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(draft.stockEdits).map(([size, entry]) => (
                  <div
                    key={size}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 90px 36px 36px",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#e8a830",
                      }}
                    >
                      {size}
                    </span>
                    <input
                      value={entry.price}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          stockEdits: {
                            ...p.stockEdits,
                            [size]: {
                              ...p.stockEdits[size],
                              price: e.target.value,
                            },
                          },
                        }))
                      }
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        padding: "5px 8px",
                        color: "#f0f4f8",
                        fontFamily: "monospace",
                        fontSize: 12,
                        outline: "none",
                        width: "100%",
                        textAlign: "center",
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(232,168,48,0.4)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.1)")
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      value={entry.newQty}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          stockEdits: {
                            ...p.stockEdits,
                            [size]: {
                              ...p.stockEdits[size],
                              newQty: e.target.value,
                            },
                          },
                        }))
                      }
                      style={
                        {
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          padding: "5px 8px",
                          color: "#f0f4f8",
                          fontFamily: "monospace",
                          fontSize: 12,
                          outline: "none",
                          width: "100%",
                          textAlign: "center",
                          MozAppearance: "textfield",
                          appearance: "textfield",
                        } as React.CSSProperties
                      }
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(232,168,48,0.4)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.1)")
                      }
                    />
                    <button
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          stockEdits: {
                            ...p.stockEdits,
                            [size]: {
                              ...p.stockEdits[size],
                              newQty: String(
                                Math.max(
                                  0,
                                  parseInt(p.stockEdits[size].newQty || "0") -
                                    1,
                                ),
                              ),
                            },
                          },
                        }))
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        color: "#f87171",
                        fontSize: 16,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <button
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          stockEdits: {
                            ...p.stockEdits,
                            [size]: {
                              ...p.stockEdits[size],
                              newQty: String(
                                parseInt(p.stockEdits[size].newQty || "0") + 1,
                              ),
                            },
                          },
                        }))
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "rgba(74,222,128,0.1)",
                        border: "1px solid rgba(74,222,128,0.2)",
                        color: "#4ade80",
                        fontSize: 16,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory — edit only, read-only */}
          {isEdit && product && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,0.024)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(240,244,248,0.28)",
                    margin: "0 0 4px",
                  }}
                >
                  Total Inventory
                </p>
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.6rem",
                    color: oos ? "#f87171" : "#4ade80",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {product.totalInventory} units
                </p>
              </div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(240,244,248,0.18)",
                  margin: 0,
                  textAlign: "right",
                  lineHeight: 1.7,
                  letterSpacing: "0.05em",
                }}
              >
                Manage stock
                <br />
                in Shopify
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            padding: "16px 28px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            bottom: 0,
            background: "#0f131c",
            borderRadius: "0 0 18px 18px",
          }}
        >
          <ActionButton onClick={onClose} variant="ghost">
            Discard
          </ActionButton>
          <ActionButton onClick={handleSave} disabled={saving} variant="green">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [filter, setFilter] = useState<FilterVal>("ALL");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const outOfStock = products.filter((p) => p.totalInventory === 0);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "ACTIVE") list = list.filter((p) => p.status === "ACTIVE");
    if (filter === "DRAFT") list = list.filter((p) => p.status === "DRAFT");
    if (filter === "OUT_OF_STOCK")
      list = list.filter((p) => p.totalInventory === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.productType?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, filter, search]);

  return (
    <div style={{ padding: "32px 36px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(240,244,248,0.28)",
                margin: "0 0 4px",
              }}
            >
              Shoepreme
            </p>
            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "2.4rem",
                letterSpacing: "0.04em",
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              Products
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionButton onClick={fetchProducts} variant="ghost">
              ↻ Refresh
            </ActionButton>
            <ActionButton
              onClick={() => setModal({ mode: "new", draft: emptyDraft() })}
              variant="gold"
            >
              + New Product
            </ActionButton>
          </div>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Total Products"
            value={String(products.length)}
            sub="in catalog"
          />
          <StatCard
            label="Active"
            value={String(products.filter((p) => p.status === "ACTIVE").length)}
            color="#4ade80"
            sub="listed in store"
          />
          <StatCard
            label="Draft"
            value={String(products.filter((p) => p.status === "DRAFT").length)}
            sub="hidden from store"
          />
          <StatCard
            label="Out of Stock"
            value={String(outOfStock.length)}
            color={outOfStock.length > 0 ? "#f87171" : "#4ade80"}
            sub={outOfStock.length > 0 ? "needs restocking" : "all stocked"}
          />
        </div>

        {/* Filters + Search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <FilterTabs
            tabs={[
              { label: "All", value: "ALL", count: products.length },
              {
                label: "Active",
                value: "ACTIVE",
                count: products.filter((p) => p.status === "ACTIVE").length,
              },
              {
                label: "Draft",
                value: "DRAFT",
                count: products.filter((p) => p.status === "DRAFT").length,
              },
              {
                label: "Out of Stock",
                value: "OUT_OF_STOCK",
                count: outOfStock.length,
              },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as FilterVal)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products…"
          />
        </div>

        {/* Table */}
        <div
          style={{
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 140px 130px 130px 80px",
              padding: "12px 22px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontFamily: "monospace",
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(240,244,248,0.28)",
            }}
          >
            <span />
            <span>Product</span>
            <span style={{ textAlign: "right" }}>Price</span>
            <span style={{ textAlign: "right" }}>Inventory</span>
            <span style={{ textAlign: "right" }}>Status</span>
            <span />
          </div>

          {loading && <Spinner />}
          {!loading && filtered.length === 0 && (
            <EmptyState
              label={
                search
                  ? `No products matching "${search}"`
                  : "No products found"
              }
            />
          )}

          {!loading &&
            filtered.map((product) => {
              const firstVariant = product.variants?.edges?.[0]?.node;
              const oos = product.totalInventory === 0;

              return (
                <div
                  key={product.id}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.022)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 140px 130px 130px 80px",
                    padding: "13px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                    transition: "background 0.12s",
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 9,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    {product.featuredImage?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.featuredImage.url}
                        alt={product.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <p
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f0f4f8",
                        margin: "0 0 2px",
                      }}
                    >
                      {product.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        color: "rgba(240,244,248,0.3)",
                        margin: 0,
                      }}
                    >
                      {product.productType || "—"} ·{" "}
                      {product.variants?.edges?.length ?? 1} size
                      {(product.variants?.edges?.length ?? 1) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.05rem",
                      color: "#f0f4f8",
                      textAlign: "right",
                    }}
                  >
                    {firstVariant ? formatPrice(firstVariant.price) : "—"}
                  </span>

                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      textAlign: "right",
                      color: oos ? "#f87171" : "rgba(240,244,248,0.5)",
                      fontWeight: oos ? 700 : 400,
                    }}
                  >
                    {oos ? "Out of stock" : product.totalInventory}
                  </span>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <StatusPill label={product.status} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <ActionButton
                      onClick={() =>
                        setModal({
                          mode: "edit",
                          product,
                          draft: draftFromProduct(product),
                        })
                      }
                      variant="ghost"
                      small
                    >
                      Edit
                    </ActionButton>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {modal && (
        <ProductModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={fetchProducts}
          showToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
