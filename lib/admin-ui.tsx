"use client";

import { useState, useCallback, useEffect } from "react";

// ─── Toast ────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }, []);
  return { toast, showToast };
}

export function Toast({
  toast,
}: {
  toast: { msg: string; ok: boolean } | null;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (toast) setVisible(true);
    else setVisible(false);
  }, [toast]);
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s, transform 0.2s",
        zIndex: 9999,
        background: toast.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
        border: `1px solid ${toast.ok ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)"}`,
        color: toast.ok ? "#4ade80" : "#f87171",
        borderRadius: 14,
        padding: "11px 24px 11px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "monospace",
        letterSpacing: "0.04em",
        backdropFilter: "blur(12px)",
        whiteSpace: "nowrap",
        boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: toast.ok ? "#4ade80" : "#f87171",
          flexShrink: 0,
          boxShadow: `0 0 8px ${toast.ok ? "#4ade80" : "#f87171"}`,
        }}
      />
      {toast.msg}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  color = "#e8a830",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "rgba(255,255,255,0.035)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 14,
        padding: "18px 20px",
        transition: "background 0.18s, border-color 0.18s",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(240,244,248,0.38)",
            margin: 0,
          }}
        >
          {label}
        </p>
        {icon && (
          <span style={{ color: "rgba(240,244,248,0.25)", display: "flex" }}>
            {icon}
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "2rem",
          color,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            color: "rgba(240,244,248,0.3)",
            margin: "6px 0 0",
            letterSpacing: "0.06em",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Filter Tab Bar ───────────────────────────────────────────────────────────

export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { label: string; value: T; count?: number }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{
              background: isActive ? "rgba(232,168,48,0.12)" : "transparent",
              border: isActive
                ? "1px solid rgba(232,168,48,0.3)"
                : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              padding: "6px 12px",
              color: isActive ? "#e8a830" : "rgba(240,244,248,0.4)",
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.14s",
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                style={{
                  background: isActive
                    ? "rgba(232,168,48,0.2)"
                    : "rgba(255,255,255,0.08)",
                  color: isActive ? "#e8a830" : "rgba(240,244,248,0.4)",
                  borderRadius: 6,
                  padding: "1px 6px",
                  fontSize: 8,
                  fontWeight: 900,
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          position: "absolute",
          left: 11,
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(240,244,248,0.3)",
        }}
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M11 11L14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 9,
          padding: "7px 12px 7px 32px",
          color: "#f0f4f8",
          fontFamily: "Poppins, sans-serif",
          fontSize: 12,
          outline: "none",
          width: 220,
          transition: "border-color 0.15s",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "rgba(232,168,48,0.4)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
        }
      />
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "monospace",
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(240,244,248,0.3)",
        margin: "0 0 6px",
      }}
    >
      {children}
    </p>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { color: string; glow: string }> = {
  PAID: { color: "#4ade80", glow: "rgba(74,222,128,0.4)" },
  PENDING: { color: "#e8a830", glow: "rgba(232,168,48,0.4)" },
  REFUNDED: { color: "#f87171", glow: "rgba(248,113,113,0.4)" },
  VOIDED: { color: "#f87171", glow: "rgba(248,113,113,0.4)" },
  EXPIRED: { color: "#f87171", glow: "rgba(248,113,113,0.4)" },
  FULFILLED: { color: "#4a7fa5", glow: "rgba(74,127,165,0.4)" },
  UNFULFILLED: { color: "rgba(240,244,248,0.38)", glow: "transparent" },
  PARTIALLY_FULFILLED: { color: "#e8a830", glow: "rgba(232,168,48,0.4)" },
  ACTIVE: { color: "#4ade80", glow: "rgba(74,222,128,0.4)" },
  DRAFT: { color: "rgba(240,244,248,0.38)", glow: "transparent" },
};

export function statusStyle(label: string) {
  return (
    STATUS_MAP[label?.toUpperCase()] ?? {
      color: "rgba(240,244,248,0.38)",
      glow: "transparent",
    }
  );
}

export function StatusPill({ label }: { label: string }) {
  const { color, glow } = statusStyle(label ?? "");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "monospace",
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          boxShadow: glow !== "transparent" ? `0 0 6px ${glow}` : "none",
        }}
      />
      {label}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "60px 40px",
        textAlign: "center",
        color: "rgba(240,244,248,0.2)",
        fontFamily: "monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div
      style={{
        padding: "48px 40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.08)",
          borderTopColor: "#e8a830",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Input / Textarea / Select ────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "9px 12px",
  color: "#f0f4f8",
  fontFamily: "Poppins, sans-serif",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box",
};

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputBase}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(232,168,48,0.4)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
      }
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{ ...inputBase, resize: "vertical" }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(232,168,48,0.4)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
      }
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputBase, cursor: "pointer" }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = "rgba(232,168,48,0.4)")
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#12161f" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

export function ActionButton({
  onClick,
  disabled,
  variant = "ghost",
  children,
  small,
}: {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: "green" | "red" | "ghost" | "gold";
  children: React.ReactNode;
  small?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    green: {
      background: "rgba(74,222,128,0.1)",
      border: "1px solid rgba(74,222,128,0.3)",
      color: "#4ade80",
    },
    red: {
      background: "rgba(248,113,113,0.1)",
      border: "1px solid rgba(248,113,113,0.3)",
      color: "#f87171",
    },
    gold: {
      background: "rgba(232,168,48,0.1)",
      border: "1px solid rgba(232,168,48,0.3)",
      color: "#e8a830",
    },
    ghost: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "rgba(240,244,248,0.6)",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 7,
        padding: small ? "5px 10px" : "8px 16px",
        fontFamily: "monospace",
        fontSize: small ? 8 : 9,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity 0.14s",
      }}
    >
      {children}
    </button>
  );
}
