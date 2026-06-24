import { notFound } from "next/navigation";
import { getProductByHandle, getAllProducts } from "@/lib/shopify";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AddToCartSection from "./AddToCartSection";
import ImageGallery from "./ImageGallery";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts(50);
  return products.map((p: any) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.title} — Shoepreme PH`,
    description: product.description?.slice(0, 155) ?? "",
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) notFound();

  const images = product.images.edges.map((e: any) => e.node);
  const variants = product.variants.edges.map((e: any) => e.node);
  const options = product.options ?? [];
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
  const hasMultiplePrices = maxPrice > price;

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ paddingTop: "80px" }}>
        {/* Product layout */}
        <section
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "24px 32px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
          }}
          className="product-grid"
        >
          {/* Left — images */}
          <div style={{ position: "sticky", top: "112px", alignSelf: "start" }}>
            <ImageGallery images={images} title={product.title} />
          </div>

          {/* Right — info + add to cart */}
          <div className="product-right">
            {/* Breadcrumb */}
            <p
              style={{
                color: "rgba(245,247,249,0.35)",
                fontSize: "12px",
                marginBottom: "16px",
                letterSpacing: "0.05em",
              }}
            >
              <a
                href="/"
                style={{
                  color: "rgba(245,247,249,0.35)",
                  textDecoration: "none",
                }}
              >
                Home
              </a>
              {" / "}
              <a
                href="/products"
                style={{
                  color: "rgba(245,247,249,0.35)",
                  textDecoration: "none",
                }}
              >
                Products
              </a>
              {" / "}
              <span style={{ color: "#4a7fa5" }}>{product.title}</span>
            </p>

            {/* Vendor / brand */}
            {product.vendor && (
              <p
                style={{
                  color: "#4a7fa5",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                {product.vendor}
              </p>
            )}

            <h1
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                color: "#f5f7f9",
                lineHeight: 1,
                letterSpacing: "-0.01em",
                marginBottom: "20px",
              }}
            >
              {product.title}
            </h1>

            {/* Price */}
            <div style={{ marginBottom: "28px" }}>
              <span
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "2rem",
                  color: "#4a7fa5",
                  letterSpacing: "0.04em",
                }}
              >
                ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                {hasMultiplePrices &&
                  ` – ₱${maxPrice.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`}
              </span>
            </div>

            {/* Add to cart — client component for interactivity */}
            <AddToCartSection variants={variants} options={options} />

            {/* Description */}
            {product.description && (
              <div
                style={{
                  marginTop: "32px",
                  paddingTop: "28px",
                  borderTop: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <h3
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#8896a7",
                    marginBottom: "12px",
                  }}
                >
                  Description
                </h3>
                <p
                  style={{
                    color: "rgba(245,247,249,0.6)",
                    fontSize: "14px",
                    lineHeight: 1.75,
                    whiteSpace: "pre-line",
                  }}
                >
                  {product.description}
                </p>
              </div>
            )}

            {/* Trust badges */}
            <div
              style={{
                marginTop: "28px",
                padding: "20px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {[
                {
                  svg: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  ),
                  text: "100% Authentic — verified before shipping",
                  color: "#22c55e",
                },
                {
                  svg: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  ),
                  text: "Free shipping on orders over ₱5,000",
                  color: "#4a7fa5",
                },
                {
                  svg: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  ),
                  text: "Returns accepted within 7 days",
                  color: "#e8a830",
                },
                {
                  svg: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  ),
                  text: "Pre-order from JP, TW, HK, US available",
                  color: "#a78bfa",
                },
              ].map((b) => (
                <div
                  key={b.text}
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={b.color}
                    style={{ flexShrink: 0 }}
                  >
                    {b.svg}
                  </svg>
                  <span
                    style={{ color: "rgba(245,247,249,0.7)", fontSize: "13px" }}
                  >
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <style>{`
        @media (min-width: 900px) {
          .product-grid {
            grid-template-columns: 1fr 1fr !important;
            align-items: start;
          }
          .product-right {
            overflow-y: auto;
            scrollbar-width: none;
          }
          .product-right::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
