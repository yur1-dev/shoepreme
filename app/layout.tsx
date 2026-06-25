import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Shoepreme PH — Authentic Running & Basketball Shoes",
  description:
    "Authentic Nike, Adidas, ASICS, Brooks & Hoka — sourced direct from Japan, Taiwan, US, and HK. Based in Koronadal City. 100% legit.",
  openGraph: {
    title: "Shoepreme PH",
    description:
      "Authentic performance shoes, direct from Japan, Taiwan & the US.",
    url: "https://shoepreme-k.com",
    siteName: "Shoepreme PH",
    type: "website",
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
