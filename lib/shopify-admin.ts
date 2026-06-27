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
            paymentGatewayNames
            customer {
              displayName
              email
              phone
            }
            shippingAddress {
              address1
              address2
              city
              province
              provinceCode
              zip
              country
              phone
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  variant {
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
            fulfillments(first: 5) {
              trackingInfo {
                number
                url
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

export async function getProducts(first = 50) {
  const data = await adminFetch(
    `
    query getProducts($first: Int!) {
      products(first: $first, sortKey: TITLE) {
        edges {
          node {
            id
            title
            status
            productType
            descriptionHtml
            totalInventory
          featuredImage {
              id
              url
              altText
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  inventoryQuantity
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
      "Shopify products query error:",
      JSON.stringify(data.errors, null, 2),
    );
    return [];
  }

  return data?.data?.products?.edges?.map((e: any) => e.node) ?? [];
}

export async function updateProductInfo(
  id: string,
  title: string,
  descriptionHtml: string,
  status: "ACTIVE" | "DRAFT",
  productType?: string,
) {
  const data = await adminFetch(
    `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id }
        userErrors { field message }
      }
    }
  `,
    {
      input: {
        id,
        title,
        descriptionHtml,
        status,
        ...(productType !== undefined && { productType }),
      },
    },
  );

  const errors = data?.data?.productUpdate?.userErrors;
  if (errors?.length) {
    return { success: false, error: errors[0].message };
  }
  return { success: true };
}

export async function updateVariantPrice(variantId: string, price: string) {
  const data = await adminFetch(
    `
    mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant { id price }
        userErrors { field message }
      }
    }
  `,
    { input: { id: variantId, price } },
  );

  const errors = data?.data?.productVariantUpdate?.userErrors;
  if (errors?.length) {
    return { success: false, error: errors[0].message };
  }
  return { success: true };
}

export async function getStagedUploadUrl(
  filename: string,
  mimeType: string,
  fileSize: number,
) {
  const data = await adminFetch(
    `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }
  `,
    {
      input: [
        {
          filename,
          mimeType,
          httpMethod: "POST",
          resource: "IMAGE",
          fileSize: fileSize.toString(),
        },
      ],
    },
  );

  const errors = data?.data?.stagedUploadsCreate?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };

  const target = data?.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) return { success: false, error: "No upload target returned" };

  return { success: true, target };
}

export async function attachImageToProduct(
  productId: string,
  resourceUrl: string,
  altText?: string,
) {
  const data = await adminFetch(
    `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage { id image { url } }
        }
        mediaUserErrors { field message }
      }
    }
  `,
    {
      productId,
      media: [
        {
          originalSource: resourceUrl,
          mediaContentType: "IMAGE",
          alt: altText || "",
        },
      ],
    },
  );

  const errors = data?.data?.productCreateMedia?.mediaUserErrors;
  if (errors?.length) return { success: false, error: errors[0].message };

  return { success: true, media: data?.data?.productCreateMedia?.media };
}

export async function deleteProductMedia(
  productId: string,
  mediaIds: string[],
) {
  const data = await adminFetch(
    `
    mutation productDeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
      productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
        deletedMediaIds
        mediaUserErrors { field message }
      }
    }
  `,
    { productId, mediaIds },
  );

  const errors = data?.data?.productDeleteMedia?.mediaUserErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return { success: true };
}

export async function createProduct(input: {
  title: string;
  productType: string;
  descriptionHtml: string;
  status: string;
  price: string;
  sizes: string[];
}) {
  const hasVariants = input.sizes.length > 0;
  const productInput: any = {
    title: input.title,
    productType: input.productType,
    descriptionHtml: input.descriptionHtml,
    status: input.status,
  };

  if (hasVariants) {
    productInput.options = ["Size"];
    productInput.variants = input.sizes.map((size) => ({
      options: [size],
      price: input.price,
    }));
  } else {
    productInput.variants = [{ price: input.price }];
  }

  const data = await adminFetch(
    `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product { id title }
        userErrors { field message }
      }
    }
  `,
    { input: productInput },
  );

  const errors = data?.data?.productCreate?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return { success: true, product: data?.data?.productCreate?.product };
}
