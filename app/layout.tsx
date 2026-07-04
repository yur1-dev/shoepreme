import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://shoepreme-k.com"),
  title: {
    default: "Shoepreme PH — Authentic Running & Basketball Shoes",
    template: "%s | Shoepreme PH",
  },
  description:
    "Authentic Nike, Adidas, ASICS, Brooks & Hoka — sourced direct from Japan, Taiwan, US, and HK. Based in Koronadal City. 100% legit.",
  keywords: [
    "Nike Philippines",
    "Adidas Koronadal",
    "authentic running shoes",
    "ASICS PH",
    "sneakers General Santos",
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Shoepreme PH",
    description:
      "Authentic performance shoes, direct from Japan, Taiwan & the US.",
    url: "https://shoepreme-k.com",
    siteName: "Shoepreme PH",
    type: "website",
    locale: "en_PH",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Shoepreme PH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoepreme PH",
    description:
      "Authentic performance shoes, direct from Japan, Taiwan & the US.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
