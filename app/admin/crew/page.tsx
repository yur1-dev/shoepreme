"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useToast,
  Toast,
  StatCard,
  FilterTabs,
  SearchInput,
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
  time: string;
  location: string;
  lat: number;
  lng: number;
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
  time: "",
  location: "",
  lat: "",
  lng: "",
  type: "RUN" as EventType,
  description: "",
  registrationUrl: "",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── DatePickerField ────────────────────────────────────────────────────────────
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
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const displayLabel = value
    ? new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "Select a date";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "10px 12px",
          color: value ? "#f5f7f9" : "rgba(245,247,249,0.35)",
          fontFamily: "monospace", fontSize: 12, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        {displayLabel}
        <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99997 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, width: 280,
            background: "#141922", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: 14, zIndex: 99998,
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button type="button" onClick={prevMonth} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(245,247,249,0.5)", cursor: "pointer", padding: "4px 9px", fontSize: 11 }}>←</button>
              <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 600, color: "#f5f7f9" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(245,247,249,0.5)", cursor: "pointer", padding: "4px 9px", fontSize: 11 }}>→</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
              {DAY_NAMES.map((d) => (
                <div key={d} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 8, fontWeight: 700, color: "rgba(245,247,249,0.3)", padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const iso = isoFor(day);
                const isBooked = bookedDates.has(iso);
                const isSelected = value === iso;
                const todayIso = new Date().toLocaleDateString("sv-SE");
                const isPast = iso < todayIso;
                return (
                  <button
                    type="button" key={iso}
                    onClick={() => { if (isPast) return; onChange(iso); setOpen(false); }}
                    disabled={isPast}
                    style={{
                      position: "relative", aspectRatio: "1", borderRadius: 6,
                      border: isSelected ? "1px solid #e8a830" : "1px solid transparent",
                      background: isSelected ? "rgba(232,168,48,0.15)" : "transparent",
                      color: isPast ? "rgba(240,244,248,0.15)" : isSelected ? "#e8a830" : "#f5f7f9",
                      fontFamily: "monospace", fontSize: 11,
                      cursor: isPast ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {day}
                    {isBooked && <span style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: "#f87171" }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
              <span style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(245,247,249,0.35)", letterSpacing: "0.05em" }}>Already has an event</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── MapPinPicker ───────────────────────────────────────────────────────────────
function MapPinPicker({
  lat, lng, onChange,
}: {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const hasPin = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  const baseLat = hasPin ? parseFloat(lat) : 6.1098;
  const baseLng = hasPin ? parseFloat(lng) : 125.172;
  const span = 0.03;

  const mapSrc = hasPin
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${baseLng - span},${baseLat - span},${baseLng + span},${baseLat + span}&layer=mapnik&marker=${lat},${lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${baseLng - span},${baseLat - span},${baseLng + span},${baseLat + span}&layer=mapnik`;

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    const newLng = (baseLng - span) + xPct * span * 2;
    const newLat = (baseLat + span) - yPct * span * 2;
    onChange(newLat.toFixed(5), newLng.toFixed(5));
  }

  return (
    <div>
      <p style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(245,247,249,0.35)", margin: "0 0 8px", letterSpacing: "0.04em" }}>
        Click the map to drop a pin, or type coordinates manually.
      </p>

      {/* Clickable map */}
      <div
        onClick={handleMapClick}
        style={{
          position: "relative", borderRadius: "10px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)", height: "180px",
          marginBottom: "8px", cursor: "crosshair",
        }}
      >
        <iframe
          key={`${lat}-${lng}`}
          src={mapSrc}
          width="100%" height="180"
          style={{ border: 0, display: "block", filter: "brightness(0.7) saturate(0.7)", pointerEvents: "none" }}
          loading="lazy"
          title="Pin picker"
        />
        {/* Overlay centre marker */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {hasPin ? (
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#e8a830", border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
          ) : (
            <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "6px 12px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(245,247,249,0.5)", letterSpacing: "0.08em" }}>CLICK TO PIN</span>
            </div>
          )}
        </div>
        {hasPin && (
          <div style={{ position: "absolute", bottom: "8px", left: "10px", background: "rgba(13,17,23,0.85)", border: "1px solid rgba(232,168,48,0.3)", borderRadius: "6px", padding: "3px 10px", pointerEvents: "none" }}>
            <span style={{ fontFamily: "monospace", fontSize: "8px", fontWeight: 700, color: "#e8a830" }}>
              {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Manual inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <TextInput value={lat} onChange={(v: string) => onChange(v, lng)} placeholder="Lat e.g. 6.1098" />
        <TextInput value={lng} onChange={(v: string) => onChange(lat, v)} placeholder="Lng e.g. 125.172" />
      </div>
    </div>
  );
}

// ── AdminCrewPage ──────────────────────────────────────────────────────────────
export default function AdminCrewPage() {
  const [events, setEvents] = useState<CrewEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [editing, setEditing] = useState<CrewEventRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEvent, setSelectedEvent] = useState<CrewEventRow | null>(null);
  const [registrants, setRegistrants] = useState<{ name: string; email: string; phone?: string; registeredAt: string }[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const { toast, showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/crew-events", { cache: "no-store" });
    const data = await res.json();
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

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
      time: ev.time ?? "",
      location: ev.location,
      lat: String(ev.lat ?? ""),
      lng: String(ev.lng ?? ""),
      type: ev.type,
      description: ev.description ?? "",
      registrationUrl: "",
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
      const url = editing ? `/api/admin/crew-events/${editing.id}` : "/api/admin/crew-events";
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

  async function openRegistrants(ev: CrewEventRow) {
    setSelectedEvent(ev);
    setRegLoading(true);
    try {
      const res = await fetch(`/api/admin/crew-events/${ev.id}/registrations`);
      const data = await res.json();
      setRegistrants(data.registrations ?? []);
    } catch { setRegistrants([]); } finally { setRegLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/crew-events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Event deleted"); await fetchEvents(); }
      else showToast("Failed: " + data.error, false);
    } finally { setActionLoading(null); }
  }

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const upcomingCount = events.filter((e) => new Date(e.isoDate) >= today).length;
  const pastCount = events.length - upcomingCount;

  const filtered = useMemo(() => {
    let list = events;
    if (filter === "UPCOMING") list = list.filter((e) => new Date(e.isoDate) >= today);
    if (filter === "PAST") list = list.filter((e) => new Date(e.isoDate) < today);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    return list;
  }, [events, filter, search, today]);

  return (
    <div style={{ padding: "32px 36px 60px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,244,248,0.28)", margin: "0 0 4px" }}>Shoepreme</p>
            <h1 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "2.4rem", letterSpacing: "0.04em", color: "#f0f4f8", margin: 0 }}>The Crew</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionButton onClick={fetchEvents} variant="ghost">↻ Refresh</ActionButton>
            <ActionButton onClick={openAdd} variant="green">+ Add Event</ActionButton>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          <StatCard label="Total Events" value={String(events.length)} sub="all time" />
          <StatCard label="Upcoming" value={String(upcomingCount)} color="#e8a830" sub="on the calendar" />
          <StatCard label="Past" value={String(pastCount)} sub="archived" />
        </div>

        {/* Filters + Search */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <FilterTabs
            tabs={[
              { label: "All", value: "ALL", count: events.length },
              { label: "Upcoming", value: "UPCOMING", count: upcomingCount },
              { label: "Past", value: "PAST", count: pastCount },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as any)}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search title, location…" />
        </div>

        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 160px 110px 160px", padding: "12px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "monospace", fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,244,248,0.28)" }}>
            <span>Date</span><span>Title</span><span>Location</span><span>Type</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {loading && <Spinner />}
          {!loading && filtered.length === 0 && <EmptyState label={search ? `No events matching "${search}"` : "No events yet"} />}

          {!loading && filtered.map((ev) => {
            const isPast = new Date(ev.isoDate) < today;
            const isBusy = actionLoading === ev.id;
            return (
              <div
                key={ev.id}
                onClick={() => openRegistrants(ev)}
                style={{ display: "grid", gridTemplateColumns: "110px 1fr 160px 110px 160px", padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", opacity: isPast ? 0.55 : 1, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,244,248,0.5)" }}>{formatDate(ev.isoDate)}</span>
                <div>
                  <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 600, color: "#f0f4f8", margin: "0 0 2px" }}>{ev.title}</p>
                  <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(240,244,248,0.32)", margin: 0 }}>{ev.description}</p>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(240,244,248,0.45)" }}>{ev.location}</span>
                <span style={{ fontFamily: "monospace", fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: TYPE_COLORS[ev.type] }}>{ev.type}</span>
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <ActionButton onClick={() => openEdit(ev)} variant="ghost" small>Edit</ActionButton>
                  <ActionButton onClick={() => handleDelete(ev.id)} disabled={isBusy} variant="red" small>{isBusy ? "…" : "Delete"}</ActionButton>
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
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 99998 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(460px, calc(100vw - 48px))", maxHeight: "85vh", overflowY: "auto", background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "28px", zIndex: 99999, display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.5rem", letterSpacing: "0.05em", color: "#f0f4f8", margin: 0 }}>
              {editing ? "Edit Event" : "Add Event"}
            </h3>

            <div>
              <FieldLabel>Title</FieldLabel>
              <TextInput value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} placeholder="SP Crew Morning Run" />
            </div>

            <div>
              <FieldLabel>Date</FieldLabel>
              <DatePickerField
                value={form.isoDate}
                onChange={(iso) => setForm({ ...form, isoDate: iso })}
                bookedDates={new Set(events.filter((e) => e.id !== editing?.id).map((e) => e.isoDate))}
              />
            </div>

            <div>
              <FieldLabel>Time</FieldLabel>
              <TextInput value={form.time} onChange={(v: string) => setForm({ ...form, time: v })} placeholder="6:00 AM gun start" />
            </div>

            <div>
              <FieldLabel>Location</FieldLabel>
              <TextInput value={form.location} onChange={(v: string) => setForm({ ...form, location: v })} placeholder="Koronadal City Sports Complex" />
            </div>

            <div>
              <FieldLabel>Location Pin (optional)</FieldLabel>
              <MapPinPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => setForm({ ...form, lat, lng })}
              />
            </div>

            {/* <div>
              <FieldLabel>Registration URL (optional)</FieldLabel>
              <TextInput value={form.registrationUrl} onChange={(v: string) => setForm({ ...form, registrationUrl: v })} placeholder="https://…" />
            </div> */}

            <div>
              <FieldLabel>Type</FieldLabel>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["RUN", "LAUNCH", "MEETUP", "RACE"] as EventType[]).map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", border: form.type === t ? `1px solid ${TYPE_COLORS[t]}` : "1px solid rgba(255,255,255,0.1)", background: form.type === t ? `${TYPE_COLORS[t]}18` : "transparent", color: form.type === t ? TYPE_COLORS[t] : "rgba(240,244,248,0.4)" }}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <TextArea value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "rgba(240,244,248,0.4)", fontFamily: "monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={actionLoading === "save"} style={{ flex: 2, padding: "13px", background: "#4ade80", border: "none", borderRadius: "10px", color: "#0d1117", fontFamily: "monospace", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}>
                {actionLoading === "save" ? "…" : editing ? "Save Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Registrants Drawer ── */}
      {selectedEvent && (
        <>
          <div onClick={() => setSelectedEvent(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 99996 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100vw)", background: "#0d1117", borderLeft: "1px solid rgba(255,255,255,0.08)", zIndex: 99997, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: "8px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,247,249,0.3)", margin: "0 0 4px" }}>Registrants</p>
                <h2 style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.4rem", letterSpacing: "0.05em", color: "#f0f4f8", margin: 0 }}>{selectedEvent.title}</h2>
                <p style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(245,247,249,0.3)", margin: "4px 0 0", letterSpacing: "0.04em" }}>{formatDate(selectedEvent.isoDate)} · {selectedEvent.location}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,247,249,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <div style={{ background: "rgba(232,168,48,0.08)", border: "1px solid rgba(232,168,48,0.2)", borderRadius: "10px", padding: "10px 18px", display: "inline-block" }}>
                <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.8rem", color: "#e8a830", margin: 0, lineHeight: 1 }}>{registrants.length}</p>
                <p style={{ fontFamily: "monospace", fontSize: "7px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,168,48,0.5)", margin: 0 }}>Registered</p>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {regLoading && <p style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(245,247,249,0.3)", textAlign: "center", marginTop: "40px" }}>Loading…</p>}
              {!regLoading && registrants.length === 0 && (
                <div style={{ textAlign: "center", marginTop: "60px" }}>
                  <p style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1.4rem", color: "rgba(245,247,249,0.12)", letterSpacing: "0.06em", margin: "0 0 6px" }}>No registrants yet</p>
                  <p style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(245,247,249,0.2)", margin: 0 }}>Registrations will appear here once customers sign up.</p>
                </div>
              )}
              {!regLoading && registrants.map((r, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(232,168,48,0.1)", border: "1px solid rgba(232,168,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: "1rem", color: "#e8a830" }}>{r.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px", fontWeight: 600, color: "#f0f4f8", margin: "0 0 2px" }}>{r.name}</p>
                    <p style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(245,247,249,0.4)", margin: 0, letterSpacing: "0.03em" }}>{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                  </div>
                  <p style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(245,247,249,0.25)", margin: 0, whiteSpace: "nowrap" }}>
                    {new Date(r.registeredAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}