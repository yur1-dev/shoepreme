const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

async function adminFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOPIFY_ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export async function getCustomerIdByEmail(
  email: string,
): Promise<string | null> {
  const data = await adminFetch(
    `
    query getCustomer($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { id } }
      }
    }
  `,
    { query: `email:${email}` },
  );
  return data?.data?.customers?.edges?.[0]?.node?.id ?? null;
}

export async function updateCustomerPassword(
  customerId: string,
  password: string,
): Promise<boolean> {
  const data = await adminFetch(
    `
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { field message }
      }
    }
  `,
    { input: { id: customerId, password } },
  );
  return !data?.data?.customerUpdate?.userErrors?.length;
}
