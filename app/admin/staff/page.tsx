"use client";

import { useState, useEffect } from "react";

interface StaffMember {
  id: string;
  username: string;
  role: "owner" | "staff";
  createdAt?: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BACKEND HOOK: expects GET /api/admin/staff -> { staff: StaffMember[] }
  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setStaff(data.staff ?? []);
    } catch {
      setError("Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  // BACKEND HOOK: expects POST /api/admin/staff { username, password, role }
  // Backend must hash the password before storing.
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add staff member.");
        return;
      }
      setUsername("");
      setPassword("");
      setRole("staff");
      setShowAdd(false);
      loadStaff();
    } catch {
      setError("Failed to add staff member.");
    } finally {
      setSubmitting(false);
    }
  }

  // BACKEND HOOK: expects DELETE /api/admin/staff/:id
  async function handleRemove(id: string) {
    if (
      !confirm(
        "Remove this staff account? They will no longer be able to log in.",
      )
    )
      return;
    try {
      await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      loadStaff();
    } catch {
      setError("Failed to remove staff member.");
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "monospace",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(240,244,248,0.4)",
    marginBottom: "8px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#f0f4f8",
    fontFamily: "monospace",
    fontSize: "12px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        padding: "clamp(20px, 4vw, 40px)",
        color: "#f0f4f8",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(240,244,248,0.35)",
          marginBottom: 6,
        }}
      >
        Shoepreme
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            margin: 0,
          }}
        >
          STAFF ACCESS
        </h1>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{
            background: "#e8a830",
            color: "#0d1117",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {showAdd ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 20,
            fontFamily: "monospace",
            fontSize: 11,
            color: "#f87171",
          }}
        >
          {error}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={handleAdd}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 24,
            marginBottom: 28,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            maxWidth: 560,
          }}
        >
          <div>
            <label style={labelStyle}>Username</label>
            <input
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "owner" | "staff")}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="staff">Staff (Orders only)</option>
              <option value="owner">Owner (Full access)</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: submitting ? "rgba(232,168,48,0.5)" : "#e8a830",
                color: "#0d1117",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Adding..." : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(240,244,248,0.4)",
          }}
        >
          <span>Username</span>
          <span>Role</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {loading ? (
          <p
            style={{
              padding: 20,
              fontFamily: "monospace",
              fontSize: 11,
              color: "rgba(240,244,248,0.4)",
            }}
          >
            Loading...
          </p>
        ) : staff.length === 0 ? (
          <p
            style={{
              padding: 20,
              fontFamily: "monospace",
              fontSize: 11,
              color: "rgba(240,244,248,0.4)",
            }}
          >
            No staff accounts yet.
          </p>
        ) : (
          staff.map((s) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <span>{s.username}</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color:
                    s.role === "owner" ? "#e8a830" : "rgba(240,244,248,0.5)",
                }}
              >
                {s.role}
              </span>
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => handleRemove(s.id)}
                  style={{
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: 6,
                    padding: "6px 12px",
                    color: "#f87171",
                    fontFamily: "monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
