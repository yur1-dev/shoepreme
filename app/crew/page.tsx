"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type EventType = "RUN" | "LAUNCH" | "MEETUP" | "RACE";
type EventStatus = "UPCOMING" | "PAST";

type CrewEvent = {
  id: string;
  date: string;
  month: string;
  year: string;
  isoDate: string; // "YYYY-MM-DD" — used by calendar
  title: string;
  location: string;
  type: EventType;
  status: EventStatus;
  description: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Data — swap with API / Mongoose later, same shape
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<
  EventType,
  { color: string; bg: string; border: string }
> = {
  RUN: {
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.08)",
    border: "rgba(45,212,191,0.3)",
  },
  LAUNCH: {
    color: "#e8a830",
    bg: "rgba(232,168,48,0.08)",
    border: "rgba(232,168,48,0.3)",
  },
  MEETUP: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.3)",
  },
  RACE: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.3)",
  },
};

const STATS = [
  { label: "Members", value: 47, suffix: "+" },
  { label: "Group Runs", value: 12, suffix: "" },
  { label: "KM Logged", value: 380, suffix: "+" },
  { label: "Cities", value: 3, suffix: "" },
];

const BENTO = [
  { src: null, label: "First Crew Run · Jun 15", caption: "Koronadal Oval", size: "hero" },
  { src: null, label: "Drop Night", caption: "Shoepreme Store", size: "sm" },
  { src: null, label: "Race Day", caption: "GenSan Oval", size: "sm" },
  { src: null, label: "Morning 5K", caption: "Sports Complex", size: "sm" },
  { src: null, label: "Crew Collab", caption: "Koronadal City", size: "sm" },
  { src: null, label: "Sunset Loop", caption: "Marbel Riverside", size: "sm" },
  { src: null, label: "Trail Session", caption: "Lake Sebu", size: "sm" },
  { src: null, label: "Podium Finish", caption: "Koronadal City", size: "sm" },
  { src: null, label: "Rest Day Fits", caption: "Crew HQ", size: "sm" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(1280);
  useEffect(() => {
    const upd = () => setW(window.innerWidth);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);
  return w;
}

function useCounter(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const p = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCounter
// ─────────────────────────────────────────────────────────────────────────────
function StatCounter({
  stat,
  last,
}: {
  stat: (typeof STATS)[number];
  last?: boolean;
}) {
  const { count, ref } = useCounter(stat.value);
  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        flex: 1,
        padding: "24px 16px",
        borderRight: last ? "none" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          lineHeight: 1,
          color: "#f5f7f9",
          letterSpacing: "0.04em",
        }}
      >
        {count}
        {stat.suffix}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "8px",
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(245,247,249,0.28)",
        }}
      >
        {stat.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BentoTile
// ─────────────────────────────────────────────────────────────────────────────
function BentoTile({
  item,
  style,
  hero = false,
}: {
  item: (typeof BENTO)[number];
  style?: React.CSSProperties;
  hero?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        background: hero ? "rgba(232,168,48,0.04)" : "rgba(255,255,255,0.03)",
        border: hero
          ? "1px solid rgba(232,168,48,0.18)"
          : "1px solid rgba(255,255,255,0.07)",
        ...style,
      }}
    >
      {/* ── swap this block for <img src={item.src} style={{width:"100%",height:"100%",objectFit:"cover"}} /> once you have photos ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <svg
          width={hero ? 40 : 26}
          height={hero ? 40 : 26}
          viewBox="0 0 24 24"
          fill="none"
          stroke={hero ? "rgba(232,168,48,0.3)" : "rgba(232,168,48,0.2)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "8px",
            color: "rgba(245,247,249,0.18)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Add Photo
        </span>
      </div>
      {hero && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            fontFamily: "monospace",
            fontSize: "7px",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#e8a830",
            background: "rgba(232,168,48,0.1)",
            border: "1px solid rgba(232,168,48,0.3)",
            borderRadius: "3px",
            padding: "4px 9px",
          }}
        >
          Featured
        </div>
      )}

      {/* Label overlay — keep this on top of the real image too */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: hero ? "48px 20px 18px" : "32px 16px 14px",
          background:
            "linear-gradient(to top, rgba(13,17,23,0.9) 0%, transparent 100%)",
        }}
      >
        <p
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: hero
              ? "clamp(1.3rem, 2.6vw, 1.9rem)"
              : "clamp(0.85rem, 1.6vw, 1.05rem)",
            letterSpacing: "0.04em",
            color: "#f5f7f9",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {item.label}
        </p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: hero ? "9px" : "8px",
            color: "rgba(245,247,249,0.35)",
            letterSpacing: "0.1em",
            margin: "3px 0 0",
          }}
        >
          {item.caption}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarView
// ─────────────────────────────────────────────────────────────────────────────
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
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarView({ events }: { events: CrewEvent[] }) {
  const today = new Date();
  const [yr, setYr] = useState(today.getFullYear());
  const [mo, setMo] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();

  const byDate: Record<string, CrewEvent[]> = {};
  events.forEach((ev) => {
    const d = new Date(ev.isoDate);
    if (d.getFullYear() === yr && d.getMonth() === mo) {
      const key = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(ev);
    }
  });

  const selectedEvents = selected ? byDate[selected] || [] : [];

  const prevMo = () => {
    if (mo === 0) {
      setYr((y) => y - 1);
      setMo(11);
    } else setMo((m) => m - 1);
    setSelected(null);
  };
  const nextMo = () => {
    if (mo === 11) {
      setYr((y) => y + 1);
      setMo(0);
    } else setMo((m) => m + 1);
    setSelected(null);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={prevMo}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "6px 14px",
            color: "rgba(245,247,249,0.4)",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          ←
        </button>
        <span
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            fontSize: "1.7rem",
            letterSpacing: "0.06em",
            color: "#f5f7f9",
          }}
        >
          {MONTH_NAMES[mo]} {yr}
        </span>
        <button
          onClick={nextMo}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "6px 14px",
            color: "rgba(245,247,249,0.4)",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          →
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
        }}
      >
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.22)",
              paddingBottom: "10px",
            }}
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvents = !!byDate[key];
          const isSel = selected === key;
          const isToday =
            day === today.getDate() &&
            mo === today.getMonth() &&
            yr === today.getFullYear();
          return (
            <div
              key={key}
              onClick={() => hasEvents && setSelected(isSel ? null : key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 4px 6px",
                borderRadius: "8px",
                cursor: hasEvents ? "pointer" : "default",
                background: isSel
                  ? "rgba(232,168,48,0.12)"
                  : isToday
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                border: isSel
                  ? "1px solid rgba(232,168,48,0.4)"
                  : isToday
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: isSel
                    ? "#e8a830"
                    : isToday
                      ? "#f5f7f9"
                      : "rgba(245,247,249,0.4)",
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {day}
              </span>
              {hasEvents && (
                <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                  {byDate[key].slice(0, 3).map((ev, idx) => (
                    <span
                      key={idx}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: TYPE_STYLES[ev.type].color,
                        display: "block",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedEvents.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {selectedEvents.map((ev) => {
            const t = TYPE_STYLES[ev.type];
            return (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  padding: "14px 18px",
                }}
              >
                <div
                  style={{
                    width: 3,
                    alignSelf: "stretch",
                    borderRadius: "2px",
                    background: t.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "7px",
                      fontWeight: 800,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      color: t.color,
                      background: t.bg,
                      border: `1px solid ${t.border}`,
                      display: "inline-block",
                      marginBottom: "6px",
                    }}
                  >
                    {ev.type}
                  </span>
                  <p
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.15rem",
                      letterSpacing: "0.04em",
                      color: "#f5f7f9",
                      margin: "0 0 2px",
                      lineHeight: 1,
                    }}
                  >
                    {ev.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "rgba(245,247,249,0.3)",
                      margin: "0 0 4px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {ev.location}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "rgba(245,247,249,0.4)",
                      margin: 0,
                      lineHeight: 1.7,
                    }}
                  >
                    {ev.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function TheCrewPage() {
  const [events, setEvents] = useState<CrewEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [view, setView] = useState<"LIST" | "CALENDAR">("LIST");
  const width = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width < 900;

  useEffect(() => {
    fetch("/api/crew-events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events ?? []))
      .finally(() => setLoadingEvents(false));
  }, []);

  const filtered =
    filter === "ALL" ? events : events.filter((e) => e.status === filter);
  const nextEvent = events.find((e) => e.status === "UPCOMING");

  return (
    <main style={{ minHeight: "100vh", background: "#0d1117" }}>
      <Navbar />

      <div>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "clamp(140px, 18vw, 200px) 24px clamp(48px, 7vw, 80px)",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(232,168,48,0.14) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(232,168,48,0.05) 0%, transparent 70%)",
            }}
          />
          {/* Noise */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.04,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
              backgroundSize: "160px 160px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#e8a830",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.35)",
                }}
              >
                Shoepreme · Est. 2025
              </span>
            </div>

            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(5rem, 16vw, 10rem)",
                lineHeight: 0.9,
                letterSpacing: "0.04em",
                color: "#f5f7f9",
                margin: 0,
              }}
            >
              THE
              <br />
              <span
                style={{
                  color: "#e8a830",
                  textShadow: "0 0 80px rgba(232,168,48,0.35)",
                }}
              >
                CREW.
              </span>
            </h1>

            <p
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                letterSpacing: "0.06em",
                color: "rgba(245,247,249,0.32)",
                lineHeight: 1.8,
                marginTop: "20px",
                marginBottom: "36px",
                maxWidth: "320px",
              }}
            >
              Real shoes. Real runners. Zero fakes, ever.
              <br />
              Based in South PH — open to everyone.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <a
                href="#join"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#e8a830",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "13px 28px",
                  borderRadius: "2px",
                  textDecoration: "none",
                }}
              >
                Join The Crew
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
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="#events"
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.3)",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.12)",
                  paddingBottom: "2px",
                }}
              >
                See Events
              </a>
            </div>
          </div>
        </section>

        {/* ── ANIMATED STATS BAR ───────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 40px) clamp(40px, 6vw, 60px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {STATS.map((stat, i) => (
              <StatCounter key={i} stat={stat} last={i === STATS.length - 1} />
            ))}
          </div>
        </section>

        {/* ── NEXT EVENT BANNER ────────────────────────────────────────────── */}
        {nextEvent && (
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "0 clamp(16px, 4vw, 40px) 32px",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                background: "rgba(232,168,48,0.06)",
                border: "1px solid rgba(232,168,48,0.22)",
                borderRadius: "12px",
                padding: "16px 24px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(ellipse 50% 100% at 0% 50%, rgba(232,168,48,0.07) 0%, transparent 65%)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#e8a830",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "#e8a830",
                  }}
                >
                  Next Up
                </span>
              </div>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <p
                  style={{
                    fontFamily: "Bebas Neue, sans-serif",
                    fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
                    letterSpacing: "0.04em",
                    color: "#f5f7f9",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {nextEvent.title}
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "rgba(245,247,249,0.3)",
                    letterSpacing: "0.1em",
                    margin: "4px 0 0",
                  }}
                >
                  {nextEvent.date} {nextEvent.month} {nextEvent.year} ·{" "}
                  {nextEvent.location}
                </p>
              </div>
              <a
                href="#events"
                style={{
                  fontFamily: "monospace",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#e8a830",
                  border: "1px solid rgba(232,168,48,0.4)",
                  borderRadius: "2px",
                  padding: "8px 16px",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                Details →
              </a>
            </div>
          </div>
        )}

        {/* ── PERKS ────────────────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "clamp(40px, 6vw, 72px) clamp(16px, 4vw, 40px)",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.22)",
              marginBottom: "8px",
            }}
          >
            Member Benefits
          </p>
          <h2
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              color: "#f5f7f9",
              letterSpacing: "0.03em",
              lineHeight: 1,
              marginBottom: "32px",
            }}
          >
            What You Get.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {[
              {
                label: "Early Access",
                detail:
                  "Get notified on new drops before anyone else. JP, TW, and US shipments — you see them first.",
                icon: (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e8a830"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
              },
              {
                label: "Member Discounts",
                detail:
                  "Exclusive pricing on select releases. More you run with us, more you save.",
                icon: (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e8a830"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                ),
              },
              {
                label: "Events & Group Runs",
                detail:
                  "Weekly runs, race day meetups, and drop events. Show up, run, repeat.",
                icon: (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e8a830"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
              },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {p.icon}
                <div>
                  <p
                    style={{
                      fontFamily: "Bebas Neue, sans-serif",
                      fontSize: "1.3rem",
                      letterSpacing: "0.04em",
                      color: "#f5f7f9",
                      margin: "0 0 6px",
                      lineHeight: 1,
                    }}
                  >
                    {p.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.38)",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {p.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BENTO — CREW RUNS ────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 40px) clamp(40px, 6vw, 72px)",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(245,247,249,0.22)",
              marginBottom: "8px",
            }}
          >
            In The Streets
          </p>
          <h2
            style={{
              fontFamily: "Bebas Neue, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              color: "#f5f7f9",
              letterSpacing: "0.03em",
              lineHeight: 1,
              marginBottom: "20px",
            }}
          >
            Crew Runs.
          </h2>

          {isMobile ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {BENTO.map((item, i) => (
                <BentoTile
                  key={i}
                  item={item}
                  hero={item.size === "hero"}
                  style={{ height: item.size === "hero" ? "280px" : "200px" }}
                />
              ))}
            </div>
          ) : isTablet ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
              }}
            >
              {BENTO.map((item, i) => (
                <BentoTile
                  key={i}
                  item={item}
                  hero={item.size === "hero"}
                  style={{
                    height: item.size === "hero" ? "320px" : "200px",
                    gridColumn: item.size === "hero" ? "span 2" : "span 1",
                  }}
                />
              ))}
            </div>
          ) : (
            // Desktop bento: true 3x3, hero anchors top-left 2x2 block
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "repeat(3, 180px)",
                gap: "12px",
              }}
            >
              <div style={{ gridColumn: "1 / 3", gridRow: "1 / 3" }}>
                <BentoTile item={BENTO[0]} hero style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }}>
                <BentoTile item={BENTO[1]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "4 / 5", gridRow: "1 / 2" }}>
                <BentoTile item={BENTO[2]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "3 / 4", gridRow: "2 / 3" }}>
                <BentoTile item={BENTO[3]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "4 / 5", gridRow: "2 / 3" }}>
                <BentoTile item={BENTO[4]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "1 / 2", gridRow: "3 / 4" }}>
                <BentoTile item={BENTO[5]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "2 / 3", gridRow: "3 / 4" }}>
                <BentoTile item={BENTO[6]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "3 / 4", gridRow: "3 / 4" }}>
                <BentoTile item={BENTO[7]} style={{ height: "100%" }} />
              </div>
              <div style={{ gridColumn: "4 / 5", gridRow: "3 / 4" }}>
                <BentoTile item={BENTO[8]} style={{ height: "100%" }} />
              </div>
            </div>
          )}

          <p
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              color: "rgba(245,247,249,0.18)",
              letterSpacing: "0.1em",
              marginTop: "14px",
              textAlign: "right",
            }}
          >
            Drop your run photos — tag us or DM @shoepreme
          </p>
        </section>

        {/* ── EVENTS ───────────────────────────────────────────────────────── */}
        <section
          id="events"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 40px) clamp(40px, 6vw, 72px)",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(245,247,249,0.22)",
                  marginBottom: "8px",
                }}
              >
                Schedule
              </p>
              <h2
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  color: "#f5f7f9",
                  letterSpacing: "0.03em",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Events.
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* List / Calendar toggle */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "4px",
                }}
              >
                {(["LIST", "CALENDAR"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "6px 12px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      border: "none",
                      background:
                        view === v ? "rgba(232,168,48,0.15)" : "transparent",
                      color: view === v ? "#e8a830" : "rgba(245,247,249,0.28)",
                      transition: "all 0.15s",
                    }}
                  >
                    {v === "LIST" ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    ) : (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    )}
                    {v}
                  </button>
                ))}
              </div>

              {/* Filter pills — only in list view */}
              {view === "LIST" &&
                (["ALL", "UPCOMING", "PAST"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      padding: "7px 14px",
                      borderRadius: "999px",
                      cursor: "pointer",
                      border:
                        filter === f
                          ? "1px solid #e8a830"
                          : "1px solid rgba(255,255,255,0.1)",
                      background: filter === f ? "#e8a830" : "transparent",
                      color: filter === f ? "#0d1117" : "rgba(245,247,249,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {f}
                  </button>
                ))}
            </div>
          </div>

          {/* Calendar view */}
          {view === "CALENDAR" ? (
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "clamp(20px, 4vw, 32px)",
              }}
            >
              <CalendarView events={events} />
            </div>
          ) : (
            /* List view */
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {filtered.map((ev) => {
                const t = TYPE_STYLES[ev.type];
                const isPast = ev.status === "PAST";
                return (
                  <div
                    key={ev.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "20px",
                      flexWrap: "wrap",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${isPast ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: "12px",
                      padding: "18px 22px",
                      opacity: isPast ? 0.5 : 1,
                    }}
                  >
                    {/* Date block */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: "44px",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "2.4rem",
                          lineHeight: 1,
                          color: "#f5f7f9",
                        }}
                      >
                        {ev.date}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "8px",
                          fontWeight: 800,
                          letterSpacing: "0.2em",
                          color: "#e8a830",
                          textTransform: "uppercase",
                        }}
                      >
                        {ev.month}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "8px",
                          color: "rgba(245,247,249,0.2)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {ev.year}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "1px",
                        alignSelf: "stretch",
                        background: "rgba(255,255,255,0.06)",
                        flexShrink: 0,
                      }}
                    />
                    {/* Content */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: "200px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "7px",
                            fontWeight: 800,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            padding: "4px 9px",
                            borderRadius: "3px",
                            color: t.color,
                            background: t.bg,
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          {ev.type}
                        </span>
                        {isPast && (
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "7px",
                              color: "rgba(245,247,249,0.18)",
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                            }}
                          >
                            Past
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontFamily: "Bebas Neue, sans-serif",
                          fontSize: "clamp(1rem, 2vw, 1.25rem)",
                          letterSpacing: "0.04em",
                          color: "#f5f7f9",
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        {ev.title}
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          color: "rgba(245,247,249,0.28)",
                          margin: 0,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {ev.location}
                      </p>
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          color: "rgba(245,247,249,0.38)",
                          margin: 0,
                          lineHeight: 1.7,
                          maxWidth: "480px",
                        }}
                      >
                        {ev.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!loadingEvents && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.18)",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    No events yet
                  </p>
                </div>
              )}
              {loadingEvents && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "rgba(245,247,249,0.18)",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Loading events…
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── JOIN CTA ─────────────────────────────────────────────────────── */}
        <section
          id="join"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            overflow: "hidden",
            padding: "clamp(64px, 10vw, 120px) 24px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,168,48,0.09) 0%, transparent 65%)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              maxWidth: "480px",
              width: "100%",
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(245,247,249,0.22)",
                margin: 0,
              }}
            >
              The Crew · Open Enrollment
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
                letterSpacing: "0.03em",
                lineHeight: 1,
                color: "#f5f7f9",
                margin: 0,
              }}
            >
              Run With <span style={{ color: "#e8a830" }}>Us.</span>
            </h2>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "rgba(245,247,249,0.32)",
                lineHeight: 1.8,
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              No gatekeeping. No subscription fee.
              <br />
              Just real people running in real shoes.
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  flex: 1,
                  minWidth: "180px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "2px",
                  padding: "12px 16px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#f5f7f9",
                  letterSpacing: "0.05em",
                  outline: "none",
                }}
              />
              <button
                style={{
                  background: "#e8a830",
                  color: "#0d1117",
                  fontFamily: "monospace",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "12px 24px",
                  borderRadius: "2px",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Join
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "8px",
                color: "rgba(245,247,249,0.18)",
                letterSpacing: "0.06em",
                margin: 0,
              }}
            >
              Early access + event alerts. No spam.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
