// app/admin/hero/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  useToast,
  Toast,
  StatCard,
  EmptyState,
  ActionButton,
  FieldLabel,
  TextInput,
} from "@/lib/admin-ui";
import { useLayoutMode } from "@/lib/use-layout-mode";

type HeroSlide = {
  _id: string;
  brand: string;
  name: string;
  sub: string;
  price: string;
  tag: string;
  productHandle: string;
  image: string;
  glow: string;
  tagColor: string;
  features: string[];
  active: boolean;
  order: number;
};

type Draft = Omit<HeroSlide, "_id" | "order">;

function emptyDraft(): Draft {
  return {
    brand: "",
    name: "",
    sub: "",
    price: "",
    tag: "IN STOCK",
    productHandle: "",
    image: "",
    glow: "232,168,48",
    tagColor: "#e8a830",
    features: ["", "", ""],
    active: true,
  };
}

function draftFromSlide(slide: HeroSlide): Draft {
  return {
    brand: slide.brand,
    name: slide.name,
    sub: slide.sub,
    price: slide.price,
    tag: slide.tag,
    productHandle: slide.productHandle,
    image: slide.image,
    glow: slide.glow,
    tagColor: slide.tagColor,
    features: slide.features?.length ? slide.features : ["", "", ""],
    active: slide.active,
  };
}

type ModalState =
  | null
  | { mode: "new"; draft: Draft }
  | { mode: "edit"; slide: HeroSlide; draft: Draft };

function SlideModal({
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
  const { isMobile } = useLayoutMode();
  const [draft, setDraft] = useState<Draft>(modal.draft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = modal.mode === "edit";

  function upd<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/hero-slides/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      upd("image", data.url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", false);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (
      !draft.brand ||
      !draft.name ||
      !draft.price ||
      !draft.productHandle ||
      !draft.image
    ) {
      showToast(
        "Brand, name, price, product handle, and image are required",
        false,
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        features: draft.features.filter((f) => f.trim()),
      };
      const res =
        modal.mode === "new"
          ? await fetch("/api/hero-slides", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/hero-slides/${modal.slide._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      showToast(isEdit ? "Slide saved ✓" : "Slide created ✓");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
          maxWidth: 560,
          maxHeight: isMobile ? "100vh" : "90vh",
          height: isMobile ? "100vh" : "auto",
          overflowY: "auto",
          boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
        }}
      >
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
              {isEdit ? "Edit Slide" : "New Slide"}
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
              {draft.name || "New Hero Slide"}
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

        <div
          style={{
            padding: isMobile ? "20px" : "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div>
            <FieldLabel>Product Image</FieldLabel>
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
                  position: "relative",
                }}
              >
                {draft.image && (
                  <Image
                    src={draft.image}
                    alt=""
                    fill
                    style={{ objectFit: "contain" }}
                  />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
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
                  {uploading
                    ? "Uploading…"
                    : draft.image
                      ? "Replace Image"
                      : "Upload Image"}
                </button>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    color: "rgba(240,244,248,0.2)",
                    margin: "6px 0 0",
                    letterSpacing: "0.06em",
                  }}
                >
                  JPG, PNG, WEBP
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <FieldLabel>Brand *</FieldLabel>
              <TextInput
                value={draft.brand}
                onChange={(v) => upd("brand", v)}
                placeholder="ASICS"
              />
            </div>
            <div>
              <FieldLabel>Product Handle *</FieldLabel>
              <TextInput
                value={draft.productHandle}
                onChange={(v) => upd("productHandle", v)}
                placeholder="novablast-5"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Name *</FieldLabel>
            <TextInput
              value={draft.name}
              onChange={(v) => upd("name", v)}
              placeholder="NOVABLAST 5"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <FieldLabel>Sub Label</FieldLabel>
              <TextInput
                value={draft.sub}
                onChange={(v) => upd("sub", v)}
                placeholder="Max Cushion"
              />
            </div>
            <div>
              <FieldLabel>Price *</FieldLabel>
              <TextInput
                value={draft.price}
                onChange={(v) => upd("price", v)}
                placeholder="₱7,200"
              />
            </div>
            <div>
              <FieldLabel>Tag</FieldLabel>
              <TextInput
                value={draft.tag}
                onChange={(v) => upd("tag", v)}
                placeholder="IN STOCK"
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <FieldLabel>Glow Color</FieldLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={`#${draft.glow
                    .split(",")
                    .map((v) =>
                      parseInt(v.trim()).toString(16).padStart(2, "0"),
                    )
                    .join("")}`}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    upd("glow", `${r},${g},${b}`);
                  }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={draft.glow}
                    onChange={(v) => upd("glow", v)}
                    placeholder="45,212,191"
                  />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel>Tag Color</FieldLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={draft.tagColor}
                  onChange={(e) => upd("tagColor", e.target.value)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={draft.tagColor}
                    onChange={(v) => upd("tagColor", v)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>
              Features (up to 3, shown as chips on desktop)
            </FieldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {draft.features.map((f, i) => (
                <TextInput
                  key={i}
                  value={f}
                  onChange={(v) => {
                    const next = [...draft.features];
                    next[i] = v;
                    upd("features", next);
                  }}
                  placeholder={`Feature ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Visibility</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {[true, false].map((val) => {
                const active = draft.active === val;
                return (
                  <button
                    key={String(val)}
                    onClick={() => upd("active", val)}
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
                        ? val
                          ? "1px solid rgba(74,222,128,0.45)"
                          : "1px solid rgba(240,244,248,0.18)"
                        : "1px solid rgba(255,255,255,0.07)",
                      background: active
                        ? val
                          ? "rgba(74,222,128,0.11)"
                          : "rgba(255,255,255,0.05)"
                        : "transparent",
                      color: active
                        ? val
                          ? "#4ade80"
                          : "rgba(240,244,248,0.6)"
                        : "rgba(240,244,248,0.22)",
                    }}
                  >
                    {val ? "✓ Active" : "Hidden"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
          <ActionButton
            onClick={handleSave}
            disabled={saving || uploading}
            variant="green"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Slide"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export default function HeroAdminPage() {
  const { isMobile } = useLayoutMode();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hero-slides", { cache: "no-store" });
      const data = await res.json();
      setSlides(
        (data.slides || []).sort(
          (a: HeroSlide, b: HeroSlide) => a.order - b.order,
        ),
      );
    } catch {
      showToast("Couldn't load hero slides", false);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  async function toggleActive(slide: HeroSlide) {
    setSlides((s) =>
      s.map((sl) =>
        sl._id === slide._id ? { ...sl, active: !sl.active } : sl,
      ),
    );
    try {
      await fetch(`/api/hero-slides/${slide._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !slide.active }),
      });
    } catch {
      fetchSlides();
    }
  }

  async function moveSlide(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    setSlides(reordered);
    try {
      await Promise.all(
        reordered.map((s, i) =>
          fetch(`/api/hero-slides/${s._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: i }),
          }),
        ),
      );
    } catch {
      fetchSlides();
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/hero-slides/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      showToast("Slide deleted");
      setSlides((s) => s.filter((sl) => sl._id !== id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", false);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  const activeCount = slides.filter((s) => s.active).length;

  return (
    <div style={{ padding: isMobile ? "20px 16px 40px" : "32px 36px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
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
              Hero Slides
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              width: isMobile ? "100%" : "auto",
            }}
          >
            <ActionButton onClick={() => fetchSlides()} variant="ghost">
              ↻ Refresh
            </ActionButton>
            <ActionButton
              onClick={() => setModal({ mode: "new", draft: emptyDraft() })}
              variant="gold"
            >
              + New Slide
            </ActionButton>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Total Slides"
            value={String(slides.length)}
            sub="in carousel"
          />
          <StatCard
            label="Active"
            value={String(activeCount)}
            color="#4ade80"
            sub="showing on homepage"
          />
          <StatCard
            label="Hidden"
            value={String(slides.length - activeCount)}
            sub="not shown"
          />
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: "rgba(240,244,248,0.3)",
                }}
              >
                Loading slides…
              </p>
            </div>
          )}

          {!loading && slides.length === 0 && (
            <EmptyState label="No hero slides yet — add one to populate the homepage carousel" />
          )}

          {!loading &&
            slides.map((slide, i) => (
              <div
                key={slide._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: isMobile ? "13px 16px" : "13px 22px",
                  borderBottom:
                    i === slides.length - 1
                      ? "none"
                      : "1px solid rgba(255,255,255,0.04)",
                  opacity: slide.active ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => moveSlide(i, -1)}
                    disabled={i === 0}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(240,244,248,0.5)",
                      cursor: i === 0 ? "not-allowed" : "pointer",
                      opacity: i === 0 ? 0.3 : 1,
                      fontSize: 11,
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveSlide(i, 1)}
                    disabled={i === slides.length - 1}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(240,244,248,0.5)",
                      cursor:
                        i === slides.length - 1 ? "not-allowed" : "pointer",
                      opacity: i === slides.length - 1 ? 0.3 : 1,
                      fontSize: 11,
                    }}
                  >
                    ↓
                  </button>
                </div>

                <div
                  style={{
                    width: isMobile ? 46 : 56,
                    height: isMobile ? 46 : 56,
                    borderRadius: 9,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {slide.image && (
                    <Image
                      src={slide.image}
                      alt={slide.name}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: 8,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(240,244,248,0.3)",
                      margin: "0 0 2px",
                    }}
                  >
                    {slide.brand}
                  </p>
                  <p
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.05rem",
                      letterSpacing: "0.02em",
                      color: "#f0f4f8",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {slide.name}
                  </p>
                </div>

                {!isMobile && (
                  <span
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.05rem",
                      color: slide.tagColor,
                      flexShrink: 0,
                    }}
                  >
                    {slide.price}
                  </span>
                )}

                <button
                  onClick={() => toggleActive(slide)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    flexShrink: 0,
                    border: slide.active
                      ? "1px solid rgba(74,222,128,0.35)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: slide.active
                      ? "rgba(74,222,128,0.1)"
                      : "transparent",
                    color: slide.active ? "#4ade80" : "rgba(240,244,248,0.35)",
                  }}
                >
                  {slide.active ? "Active" : "Hidden"}
                </button>

                {!isMobile && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <ActionButton
                      onClick={() =>
                        setModal({
                          mode: "edit",
                          slide,
                          draft: draftFromSlide(slide),
                        })
                      }
                      variant="ghost"
                      small
                    >
                      Edit
                    </ActionButton>
                    <button
                      onClick={() => setDeleteTarget(slide)}
                      disabled={deletingId === slide._id}
                      title="Delete slide"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.18)",
                        color:
                          deletingId === slide._id
                            ? "rgba(248,113,113,0.3)"
                            : "#f87171",
                        cursor:
                          deletingId === slide._id ? "not-allowed" : "pointer",
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

                {isMobile && (
                  <button
                    onClick={() =>
                      setModal({
                        mode: "edit",
                        slide,
                        draft: draftFromSlide(slide),
                      })
                    }
                    style={{
                      fontFamily: "monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "rgba(240,244,248,0.5)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {modal && (
        <SlideModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={fetchSlides}
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
                  Delete Slide
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
                  {deleteTarget.name}
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
              This will remove the slide from the homepage carousel. This cannot
              be undone.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget._id}
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
                    deletingId === deleteTarget._id ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget._id)}
                disabled={deletingId === deleteTarget._id}
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
                    deletingId === deleteTarget._id ? "not-allowed" : "pointer",
                  opacity: deletingId === deleteTarget._id ? 0.6 : 1,
                }}
              >
                {deletingId === deleteTarget._id ? "Deleting…" : "Delete Slide"}
              </button>
            </div>
          </div>
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}
