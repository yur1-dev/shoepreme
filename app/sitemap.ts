import { MetadataRoute } from "next";
import { getAllProducts, getAllCollections } from "@/lib/shopify";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getAllProducts(250),
    getAllCollections(),
  ]);

  const productUrls = products.map((product: any) => ({
    url: `https://shoepreme-k.com/products/${product.handle}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const collectionUrls = collections.map((collection: any) => ({
    url: `https://shoepreme-k.com/collections/${collection.handle}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://shoepreme-k.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...collectionUrls,
    ...productUrls,
  ];
}
