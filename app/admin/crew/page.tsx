"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

type EventType = "RUN" | "LAUNCH" | "MEETUP" | "RACE";

interface CrewEventRow {
  id: string;
  title: string;
  isoDate: string;
  location: string;
  type: EventType;
  description: string;
}

const TYPE_COLORS: Record<EventType, string> = {
  RUN: "#2dd4bf",
  LAUNCH: "#e8a830",
  MEETUP: "#a78bfa",
  RACE: "#f87171",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EMPTY_FORM = {
  title: "",
  isoDate: "",
  location: "",
  type: "RUN" as EventType,
  description: "",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePickerField({
  value,
  onChange,
  bookedDates,
}: {
  value: string;
  onChange: (iso: string) => void;
  bookedDates: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  function isoFor(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  const displayLabel = value
    ? new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "10px 12px",
          color: value ? "#f5f7f9" : "rgba(245,247,249,0.35)",
          fontFamily: "monospace",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {displayLabel}
        <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 99997 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 280,
              background: "#141922",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 14,
              zIndex: 99998,
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "rgba(245,247,249,0.5)",
                  cursor: "pointer",
                  padding: "4px 9px",
                  fontSize: 11,
                }}
              >
                ←
              </button>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#f5f7f9",
                }}
              >
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "rgba(245,247,249,0.5)",
                  cursor: "pointer",
                  padding: "4px 9px",
                  fontSize: 11,
                }}
              >
                →
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                marginBottom: 4,
              }}
            >
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "rgba(245,247,249,0.3)",
                    padding: "4px 0",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
              }}
            >
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const iso = isoFor(day);
                const isBooked = bookedDates.has(iso);
                const isSelected = value === iso;
                return (
                  <button
                    type="button"
                    key={iso}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      borderRadius: 6,
                      border: isSelected
                        ? "1px solid #e8a830"
                        : "1px solid transparent",
                      background: isSelected
                        ? "rgba(232,168,48,0.15)"
                        : "transparent",
                      color: isSelected ? "#e8a830" : "#f5f7f9",
                      fontFamily: "monospace",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day}
                    {isBooked && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 3,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#f87171",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#f87171",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(245,247,249,0.35)",
                  letterSpacing: "0.05em",
                }}
              >
                Already has an event
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminCrewPage() {
  const [events, setEvents] = useState<CrewEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [editing, setEditing] = useState<CrewEventRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { toast, showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/crew-events", { cache: "no-store" });
    const data = await res.json();
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(ev: CrewEventRow) {
    setEditing(ev);
    setForm({
      title: ev.title,
      isoDate: ev.isoDate,
      location: ev.location,
      type: ev.type,
      description: ev.description ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.isoDate || !form.location.trim()) {
      showToast("Title, date, and location are required", false);
      return;
    }
    setActionLoading("save");
    try {
      const url = editing
        ? `/api/admin/crew-events/${editing.id}`
        : "/api/admin/crew-events";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editing ? "Event updated ✓" : "Event added ✓");
        setShowForm(false);
        await fetchEvents();
      } else {
        showToast("Failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/crew-events/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Event deleted");
        await fetchEvents();
      } else {
        showToast("Failed: " + data.error, false);
      }
    } finally {
      setActionLoading(null);
    }
  }

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingCount = events.filter(
    (e) => new Date(e.isoDate) >= today,
  ).length;
  const pastCount = events.length - upcomingCount;

  const filtered = useMemo(() => {
    let list = events;
    if (filter === "UPCOMING")
      list = list.filter((e) => new Date(e.isoDate) >= today);
    if (filter === "PAST")
      list = list.filter((e) => new Date(e.isoDate) < today);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, filter, search, today]);

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
              The Crew
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionButton onClick={fetchEvents} variant="ghost">
              ↻ Refresh
            </ActionButton>
            <ActionButton onClick={openAdd} variant="green">
              + Add Event
            </ActionButton>
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <StatCard
            label="Total Events"
            value={String(events.length)}
            sub="all time"
          />
          <StatCard
            label="Upcoming"
            value={String(upcomingCount)}
            color="#e8a830"
            sub="on the calendar"
          />
          <StatCard label="Past" value={String(pastCount)} sub="archived" />
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
              { label: "All", value: "ALL", count: events.length },
              { label: "Upcoming", value: "UPCOMING", count: upcomingCount },
              { label: "Past", value: "PAST", count: pastCount },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as any)}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search title, location…"
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
              gridTemplateColumns: "110px 1fr 160px 110px 160px",
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
            <span>Date</span>
            <span>Title</span>
            <span>Location</span>
            <span>Type</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {loading && <Spinner />}

          {!loading && filtered.length === 0 && (
            <EmptyState
              label={
                search ? `No events matching "${search}"` : "No events yet"
              }
            />
          )}

          {!loading &&
            filtered.map((ev) => {
              const isPast = new Date(ev.isoDate) < today;
              const isBusy = actionLoading === ev.id;
              return (
                <div
                  key={ev.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px 1fr 160px 110px 160px",
                    padding: "14px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    alignItems: "center",
                    opacity: isPast ? 0.55 : 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "rgba(240,244,248,0.5)",
                    }}
                  >
                    {formatDate(ev.isoDate)}
                  </span>
                  <div>
                    <p
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#f0f4f8",
                        margin: "0 0 2px",
                      }}
                    >
                      {ev.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        color: "rgba(240,244,248,0.32)",
                        margin: 0,
                      }}
                    >
                      {ev.description}
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "rgba(240,244,248,0.45)",
                    }}
                  >
                    {ev.location}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: TYPE_COLORS[ev.type],
                    }}
                  >
                    {ev.type}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      justifyContent: "flex-end",
                    }}
                  >
                    <ActionButton
                      onClick={() => openEdit(ev)}
                      variant="ghost"
                      small
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleDelete(ev.id)}
                      disabled={isBusy}
                      variant="red"
                      small
                    >
                      {isBusy ? "…" : "Delete"}
                    </ActionButton>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <Toast toast={toast} />

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <>
          <div
            onClick={() => setShowForm(false)}
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
              width: "min(460px, calc(100vw - 48px))",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "28px",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "1.5rem",
                letterSpacing: "0.05em",
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              {editing ? "Edit Event" : "Add Event"}
            </h3>

            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput
                value={form.title}
                onChange={(v: string) => setForm({ ...form, title: v })}
                placeholder="SP Crew Morning Run"
              />
            </div>

            <div>
              <FieldLabel>Date</FieldLabel>
              <DatePickerField
                value={form.isoDate}
                onChange={(iso) => setForm({ ...form, isoDate: iso })}
                bookedDates={
                  new Set(
                    events
                      .filter((e) => e.id !== editing?.id)
                      .map((e) => e.isoDate),
                  )
                }
              />
            </div>

            <div>
              <FieldLabel>Location</FieldLabel>
              <TextInput
                value={form.location}
                onChange={(v: string) => setForm({ ...form, location: v })}
                placeholder="Koronadal City Sports Complex"
              />
            </div>

            <div>
              <FieldLabel>Type</FieldLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["RUN", "LAUNCH", "MEETUP", "RACE"] as EventType[]).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontFamily: "monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        border:
                          form.type === t
                            ? `1px solid ${TYPE_COLORS[t]}`
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          form.type === t
                            ? `${TYPE_COLORS[t]}18`
                            : "transparent",
                        color:
                          form.type === t
                            ? TYPE_COLORS[t]
                            : "rgba(240,244,248,0.4)",
                      }}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <TextArea
                value={form.description}
                onChange={(v: string) => setForm({ ...form, description: v })}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: 8 }}>
              <button
                onClick={() => setShowForm(false)}
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
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading === "save"}
                style={{
                  flex: 2,
                  padding: "13px",
                  background: "#4ade80",
                  border: "none",
                  borderRadius: "10px",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {actionLoading === "save"
                  ? "…"
                  : editing
                    ? "Save Changes"
                    : "Add Event"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
