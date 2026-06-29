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

export async function markOrderAsPaid(orderId: string, paymentMethod: string) {
  const data = await adminFetch(
    `
    mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        order {
          id
          displayFinancialStatus
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      input: {
        id: orderId,
      },
    },
  );

  const errors = data?.data?.orderMarkAsPaid?.userErrors;
  if (errors?.length) {
    return { success: false, error: errors[0].message };
  }

  return {
    success: true,
    order: data?.data?.orderMarkAsPaid?.order,
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
            vendor
            collections(first: 5) {
              edges {
                node {
                  id
                  title
                }
              }
            }
            media(first: 10) {
              edges {
                node {
                  ... on MediaImage {
                    id
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price
                  inventoryQuantity
                  inventoryItem {
                    id
                  }
                  selectedOptions {
                    name
                    value
                  }
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

export async function getPrimaryLocationId(): Promise<string | null> {
  const data = await adminFetch(`
    query {
      locations(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  `);
  return data?.data?.locations?.edges?.[0]?.node?.id ?? null;
}

// FIXED: createProduct — 2024-01 API removed variants from ProductInput.
// Now creates product shell first, then uses productVariantsBulkCreate.
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
    ...(hasVariants && { options: ["Size"] }),
  };

  const createData = await adminFetch(
    `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
                inventoryItem { id }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
    { input: productInput },
  );

  const createErrors = createData?.data?.productCreate?.userErrors;
  if (createErrors?.length) {
    return { success: false, error: createErrors[0].message };
  }

  const product = createData?.data?.productCreate?.product;
  if (!product) return { success: false, error: "Product creation failed" };

  const locationId = await getPrimaryLocationId();

  // No sizes — just update the default variant price
  if (!hasVariants) {
    const defaultVariantId = product.variants?.edges?.[0]?.node?.id;
    if (defaultVariantId) {
      await adminFetch(
        `
        mutation productVariantUpdate($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant { id }
            userErrors { field message }
          }
        }
      `,
        { input: { id: defaultVariantId, price: input.price } },
      );
    }
    return { success: true, product };
  }

  // Has sizes — bulk create variants
  const variantData = await adminFetch(
    `
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants {
          id
          title
          inventoryItem { id }
        }
        userErrors { field message }
      }
    }
  `,
    {
      productId: product.id,
      variants: input.sizes.map((size) => ({
        optionValues: [{ optionName: "Size", name: size }],
        price: input.price,
        ...(locationId && {
          inventoryQuantities: [{ availableQuantity: 0, locationId }],
        }),
      })),
    },
  );

  const variantErrors = variantData?.data?.productVariantsBulkCreate?.userErrors;
  if (variantErrors?.length) {
    console.error("Variant creation errors:", variantErrors);
    return {
      success: true,
      product,
      warning: `Product created but some sizes failed: ${variantErrors[0].message}`,
    };
  }

  // Delete the auto-created "Default Title" variant
  const allVariants = variantData?.data?.productVariantsBulkCreate?.productVariants ?? [];
  const defaultVariant = product.variants?.edges?.[0]?.node;
  if (defaultVariant && allVariants.length > 0) {
    await adminFetch(
      `
      mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
        productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
          userErrors { field message }
        }
      }
    `,
      {
        productId: product.id,
        variantsIds: [defaultVariant.id],
      },
    );
  }

  return { success: true, product };
}

// FIXED: addVariantToProduct — was passing empty locationId: "" which silently fails.
// Now uses productVariantsBulkCreate (correct 2024-01 API).
export async function addVariantToProduct(
  productId: string,
  size: string,
  price: string,
  quantity: number,
) {
  const locationId = await getPrimaryLocationId();
  if (!locationId) {
    return { success: false, error: "Could not determine store location" };
  }

  const data = await adminFetch(
    `
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants {
          id
          title
          inventoryItem { id }
        }
        userErrors { field message }
      }
    }
  `,
    {
      productId,
      variants: [
        {
          optionValues: [{ optionName: "Size", name: size }],
          price,
          ...(quantity > 0 && {
            inventoryQuantities: [{ availableQuantity: quantity, locationId }],
          }),
        },
      ],
    },
  );

  const errors = data?.data?.productVariantsBulkCreate?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };

  const variant = data?.data?.productVariantsBulkCreate?.productVariants?.[0];
  return { success: true, variant };
}

// FIXED: updateVariantInventory — inventoryAdjustQuantity is deprecated in 2024-01.
// Now uses inventorySetQuantities.
export async function updateVariantInventory(
  inventoryItemId: string,
  locationId: string,
  available: number,
) {
  const data = await adminFetch(
    `
    mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup { id }
        userErrors { field message }
      }
    }
  `,
    {
      input: {
        name: "available",
        reason: "correction",
        quantities: [
          {
            inventoryItemId,
            locationId,
            quantity: available,
          },
        ],
      },
    },
  );

  const errors = data?.data?.inventorySetQuantities?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return { success: true };
}

// NEW: adjustInventoryDelta — used by the update-inventory route.
// Applies a delta (±) change instead of setting an absolute quantity.
export async function adjustInventoryDelta(
  inventoryItemId: string,
  delta: number,
) {
  const locationId = await getPrimaryLocationId();
  if (!locationId) return { success: false, error: "No location found" };

  const data = await adminFetch(
    `
    mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        inventoryAdjustmentGroup { id }
        userErrors { field message }
      }
    }
  `,
    {
      input: {
        name: "available",
        reason: "correction",
        changes: [
          {
            inventoryItemId,
            locationId,
            delta,
          },
        ],
      },
    },
  );

  const errors = data?.data?.inventoryAdjustQuantities?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return { success: true };
}