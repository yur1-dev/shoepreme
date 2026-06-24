"use client";
import { useState } from "react";

export default function ImageGallery({
  images,
  title,
}: {
  images: { url: string; altText: string | null }[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        style={{
          width: "100%",
          height: "clamp(280px, 55vw, 640px)",
          maxHeight: "640px",
          minHeight: "280px",
          borderRadius: "20px",
          overflow: "hidden",
          background: "#1a2332",
          marginBottom: "12px",
        }}
      >
        {images[active] ? (
          <img
            src={images[active].url}
            alt={images[active].altText ?? title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#8896a7", fontSize: "12px" }}>No image</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: "flex", gap: "10px", overflowX: "auto" }}>
          {images.slice(0, 6).map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0,
                width: "80px",
                height: "80px",
                borderRadius: "10px",
                overflow: "hidden",
                border:
                  i === active
                    ? "2px solid #e8a830"
                    : "2px solid rgba(255,255,255,0.08)",
                background: "#1a2332",
                padding: 0,
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
            >
              <img
                src={img.url}
                alt={img.altText ?? ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
