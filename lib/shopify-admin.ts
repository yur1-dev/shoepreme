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

export async function fulfillOrder(orderId: string) {
  // First get the fulfillment order ID (required by the new Fulfillment API)
  const foData = await adminFetch(
    `
    query getFulfillmentOrders($orderId: ID!) {
      order(id: $orderId) {
        fulfillmentOrders(first: 5) {
          edges {
            node {
              id
              status
            }
          }
        }
      }
    }
  `,
    { orderId },
  );

  const fulfillmentOrders = foData?.data?.order?.fulfillmentOrders?.edges ?? [];
  const openFO = fulfillmentOrders.find((e: any) => e.node.status === "OPEN");

  if (!openFO) {
    return { success: false, error: "No open fulfillment order found" };
  }

  const data = await adminFetch(
    `
    mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
      fulfillmentCreate(fulfillment: $fulfillment) {
        fulfillment {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      fulfillment: {
        lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: openFO.node.id }],
      },
    },
  );

  const errors = data?.data?.fulfillmentCreate?.userErrors;
  if (errors?.length) {
    return { success: false, error: errors[0].message };
  }

  return {
    success: true,
    fulfillment: data?.data?.fulfillmentCreate?.fulfillment,
  };
}

export async function cancelOrder(orderId: string) {
  const data = await adminFetch(
    `
    mutation orderCancel($orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!) {
      orderCancel(orderId: $orderId, reason: $reason, refund: $refund, restock: $restock) {
        job {
          id
        }
        orderCancelUserErrors {
          field
          message
        }
      }
    }
  `,
    {
      orderId,
      reason: "OTHER",
      refund: false,
      restock: true,
    },
  );

  const errors = data?.data?.orderCancel?.orderCancelUserErrors;
  if (errors?.length) {
    return { success: false, error: errors[0].message };
  }

  return { success: true };
}

export async function getOrders(first = 20) {
  const data = await adminFetch(
    `
    query getOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            customer {
              displayName
              email
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 5) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `,
    { first },
  );

  if (data.errors) {
    console.error(
      "Shopify orders query error:",
      JSON.stringify(data.errors, null, 2),
    );
    return [];
  }

  return data?.data?.orders?.edges?.map((e: any) => e.node) ?? [];
}
