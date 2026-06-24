"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroProduct = {
  id: string;
  brand: string;
  name: string;
  sub: string;
  price: string;
  tag: string;
  handle: string;
  image: string | null;
  glow: string;
  tagColor: string;
  features?: string[];
  imgX?: number;
  imgY?: number;
  imgScale?: number;
  rotate?: number;
};

const FALLBACK: HeroProduct[] = [
  {
    id: "01",
    brand: "ASICS",
    name: "NOVABLAST 5",
    sub: "Max Cushion",
    price: "₱7,200",
    tag: "IN STOCK",
    handle: "products",
    image: "/shoes/novablast-5.png",
    glow: "45,212,191",
    tagColor: "#2dd4bf",
    features: ["FF BLAST+ ECO Foam", "Breathable Knit", "230g Lightweight"],
  },
  {
    id: "02",
    brand: "ASICS",
    name: "GEL-NIMBUS 27",
    sub: "Max Cushion",
    price: "₱7,990",
    tag: "IN STOCK",
    handle: "products",
    image: "/shoes/gel-nimbus-27.png",
    glow: "195,230,64",
    tagColor: "#c3e640",
    features: ["PureGEL Cushioning", "OrthoLite Insole", "Plush Daily Ride"],
  },
  {
    id: "03",
    brand: "ADIDAS",
    name: "ADIZERO PRIME X 2.0",
    sub: "Elite Racing",
    price: "₱14,950",
    tag: "IN STOCK",
    handle: "adizero-prime-x-2-0-strung",
    image: "/shoes/adizero-prime-x-strung.png",
    glow: "255,160,50",
    tagColor: "#ff9f1a",
    features: ["STRUNG Upper", "Lightstrike Pro", "Carbon ENERGYRODS"],
  },
];

const AUTO_MS = 3400;

export default function Hero({
  featuredProducts,
}: {
  featuredProducts?: HeroProduct[];
}) {
  const PRODUCTS = featuredProducts?.length ? featuredProducts : FALLBACK;
  const n = PRODUCTS.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, n]);

  const go = (i: number) => setActive(((i % n) + n) % n);

  function getOffset(i: number) {
    let diff = i - active;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    return diff;
  }

  const cur = PRODUCTS[active];

  // chip positions relative to card
  const CHIP_POS = [
    { top: "8%", left: "-22%" },
    { top: "42%", right: "-24%" },
    { bottom: "12%", left: "-20%" },
  ];

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-[1000ms]"
        style={{
          zIndex: 1,
          background: `
          radial-gradient(ellipse 80% 50% at 50% 0%,   rgba(${cur.glow},0.22) 0%, transparent 60%),
          radial-gradient(ellipse 55% 35% at 50% 100%, rgba(${cur.glow},0.08) 0%, transparent 65%),
          radial-gradient(ellipse 80% 60% at 50% 50%,  rgba(${cur.glow},0.05) 0%, transparent 72%)
        `,
        }}
        aria-hidden="true"
      />
      <section
        className="relative w-full bg-[#0d1117]"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingTop: "101px",
        }}
      >
        {/* Noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
            backgroundSize: "160px 160px",
            opacity: 0.55,
          }}
          aria-hidden="true"
        />

        {/* ─── HEADLINE ─── */}
        <div className="relative z-10 shrink-0 flex flex-col items-center text-center pt-10 pb-8 px-6">
          {/* Kicker */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[6px] h-[6px] rounded-full bg-[#e8a830] shrink-0 animate-[kDot_2s_ease-in-out_infinite]" />
            <span className="font-mono text-[9px] font-extrabold tracking-[0.26em] uppercase text-white/40">
              SS26 · LIVE NOW
            </span>
            <span className="w-px h-[10px] bg-white/10" />
            <span className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-[#e8a830]/50">
              PH · JP · TW · US
            </span>
          </div>
          {/* H1 */}
          <h1
            className="font-['Bebas_Neue'] leading-none tracking-[0.02em] m-0"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
          >
            <span className="text-[#f5f7f9]">BUILT FOR THE </span>
            <span
              className="text-[#e8a830]"
              style={{ textShadow: "0 0 60px rgba(232,168,48,0.3)" }}
            >
              REAL.
            </span>
          </h1>
        </div>

        {/* ─── STAGE ─── */}
        {/*
        Key: stage is position:relative, full width, fixed height.
        Cards are position:absolute with left:50% + translateX(-50%) so they
        all anchor to the true horizontal center of this container.
      */}
        <div
          className="relative z-10 w-full shrink-0"
          style={{ height: "clamp(420px, 58vh, 660px)" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Center spot glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-[background] duration-[800ms]"
            style={{
              background: `radial-gradient(ellipse 52% 68% at 50% 50%, rgba(${cur.glow},0.22) 0%, transparent 68%)`,
            }}
            aria-hidden="true"
          />

          {/* Floor shadow */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "6%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "clamp(160px, 22vw, 300px)",
              height: "48px",
              filter: "blur(20px)",
              background: `radial-gradient(ellipse at center, rgba(${cur.glow},0.45) 0%, transparent 75%)`,
              transition: "background 0.8s ease",
            }}
            aria-hidden="true"
          />

          {/* Rotating ring */}
          <svg
            className="absolute pointer-events-none animate-[ringSpin_40s_linear_infinite]"
            style={{
              top: "50%",
              left: "50%",
              width: "clamp(250px, 36vw, 460px)",
              height: "clamp(250px, 36vw, 460px)",
              transform: "translate(-50%, -50%)",
            }}
            viewBox="0 0 400 400"
            aria-hidden="true"
          >
            <circle
              cx="200"
              cy="200"
              r="178"
              fill="none"
              stroke={`rgba(${cur.glow},0.2)`}
              strokeWidth="1"
              strokeDasharray="3 14"
            />
          </svg>

          {/* Prev arrow */}
          {n > 1 && (
            <button
              onClick={() => go(active - 1)}
              aria-label="Previous"
              className="absolute z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/55 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-white"
              style={{
                top: "50%",
                left: "clamp(12px, 3vw, 48px)",
                transform: "translateY(-50%)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M15 6l-6 6 6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Cards */}
          {PRODUCTS.map((p, i) => {
            const offset = getOffset(i);
            const abs = Math.abs(offset);
            if (abs > 2) return null;

            const depth = Math.min(abs, 2);
            const dir = offset === 0 ? 0 : offset > 0 ? -1 : 1;
            const isActive = offset === 0;
            const tx = p.imgX ?? 0;
            const ty = p.imgY ?? 0;
            const sc = p.imgScale ?? 1;
            const tilt = p.rotate ?? (isActive ? 0 : dir * 3);

            const cardW = "clamp(180px, 24vw, 320px)";
            const spreadPx =
              typeof window !== "undefined"
                ? Math.min(window.innerWidth * 0.22, 240)
                : 240;

            return (
              <button
                key={`${p.handle}-${i}`}
                aria-label={p.name}
                onClick={() => go(i)}
                className="absolute p-0 bg-transparent border-none cursor-pointer will-change-transform"
                style={{
                  top: "44%",
                  left: "50%",
                  width: cardW,
                  transform: `translate(-50%, -50%) translateX(${offset * 240}px) scale(${depth === 0 ? 1 : depth === 1 ? 0.72 : 0.5}) rotateY(${depth === 0 ? 0 : dir * (depth === 1 ? 28 : 40)}deg)`,
                  opacity: depth === 0 ? 1 : depth === 1 ? 0.48 : 0.14,
                  filter:
                    depth === 0 ? "none" : `blur(${depth === 1 ? 1.5 : 3.5}px)`,
                  zIndex: 10 - depth,
                  perspective: "1000px",
                  transition:
                    "transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, filter 0.5s ease",
                }}
              >
                {/* Glass plate */}
                <div
                  className={`plate-sheen relative w-full overflow-hidden rounded-[18px] border transition-[box-shadow,border-color] duration-500 ${isActive ? "border-white/20 active-plate" : "border-white/[0.07]"}`}
                  style={{
                    aspectRatio: "1 / 1",
                    background: `linear-gradient(145deg, rgba(${p.glow},0.16) 0%, rgba(${p.glow},0.02) 100%)`,
                    boxShadow: isActive
                      ? `0 36px 80px rgba(0,0,0,0.55), 0 0 60px rgba(${p.glow},0.1)`
                      : "0 16px 40px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Tag badge */}
                  <span
                    className="absolute top-3 left-3 z-[2] font-mono font-extrabold uppercase rounded-[3px] border"
                    style={{
                      fontSize: "6.5px",
                      letterSpacing: "0.22em",
                      padding: "4px 9px",
                      color: p.tagColor,
                      borderColor: `rgba(${p.glow},0.4)`,
                      background: `rgba(${p.glow},0.1)`,
                    }}
                  >
                    {p.tag}
                  </span>
                </div>

                {/* Shoe — overflows plate on all sides */}
                <div
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    top: "-18%",
                    left: "-24%",
                    right: "-24%",
                    bottom: "-18%",
                    zIndex: 3,
                  }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      animation: isActive
                        ? "shoeFloat 3.6s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain"
                        style={{
                          transform: `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${tilt}deg)`,
                          filter: `drop-shadow(0 26px 32px rgba(0,0,0,0.6)) drop-shadow(0 0 ${isActive ? 52 : 24}px rgba(${p.glow},${isActive ? 0.36 : 0.14}))`,
                          transition: "transform 0.5s ease, filter 0.5s ease",
                        }}
                      />
                    ) : (
                      <svg
                        className="w-[76%]"
                        viewBox="0 0 220 110"
                        fill="none"
                        style={{
                          filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.5))",
                        }}
                      >
                        <path
                          d="M18 80 C28 55 55 36 88 30 C115 25 142 34 162 46 C172 52 180 52 186 49 L190 57 C183 65 172 65 160 62 C138 57 115 64 88 70 C62 76 38 78 18 80 Z"
                          fill={`rgba(${p.glow},0.22)`}
                          stroke={`rgba(${p.glow},0.45)`}
                          strokeWidth="1.6"
                        />
                        <path
                          d="M88 30 C98 20 116 18 130 22"
                          stroke={`rgba(${p.glow},0.35)`}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M18 80 C38 84 80 86 120 82 C150 79 175 70 190 62"
                          fill={`rgba(${p.glow},0.14)`}
                          stroke={`rgba(${p.glow},0.28)`}
                          strokeWidth="1.4"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Feature chips — desktop only, active card only */}
                {isActive && p.features && (
                  <div
                    className="absolute inset-0 pointer-events-none hidden lg:block"
                    style={{ zIndex: 4 }}
                  >
                    {p.features.slice(0, 3).map((f, fi) => (
                      <span
                        key={fi}
                        className="absolute inline-flex items-center gap-1.5 font-mono font-bold tracking-[0.08em] text-white/75 rounded-full whitespace-nowrap backdrop-blur-md"
                        style={{
                          ...CHIP_POS[fi],
                          fontSize: "8px",
                          padding: "6px 11px",
                          border: `1px solid rgba(${p.glow},0.4)`,
                          background: "rgba(13,17,23,0.65)",
                          opacity: isActive ? 1 : 0,
                          transform: isActive
                            ? "none"
                            : "translateY(4px) scale(0.95)",
                          transition: `opacity 0.4s ease ${fi * 120}ms, transform 0.4s ease ${fi * 120}ms`,
                        }}
                      >
                        <span
                          className="w-[5px] h-[5px] rounded-full shrink-0"
                          style={{ background: p.tagColor }}
                        />
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Caption below card */}
                <div
                  className="mt-4 text-center"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(0)" : "translateY(6px)",
                    pointerEvents: isActive ? "auto" : "none",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                    position: "relative",
                    zIndex: 5,
                  }}
                >
                  <span
                    className="block font-mono font-extrabold uppercase text-white/35 mb-1"
                    style={{ fontSize: "7px", letterSpacing: "0.22em" }}
                  >
                    {p.brand}
                  </span>
                  <div className="flex items-baseline justify-center gap-3">
                    <span
                      className="font-['Bebas_Neue'] text-[#f5f7f9] tracking-[0.03em]"
                      style={{ fontSize: "1.75rem" }}
                    >
                      {p.name}
                    </span>
                    <span
                      className="font-['Poppins'] font-semibold tracking-[-0.01em]"
                      style={{ fontSize: "1.35rem", color: p.tagColor }}
                    >
                      {p.price}
                    </span>
                  </div>
                  <Link
                    href={`/products/${p.handle}`}
                    className="inline-block mt-1.5 font-mono font-bold uppercase no-underline transition-opacity duration-200 hover:opacity-55"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.18em",
                      color: p.tagColor,
                    }}
                  >
                    View →
                  </Link>
                </div>
              </button>
            );
          })}

          {/* Next arrow */}
          {n > 1 && (
            <button
              onClick={() => go(active + 1)}
              aria-label="Next"
              className="absolute z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/55 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-white"
              style={{
                top: "50%",
                right: "clamp(12px, 3vw, 48px)",
                transform: "translateY(-50%)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M9 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* ─── DOTS ─── */}
        {n > 1 && (
          <div className="relative z-10 flex justify-center items-center gap-2 shrink-0 pt-8 pb-4">
            {PRODUCTS.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full border-none p-0 cursor-pointer transition-all duration-200"
                style={{
                  width: i === active ? "20px" : "6px",
                  height: "6px",
                  background:
                    i === active ? "#e8a830" : "rgba(255,255,255,0.15)",
                  borderRadius: i === active ? "3px" : "50%",
                }}
              />
            ))}
          </div>
        )}

        {/* ─── BOTTOM CTA ─── */}
        <div className="relative z-10 flex flex-col items-center text-center shrink-0 px-6 pt-5 pb-14">
          <p
            className="font-mono leading-relaxed text-white/28 mb-6 max-w-[400px]"
            style={{ fontSize: "11.5px", letterSpacing: "0.02em" }}
          >
            Authentic Nike, Adidas, ASICS, Brooks &amp; Hoka — sourced direct.
            Zero fakes, ever.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 no-underline font-mono font-semibold uppercase transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#e8a830",
                color: "#0d1117",
                fontSize: "9px",
                letterSpacing: "0.22em",
                padding: "13px 28px",
                borderRadius: "2px",
              }}
            >
              Shop Now
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/collections/pre-order"
              className="font-mono font-bold uppercase no-underline text-white/28 transition-all duration-200 hover:text-white"
              style={{
                fontSize: "9px",
                letterSpacing: "0.22em",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                paddingBottom: "2px",
              }}
            >
              Pre-order
            </Link>
          </div>
        </div>

        {/* Keyframes + pseudo-element — unavoidable without Tailwind config */}
        <style>{`
        @keyframes kDot {
          0%,100% { box-shadow: 0 0 6px rgba(232,168,48,0.55); }
          50%      { box-shadow: 0 0 18px rgba(232,168,48,1); }
        }
        @keyframes ringSpin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes shoeFloat {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-10px); }
        }
        @keyframes sheenSweep {
          0%   { transform: translateX(-130%); }
          35%  { transform: translateX(130%); }
          100% { transform: translateX(130%); }
        }
        .plate-sheen::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(118deg, transparent 34%, rgba(255,255,255,0.055) 48%, transparent 60%);
          transform: translateX(-130%);
          pointer-events: none;
        }
        .active-plate::before {
          animation: sheenSweep 4.5s ease-in-out infinite;
        }
      `}</style>
      </section>
    </>
  );
}
