import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

async function adminFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOPIFY_ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ draftOrders: [] });

  const data = await adminFetch(
    `
    query getDraftOrders($query: String!) {
      draftOrders(first: 20, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            status
            invoiceUrl
            totalPrice
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variantTitle
                  originalUnitPrice
                }
              }
            }
          }
        }
      }
    }
  `,
    { query: `email:'${email}' AND tag:reserve` },
  );

  if (data.errors) {
    console.error(
      "Shopify draftOrders query error:",
      JSON.stringify(data.errors, null, 2),
    );
  }

  const edges = data?.data?.draftOrders?.edges ?? [];
  const draftOrders = edges.map(({ node }: any) => ({
    id: node.id,
    name: node.name,
    createdAt: node.createdAt,
    status: node.status,
    invoiceUrl: node.invoiceUrl,
    totalPrice: node.totalPrice,
    lineItems: node.lineItems.edges.map(({ node: item }: any) => ({
      title: item.title,
      quantity: item.quantity,
      variantTitle: item.variantTitle,
      originalUnitPrice: item.originalUnitPrice,
    })),
  }));

  return NextResponse.json({ draftOrders });
}
