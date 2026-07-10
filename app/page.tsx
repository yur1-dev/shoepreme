import Navbar from "@/components/layout/Navbar";
import Hero, { HeroProduct } from "@/components/sections/Hero";
import StorySection from "@/components/sections/StorySection";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import PreOrderSection from "@/components/sections/PreOrderSection";
import Link from "next/link";
import { getAllProducts } from "@/lib/shopify";
import { connectToDatabase } from "@/lib/mongodb";
import HeroSlide from "@/models/HeroSlide";

export const dynamic = "force-dynamic";

async function getHeroSlides(): Promise<HeroProduct[]> {
  await connectToDatabase();
  const slides = await HeroSlide.find({ active: true })
    .sort({ order: 1 })
    .lean();

  return slides.map((s: any) => ({
    id: s._id.toString(),
    brand: s.brand,
    name: s.name,
    sub: s.sub,
    price: s.price,
    tag: s.tag,
    handle: s.productHandle,
    image: s.image,
    glow: s.glow,
    tagColor: s.tagColor,
    features: s.features,
  }));
}

export default async function HomePage() {
  const [products, heroSlides] = await Promise.all([
    getAllProducts(8),
    getHeroSlides(),
  ]);

  return (
    <main style={{ minHeight: "100vh", background: "#0d1117" }}>
      <Navbar />

      <div>
        <Hero featuredProducts={heroSlides} />

        {/* Featured Products */}
        <section
          id="products"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "clamp(56px, 9vw, 96px) 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "36px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#4a7fa5",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Fresh Drops
              </p>
              <h2
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                  color: "#f5f7f9",
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                Featured Products
              </h2>
            </div>
            <Link
              href="/products"
              style={{
                color: "#4a7fa5",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              View All →
            </Link>
          </div>

          {products.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "#8896a7",
              }}
            >
              <p style={{ fontSize: "14px", letterSpacing: "0.05em" }}>
                No products yet — connect your Shopify store to see items here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Link
              href="/products"
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f5f7f9",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "14px 36px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              View All Products
            </Link>
          </div>
        </section>
        <StorySection />
        <PreOrderSection />

        <Footer />
      </div>
    </main>
  );
}
