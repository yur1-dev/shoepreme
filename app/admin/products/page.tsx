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
import { useLayoutMode } from "@/lib/use-layout-mode";

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
  newImageFiles?: File[];
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
    newImageFiles: [],
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
  const collectionTitle = product.collections?.edges?.[0]?.node?.title ?? "";
  return {
    title: product.title,
    productType: collectionTitle,
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

function NewProductImageDropzone({
  files,
  onFilesChange,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }

  function removeAt(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? "rgba(232,168,48,0.6)" : "rgba(255,255,255,0.15)"}`,
          borderRadius: 12,
          background: dragOver
            ? "rgba(232,168,48,0.05)"
            : "rgba(255,255,255,0.02)",
          padding: "24px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.15s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(232,168,48,0.5)"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(240,244,248,0.4)",
            margin: 0,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          Drag & drop images, or click to browse
        </p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 8,
            color: "rgba(240,244,248,0.2)",
            margin: 0,
          }}
        >
          Multiple images supported · JPG, PNG, WEBP · max ~4 MB each
        </p>
      </div>

      {previews.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          {previews.map((src, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.7)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#f87171",
                  fontSize: 11,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error:
        res.status === 404
          ? `Endpoint not found (404) — this API route isn't set up yet`
          : `Server returned ${res.status}`,
    };
  }
}

function ProductModal({
  modal,
  onClose,
  onSaved,
  onSizeAdded,
  showToast,
}: {
  modal: Exclude<ModalState, null>;
  onClose: () => void;
  onSaved: (newProductId?: string) => void;
  onSizeAdded: (productId: string) => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const { isMobile } = useLayoutMode();
  const [draft, setDraft] = useState<DraftProduct>(modal.draft);
  const [saving, setSaving] = useState(false);
  const sizeRef = useRef<HTMLInputElement>(null);
  const isEdit = modal.mode === "edit";
  const product = isEdit ? (modal as any).product : null;
  const oos = product ? product.totalInventory === 0 : false;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingSize, setAddingSize] = useState(false);
  const [localCollections, setLocalCollections] = useState(
    product?.collections?.edges ?? [],
  );
  const [pendingCollections, setPendingCollections] = useState<string[]>([]);

  useEffect(() => {
    setLocalCollections(product?.collections?.edges ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const CATEGORY_OPTIONS = [
    "Men",
    "Women",
    "Basketball & Court",
    "Running",
    "Trail",
    "Sneakers",
    "Pre-order",
  ];
  const [useCustomCategory, setUseCustomCategory] = useState(
    () =>
      !!modal.draft.productType &&
      !CATEGORY_OPTIONS.includes(modal.draft.productType),
  );

  function resolveDefaultImage(p: any): { id?: string; url?: string } | null {
    if (!p) return null;
    const edges = p.media?.edges ?? [];
    const featuredUrl = p.featuredImage?.url;
    const match = featuredUrl
      ? edges.find((e: any) => e.node?.image?.url === featuredUrl)
      : null;
    if (match) return { id: match.node.id, url: match.node.image.url };
    const firstImage = edges.find((e: any) => e.node?.image?.url);
    if (firstImage) {
      return { id: firstImage.node.id, url: firstImage.node.image.url };
    }
    return p.featuredImage
      ? { id: p.featuredImage.id, url: p.featuredImage.url }
      : null;
  }

  const [selectedImage, setSelectedImage] = useState<{
    id?: string;
    url?: string;
  } | null>(() => resolveDefaultImage(product));

  const originalFeaturedId = useMemo(
    () => resolveDefaultImage(product)?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?.id],
  );

  const [pendingReplace, setPendingReplace] = useState<{
    mediaId: string;
    file: File;
    previewUrl: string;
    wasFeatured: boolean;
  } | null>(null);
  const [pendingAdds, setPendingAdds] = useState<
    { key: string; file: File; previewUrl: string }[]
  >([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  async function handleDeleteImage(mediaId: string) {
    if (!product) return;
    const remainingCount = (product.media?.edges ?? []).length;
    if (remainingCount <= 1) {
      showToast("Product needs at least one image", false);
      return;
    }
    setDeletingImageId(mediaId);
    try {
      const res = await fetch("/api/admin/delete-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, mediaId }),
      });
      const data = await safeJson(res);
      if (!data.success) {
        showToast("Remove failed: " + (data.error || "unknown error"), false);
        return;
      }
      showToast("Image removed ✓");

      if (pendingReplace?.mediaId === mediaId) {
        URL.revokeObjectURL(pendingReplace.previewUrl);
        setPendingReplace(null);
      }
      if (selectedImage?.id === mediaId) {
        const remaining = (product.media?.edges ?? []).find(
          (e: any) => e.node?.id !== mediaId,
        );
        setSelectedImage(
          remaining
            ? { id: remaining.node.id, url: remaining.node.image.url }
            : null,
        );
      }
      onSizeAdded(product.id);
    } finally {
      setDeletingImageId(null);
    }
  }

  useEffect(() => {
    return () => {
      if (pendingReplace) URL.revokeObjectURL(pendingReplace.previewUrl);
      pendingAdds.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (product) {
      setSelectedImage((prev) => {
        const stillExists = (product.media?.edges ?? []).some(
          (e: any) => e.node?.id === prev?.id,
        );
        if (prev && stillExists) return prev;
        return resolveDefaultImage(product);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, product?.media, product?.featuredImage]);

  useEffect(() => {
    if (!product) return;
    const ids = new Set(
      (product.variants?.edges ?? []).map((e: any) => e.node.id),
    );
    if (draft.variantId && ids.has(draft.variantId)) return;
    const fallback = product.variants?.edges?.[0]?.node?.id;
    if (fallback) setDraft((p) => ({ ...p, variantId: fallback }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.variants]);

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

  function queueReplaceImage(file: File) {
    if (!product || !selectedImage?.id) {
      showToast("Select an image to replace first", false);
      return;
    }
    if (pendingReplace) URL.revokeObjectURL(pendingReplace.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    const wasFeatured = selectedImage.url === product.featuredImage?.url;
    setPendingReplace({
      mediaId: selectedImage.id,
      file,
      previewUrl,
      wasFeatured,
    });
  }

  function undoReplaceImage() {
    if (pendingReplace) URL.revokeObjectURL(pendingReplace.previewUrl);
    setPendingReplace(null);
  }

  function queueAddImage(file: File) {
    if (!product) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingAdds((prev) => [
      ...prev,
      { key: `${Date.now()}-${Math.random()}`, file, previewUrl },
    ]);
  }

  function removePendingAdd(key: string) {
    setPendingAdds((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function flushPendingImageChanges(productId: string) {
    let failed = 0;
    if (pendingReplace) {
      const fd = new FormData();
      fd.append("file", pendingReplace.file);
      fd.append("productId", productId);
      fd.append("oldMediaId", pendingReplace.mediaId);
      if (pendingReplace.wasFeatured) fd.append("setAsFeatured", "true");
      const res = await fetch("/api/admin/upload-product-image", {
        method: "POST",
        body: fd,
      });
      const data = await safeJson(res);
      if (!data.success) {
        failed++;
      } else if (pendingReplace.wasFeatured && data.media?.id) {
        try {
          const fRes = await fetch("/api/admin/set-featured-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, mediaId: data.media.id }),
          });
          await safeJson(fRes);
        } catch {
          // Non-fatal
        }
      }
      URL.revokeObjectURL(pendingReplace.previewUrl);
    }
    for (const add of pendingAdds) {
      const fd = new FormData();
      fd.append("file", add.file);
      fd.append("productId", productId);
      const res = await fetch("/api/admin/upload-product-image", {
        method: "POST",
        body: fd,
      });
      const data = await safeJson(res);
      if (!data.success) failed++;
      URL.revokeObjectURL(add.previewUrl);
    }
    setPendingReplace(null);
    setPendingAdds([]);
    return failed;
  }

  async function flushFeaturedSelection(productId: string) {
    const replacingSelected = pendingReplace?.mediaId === selectedImage?.id;
    if (
      replacingSelected ||
      !selectedImage?.id ||
      selectedImage.id === originalFeaturedId
    ) {
      return 0;
    }
    const res = await fetch("/api/admin/set-featured-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, mediaId: selectedImage.id }),
    });
    const data = await safeJson(res);
    return data.success ? 0 : 1;
  }

  async function handleSave() {
    if (!draft.title.trim()) {
      showToast("Name is required", false);
      return;
    }
    let effectiveSizes = draft.sizes;
    if (
      !isEdit &&
      draft.sizeInput.trim() &&
      !draft.sizes.includes(draft.sizeInput.trim())
    ) {
      effectiveSizes = [...draft.sizes, draft.sizeInput.trim()];
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
            productType: "",
          }),
        });
        const d1 = await safeJson(r1);
        if (!d1.success) {
          showToast("Update failed: " + d1.error, false);
          return;
        }

        const currentVariantIds = new Set(
          (product.variants?.edges ?? []).map((e: any) => e.node.id),
        );
        if (draft.variantId && currentVariantIds.has(draft.variantId)) {
          const r2 = await fetch("/api/admin/update-variant-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variantId: draft.variantId,
              price: draft.price,
              productId: product.id,
            }),
          });
          const d2 = await safeJson(r2);
          if (!d2.success) {
            showToast("Price update failed: " + d2.error, false);
            return;
          }
        }

        const stockEntries = Object.entries(draft.stockEdits ?? {});
        const updatedStockEdits = { ...draft.stockEdits };
        for (const [size, entry] of stockEntries) {
          const newQty = parseInt(entry.newQty);
          if (!isNaN(newQty) && entry.inventoryItemId) {
            const delta = newQty - entry.current;
            if (delta !== 0) {
              const invRes = await fetch("/api/admin/update-inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  inventoryItemId: entry.inventoryItemId,
                  quantity: delta,
                }),
              });
              const invData = await safeJson(invRes);
              if (invData.success) {
                updatedStockEdits[size] = { ...entry, current: newQty };
              } else {
                setDraft((p) => ({ ...p, stockEdits: updatedStockEdits }));
                showToast(
                  `Stock update failed for ${size}: ${invData.error}`,
                  false,
                );
              }
            }
          }
          if (entry.variantId && entry.price) {
            await fetch("/api/admin/update-variant-price", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                variantId: entry.variantId,
                price: entry.price,
                productId: product.id,
              }),
            });
          }
        }

        let imageFailures = 0;
        if (pendingReplace || pendingAdds.length > 0) {
          imageFailures += await flushPendingImageChanges(product.id);
        }
        imageFailures += await flushFeaturedSelection(product.id);

        for (const colTitle of pendingCollections) {
          await fetch("/api/admin/add-to-collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id, collectionTitle: colTitle }),
          });
        }
        setPendingCollections([]);

        if (imageFailures > 0) {
          showToast(
            `Product saved, but ${imageFailures} image change(s) failed`,
            false,
          );
        } else {
          showToast("Product saved ✓");
        }
        onSizeAdded(product.id);
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
        const data = await safeJson(res);
        if (!data.success) {
          showToast("Create failed: " + data.error, false);
          return;
        }

        if (
          draft.newImageFiles &&
          draft.newImageFiles.length > 0 &&
          data.product?.id
        ) {
          let failedCount = 0;
          for (const file of draft.newImageFiles) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("productId", data.product.id);
            const imgRes = await fetch("/api/admin/upload-product-image", {
              method: "POST",
              body: fd,
            });
            const imgData = await safeJson(imgRes);
            if (!imgData.success) failedCount++;
          }
          if (failedCount > 0) {
            showToast(
              `Product created, but ${failedCount} image(s) failed to upload`,
              false,
            );
            onSaved();
            onClose();
            return;
          }
        }

        showToast("Product created ✓");
        onSaved(data.product?.id);
        onClose();
        return;
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
        padding: isMobile ? 0 : 20,
      }}
    >
      <div
        style={{
          background: "#0f131c",
          border: isMobile ? "none" : "1px solid rgba(255,255,255,0.09)",
          borderRadius: isMobile ? 0 : 18,
          width: "100%",
          maxWidth: 620,
          maxHeight: isMobile ? "100vh" : "90vh",
          height: isMobile ? "100vh" : "auto",
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
            padding: isMobile ? "18px 20px 16px" : "22px 28px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            top: 0,
            background: "#0f131c",
            zIndex: 1,
            borderRadius: isMobile ? 0 : "18px 18px 0 0",
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
            padding: isMobile ? "20px" : "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Images — new product only, drag & drop, multiple */}
          {!isEdit && (
            <div>
              <FieldLabel>Product Images</FieldLabel>
              <NewProductImageDropzone
                files={draft.newImageFiles ?? []}
                onFilesChange={(files) => upd("newImageFiles" as any, files)}
              />
            </div>
          )}

          {/* Images — edit only */}
          {isEdit && (
            <div>
              <FieldLabel>Product Images</FieldLabel>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(240,244,248,0.25)",
                  margin: "0 0 10px",
                  letterSpacing: "0.05em",
                }}
              >
                Click a thumbnail to make it the product's list image on Save ·
                × removes an image right away, everything else applies when you
                Save
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {(product.media?.edges ?? []).map((e: any, i: number) => {
                  if (!e.node?.image?.url) return null;
                  const isBeingReplaced = pendingReplace?.mediaId === e.node.id;
                  const isDeleting = deletingImageId === e.node.id;
                  const displayUrl = isBeingReplaced
                    ? pendingReplace!.previewUrl
                    : e.node.image.url;
                  return (
                    <div
                      key={i}
                      style={{ position: "relative", flexShrink: 0 }}
                    >
                      <button
                        onClick={() =>
                          !isDeleting &&
                          setSelectedImage({
                            id: e.node.id,
                            url: e.node.image.url,
                          })
                        }
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          overflow: "hidden",
                          border:
                            selectedImage?.id === e.node.id
                              ? "2px solid rgba(232,168,48,0.75)"
                              : isBeingReplaced
                                ? "1.5px dashed rgba(232,168,48,0.5)"
                                : "1px solid rgba(255,255,255,0.08)",
                          padding: 0,
                          cursor: isDeleting ? "default" : "pointer",
                          background: "none",
                          display: "block",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: isDeleting
                              ? 0.35
                              : isBeingReplaced
                                ? 0.85
                                : 1,
                          }}
                        />
                      </button>
                      {isDeleting && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 7,
                              fontWeight: 800,
                              letterSpacing: "0.06em",
                              color: "#f87171",
                              background: "rgba(0,0,0,0.6)",
                              padding: "2px 5px",
                              borderRadius: 4,
                            }}
                          >
                            …
                          </span>
                        </div>
                      )}
                      {isBeingReplaced && !isDeleting && (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            undoReplaceImage();
                          }}
                          title="Undo replace"
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 3,
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: "rgba(0,0,0,0.7)",
                            border: "1px solid rgba(232,168,48,0.4)",
                            color: "#e8a830",
                            fontSize: 11,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                      {!isBeingReplaced && (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (!isDeleting) handleDeleteImage(e.node.id);
                          }}
                          disabled={isDeleting}
                          title="Remove this image — wrong product?"
                          style={{
                            position: "absolute",
                            top: 3,
                            right: 3,
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: "rgba(0,0,0,0.7)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: isDeleting
                              ? "rgba(248,113,113,0.4)"
                              : "#f87171",
                            fontSize: 11,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Newly picked images queued to be added on Save */}
                {pendingAdds.map((add) => (
                  <div
                    key={add.key}
                    style={{ position: "relative", flexShrink: 0 }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1.5px dashed rgba(74,222,128,0.5)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={add.previewUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removePendingAdd(add.key)}
                      title="Remove"
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 3,
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: "rgba(0,0,0,0.7)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#f87171",
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add Image tile — queues a new image, uploaded on Save */}
                <input
                  type="file"
                  accept="image/*"
                  id="add-image-input"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) queueAddImage(f);
                    e.target.value = "";
                  }}
                />
                <label htmlFor="add-image-input">
                  <span
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      border: "1.5px dashed rgba(255,255,255,0.18)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "rgba(232,168,48,0.6)",
                      fontFamily: "monospace",
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: 7, letterSpacing: "0.05em" }}>
                      Add
                    </span>
                  </span>
                </label>
              </div>
              <FieldLabel>Replace Selected Image</FieldLabel>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: isMobile ? "wrap" : "nowrap",
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.04)",
                    border: pendingReplace
                      ? "1.5px dashed rgba(232,168,48,0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  {(pendingReplace?.mediaId === selectedImage?.id
                    ? pendingReplace?.previewUrl
                    : selectedImage?.url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        pendingReplace?.mediaId === selectedImage?.id
                          ? pendingReplace!.previewUrl
                          : selectedImage!.url
                      }
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
                      if (f) queueReplaceImage(f);
                      e.target.value = "";
                    }}
                  />
                  <label htmlFor="modal-img">
                    <span
                      style={{
                        display: "inline-block",
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontFamily: "monospace",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(240,244,248,0.7)",
                      }}
                    >
                      {pendingReplace?.mediaId === selectedImage?.id
                        ? "Choose Different File"
                        : "Replace Image"}
                    </span>
                  </label>
                  {pendingReplace?.mediaId === selectedImage?.id && (
                    <button
                      onClick={undoReplaceImage}
                      style={{
                        marginLeft: 8,
                        background: "none",
                        border: "none",
                        color: "rgba(240,244,248,0.35)",
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Undo
                    </button>
                  )}
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: 8,
                      color:
                        pendingReplace?.mediaId === selectedImage?.id
                          ? "#e8a830"
                          : selectedImage?.id &&
                              selectedImage.id !== originalFeaturedId
                            ? "#e8a830"
                            : "rgba(240,244,248,0.2)",
                      margin: "6px 0 0",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {pendingReplace?.mediaId === selectedImage?.id
                      ? "Pending — will apply when you Save Changes"
                      : selectedImage?.id &&
                          selectedImage.id !== originalFeaturedId
                        ? "Pending — this will become the list/storefront image on Save"
                        : "JPG, PNG, WEBP · max ~4 MB"}
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
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
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
                {localCollections.length > 0 && (
                  <div>
                    <FieldLabel>Collections</FieldLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {localCollections.map((e: any) => (
                        <span
                          key={e.node.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 5,
                            padding: "3px 6px 3px 8px",
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "rgba(240,244,248,0.5)",
                          }}
                        >
                          {e.node.title}
                          <button
                            onClick={async () => {
                              const res = await fetch("/api/admin/remove-from-collection", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ productId: product.id, collectionId: e.node.id }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                showToast("Removed from collection ✓");
                                setLocalCollections((prev: any[]) =>
                                  prev.filter((c: any) => c.node.id !== e.node.id),
                                );
                                if (draft.productType === e.node.title) {
                                  upd("productType", "");
                                }
                              } else {
                                showToast("Failed: " + data.error, false);
                              }
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "rgba(248,113,113,0.6)",
                              cursor: "pointer",
                              fontSize: 12,
                              lineHeight: 1,
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Name + Category */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
            }}
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
              {!useCustomCategory ? (
                <select
                  value={isEdit ? "" : draft.productType}
                  onChange={(e) => {
                    if (e.target.value === "__other__") {
                      setUseCustomCategory(true);
                      upd("productType", "");
                    } else if (isEdit && e.target.value) {
                      if (!pendingCollections.includes(e.target.value)) {
                        setPendingCollections((prev) => [...prev, e.target.value]);
                      }
                    } else {
                      upd("productType", e.target.value);
                    }
                  }}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "9px 12px",
                    color: "#f0f4f8",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: 12,
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(232,168,48,0.4)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.1)")
                  }
                >
                  <option value="" style={{ background: "#0f131c" }}>
                    Select category…
                  </option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      style={{ background: "#0f131c" }}
                    >
                      {cat}
                    </option>
                  ))}
                  <option value="__other__" style={{ background: "#0f131c" }}>
                    Other…
                  </option>
                </select>
              ) : (
                <div style={{ position: "relative" }}>
                  <TextInput
                    value={draft.productType}
                    onChange={(v) => upd("productType", v)}
                    placeholder="Type a category…"
                  />
                  <button
                    onClick={() => {
                      setUseCustomCategory(false);
                      upd("productType", "");
                    }}
                    title="Choose from list instead"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 10,
                      transform: "translateY(-50%)",
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      border: "none",
                      color: "rgba(240,244,248,0.4)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
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
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {isEdit && pendingCollections.length > 0 && (
            <div>
              <FieldLabel>Will be added on Save</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {pendingCollections.map((col) => (
                  <span
                    key={col}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(232,168,48,0.08)",
                      border: "1px solid rgba(232,168,48,0.3)",
                      borderRadius: 5,
                      padding: "3px 6px 3px 8px",
                      fontFamily: "monospace",
                      fontSize: 9,
                      color: "#e8a830",
                    }}
                  >
                    + {col}
                    <button
                      onClick={() =>
                        setPendingCollections((prev) => prev.filter((c) => c !== col))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(232,168,48,0.6)",
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
            }}
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
                    gridTemplateColumns: isMobile
                      ? "1fr 1fr"
                      : "1fr 100px 80px auto",
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
                    disabled={saving || addingSize}
                    onClick={async () => {
                      const size = draft.sizeInput.trim();
                      if (!size || addingSize) return;
                      setAddingSize(true);
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
                      const data = await safeJson(res);
                      console.log("add-variant response:", data);
                      if (!data.success) {
                        showToast("Failed: " + data.error, false);
                        return;
                      }
                      showToast("Size added ✓");
                      upd("sizeInput", "");

                      setDraft((p) => ({
                        ...p,
                        sizes: [...p.sizes, size],
                        stockEdits: {
                          ...p.stockEdits,
                          [size]: {
                            inventoryItemId:
                              data.variant?.inventoryItem?.id ?? "",
                            current: qty,
                            newQty: String(qty),
                            price,
                            variantId: data.variant?.id ?? "",
                          },
                        },
                      }));

                      onSizeAdded(product.id);
                      setAddingSize(false);
                    }}
                    style={{
                      background: "rgba(232,168,48,0.1)",
                      border: "1px solid rgba(232,168,48,0.28)",
                      borderRadius: 8,
                      padding: "9px 16px",
                      color: addingSize ? "rgba(232,168,48,0.4)" : "#e8a830",
                      fontFamily: "monospace",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: addingSize ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {addingSize ? "Adding…" : "Add Size"}
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
            padding: isMobile ? "14px 20px 20px" : "16px 28px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            bottom: 0,
            background: "#0f131c",
            borderRadius: isMobile ? 0 : "0 0 18px 18px",
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
  const { isMobile, isTablet } = useLayoutMode();
  const gridColsDesktop = "60px 1fr 140px 130px 130px 120px";
  const gridColsMobile = "50px 1fr 90px 70px";
  const gridCols = isMobile ? gridColsMobile : gridColsDesktop;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [filter, setFilter] = useState<FilterVal>("ALL");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchProducts = useCallback(async (delay?: number) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    setLoading(true);
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await res.json();
    setProducts(data);
    setLoading(false);
    return data;
  }, []);

  const fetchProductsUntilPresent = useCallback(
    async (newProductId?: string, attempts = 6) => {
      for (let i = 0; i < attempts; i++) {
        const data = await fetchProducts();
        if (!newProductId) return;
        if (data.some((p: any) => p.id === newProductId)) return;
        await new Promise((r) => setTimeout(r, 1000));
      }
    },
    [fetchProducts],
  );

  const refreshModalProduct = useCallback(async (productId: string) => {
    const res = await fetch(
      `/api/admin/product?id=${encodeURIComponent(productId)}`,
      {
        cache: "no-store",
      },
    );
    const updated = await res.json();
    console.log("refreshModalProduct received:", updated);
    if (updated && updated.id) {
      const freshDraft = draftFromProduct(updated);
      setModal((m) => {
        if (!m || m.mode !== "edit") return m;
        const mergedStockEdits = { ...freshDraft.stockEdits };
        for (const [size, entry] of Object.entries(m.draft.stockEdits)) {
          if (entry.variantId && !mergedStockEdits[size]) {
            mergedStockEdits[size] = entry;
          }
        }
        const mergedSizes = Array.from(
          new Set([...freshDraft.sizes, ...m.draft.sizes]),
        );
        return {
          mode: "edit",
          product: updated,
          draft: {
            ...freshDraft,
            sizes: mergedSizes,
            stockEdits: mergedStockEdits,
          },
        };
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    }
  }, []);

  async function handleDelete(productId: string) {
    setDeletingId(productId);
    const res = await fetch("/api/admin/delete-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    setDeletingId(null);
    setDeleteTarget(null);
    if (data.success) {
      showToast("Product deleted");
      fetchProducts();
    } else {
      showToast("Delete failed: " + data.error, false);
    }
  }

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
    <div style={{ padding: isMobile ? "20px 16px 40px" : "32px 36px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 12 : 0,
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
                fontSize: isMobile ? "1.9rem" : "2.4rem",
                letterSpacing: "0.04em",
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              Products
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              width: isMobile ? "100%" : "auto",
            }}
          >
            <ActionButton onClick={() => fetchProducts()} variant="ghost">
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
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
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
          <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
            <div style={{ minWidth: isMobile ? 420 : "auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  padding: isMobile ? "12px 16px" : "12px 22px",
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
                {!isMobile && (
                  <span style={{ textAlign: "right" }}>Inventory</span>
                )}
                {!isMobile && (
                  <span style={{ textAlign: "right" }}>Status</span>
                )}
                {!isMobile && <span />}
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
                      onClick={() =>
                        isMobile &&
                        setModal({
                          mode: "edit",
                          product,
                          draft: draftFromProduct(product),
                        })
                      }
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.022)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns: gridCols,
                        padding: isMobile ? "13px 16px" : "13px 22px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        alignItems: "center",
                        transition: "background 0.12s",
                        cursor: isMobile ? "pointer" : "default",
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? 38 : 46,
                          height: isMobile ? 38 : 46,
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
                            color: oos ? "#f87171" : "rgba(240,244,248,0.3)",
                            margin: 0,
                          }}
                        >
                          {isMobile
                            ? oos
                              ? "Out of stock"
                              : `${product.totalInventory} in stock`
                            : `${product.collections?.edges?.[0]?.node?.title || "—"} · ${product.variants?.edges?.length ?? 1} size${(product.variants?.edges?.length ?? 1) !== 1 ? "s" : ""}`}
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

                      {!isMobile && (
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
                      )}

                      {!isMobile && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <StatusPill label={product.status} />
                        </div>
                      )}

                      {!isMobile && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 6,
                          }}
                        >
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
                          <button
                            onClick={() => setDeleteTarget(product)}
                            disabled={deletingId === product.id}
                            title="Delete product"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: "rgba(248,113,113,0.08)",
                              border: "1px solid rgba(248,113,113,0.18)",
                              color:
                                deletingId === product.id
                                  ? "rgba(248,113,113,0.3)"
                                  : "#f87171",
                              cursor:
                                deletingId === product.id
                                  ? "not-allowed"
                                  : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
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
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <ProductModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={(newProductId?: string) =>
            newProductId
              ? fetchProductsUntilPresent(newProductId)
              : fetchProducts()
          }
          onSizeAdded={refreshModalProduct}
          showToast={showToast}
        />
      )}

      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 99998,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(420px, calc(100vw - 48px))",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "28px",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(240,244,248,0.3)",
                    margin: "0 0 3px",
                  }}
                >
                  Delete Product
                </p>
                <h3
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "0.05em",
                    color: "#f0f4f8",
                    margin: 0,
                  }}
                >
                  {deleteTarget.title}
                </h3>
              </div>
            </div>

            <p
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: 12,
                color: "rgba(240,244,248,0.55)",
                lineHeight: 1.6,
                margin: 0,
                background: "rgba(248,113,113,0.05)",
                border: "1px solid rgba(248,113,113,0.15)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              This will permanently remove the product and all its variants from
              your store. This cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                style={{
                  flex: 1,
                  padding: "13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "rgba(240,244,248,0.4)",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor:
                    deletingId === deleteTarget.id ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={deletingId === deleteTarget.id}
                style={{
                  flex: 2,
                  padding: "13px",
                  background: "#f87171",
                  border: "none",
                  borderRadius: "10px",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor:
                    deletingId === deleteTarget.id ? "not-allowed" : "pointer",
                  opacity: deletingId === deleteTarget.id ? 0.6 : 1,
                }}
              >
                {deletingId === deleteTarget.id
                  ? "Deleting…"
                  : "Delete Product"}
              </button>
            </div>
          </div>
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}
