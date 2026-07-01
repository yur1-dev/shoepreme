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
        id
        fulfillmentOrders(first: 10) {
          edges {
            node {
              id
              status
              requestStatus
              supportedActions {
                action
              }
            }
          }
        }
      }
    }
  `,
    { orderId },
  );

  console.log("foData raw:", JSON.stringify(foData, null, 2));

  const fulfillmentOrders = foData?.data?.order?.fulfillmentOrders?.edges ?? [];

  console.log(
    "Fulfillment orders:",
    JSON.stringify(fulfillmentOrders, null, 2),
  );

  // Take the first fulfillment order that supports createFulfillment, or just the first one
  const openFO =
    fulfillmentOrders.find((e: any) =>
      e.node.supportedActions?.some(
        (a: any) => a.action === "CREATE_FULFILLMENT",
      ),
    ) ?? fulfillmentOrders[0];

  if (!openFO) {
    const statuses = fulfillmentOrders
      .map((e: any) => e.node.status)
      .join(", ");
    return {
      success: false,
      error: `No open fulfillment order found. Statuses: ${statuses}`,
    };
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
export async function deleteProduct(productId: string) {
  const data = await adminFetch(
    `
    mutation productDelete($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors { field message }
      }
    }
  `,
    { input: { id: productId } },
  );

  const errors = data?.data?.productDelete?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return {
    success: true,
    deletedId: data?.data?.productDelete?.deletedProductId,
  };
}

export async function cancelOrder(orderId: string) {
  const data = await adminFetch(
    `
    mutation orderCancel($orderId: ID!, $reason: OrderCancelReason!, $refund: Boolean!, $restock: Boolean!) {
      orderCancel(orderId: $orderId, reason: $reason, refund: $refund, restock: $restock) {
        job {
          id
          done
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

  console.log("cancelOrder response:", JSON.stringify(data, null, 2));

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
            cancelledAt
            cancelReason
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

export async function getProductById(id: string) {
  const data = await adminFetch(
    `
    query getProduct($id: ID!) {
      product(id: $id) {
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
  `,
    { id },
  );

  if (data.errors) {
    console.error(
      "Shopify product query error:",
      JSON.stringify(data.errors, null, 2),
    );
    return null;
  }

  return data?.data?.product ?? null;
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

// FIXED: updateVariantPrice — uses productVariantsBulkUpdate (correct 2024-01 API)
export async function updateVariantPrice(
  variantId: string,
  price: string,
  productId?: string,
) {
  let resolvedProductId = productId;

  if (!resolvedProductId) {
    const variantData = await adminFetch(
      `
      query getVariantProduct($id: ID!) {
        productVariant(id: $id) {
          product { id }
        }
      }
    `,
      { id: variantId },
    );
    resolvedProductId = variantData?.data?.productVariant?.product?.id;
  }

  if (!resolvedProductId)
    return { success: false, error: "Could not find product for variant" };

  const data = await adminFetch(
    `
    mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price }
        userErrors { field message }
      }
    }
  `,
    {
      productId: resolvedProductId,
      variants: [{ id: variantId, price }],
    },
  );

  const errors = data?.data?.productVariantsBulkUpdate?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
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
  const id = process.env.SHOPIFY_LOCATION_ID;
  if (id) return id;

  const data = await adminFetch(`
    query {
      locations(first: 1) {
        edges {
          node { id }
        }
      }
    }
  `);
  return data?.data?.locations?.edges?.[0]?.node?.id ?? null;
}

export async function enableInventoryTracking(inventoryItemId: string) {
  const data = await adminFetch(
    `
    mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
      inventoryItemUpdate(id: $id, input: $input) {
        inventoryItem { id tracked }
        userErrors { field message }
      }
    }
  `,
    { id: inventoryItemId, input: { tracked: true } },
  );
  const errors = data?.data?.inventoryItemUpdate?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return { success: true };
}

// NEW: activate inventory item at primary location before adjusting stock
export async function connectInventoryToLocation(
  inventoryItemId: string,
): Promise<{ success: boolean; error?: string }> {
  const locationId = await getPrimaryLocationId();
  if (!locationId) return { success: false, error: "No location found" };

  const data = await adminFetch(
    `
    mutation inventoryActivate($inventoryItemId: ID!, $locationId: ID!) {
      inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) {
        inventoryLevel { id available }
        userErrors { field message }
      }
    }
  `,
    { inventoryItemId, locationId },
  );

  const errors = data?.data?.inventoryActivate?.userErrors;
  // Ignore "already activated" errors — that's fine
  if (errors?.length && !errors[0].message.includes("already")) {
    return { success: false, error: errors[0].message };
  }
  return { success: true };
}

// FIXED: createProduct — options field removed from ProductInput in 2024-01.
// Now creates product, then uses productOptionsCreate to add sizes,
// then sets inventory using inventorySetQuantities directly.
export async function createProduct(input: {
  title: string;
  productType: string;
  descriptionHtml: string;
  status: string;
  price: string;
  sizes: string[];
}) {
  const hasVariants = input.sizes.length > 0;

  // Step 1: Create product shell
  const productInput: any = {
    title: input.title,
    productType: input.productType,
    descriptionHtml: input.descriptionHtml,
    status: input.status,
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

  // Step 2a: No sizes — update default variant price only
  if (!hasVariants) {
    const defaultVariantId = product.variants?.edges?.[0]?.node?.id;
    const defaultInventoryItemId =
      product.variants?.edges?.[0]?.node?.inventoryItem?.id;

    if (defaultVariantId) {
      await adminFetch(
        `
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `,
        {
          productId: product.id,
          variants: [{ id: defaultVariantId, price: input.price }],
        },
      );
    }

    // Activate inventory at location
    if (defaultInventoryItemId && locationId) {
      await connectInventoryToLocation(defaultInventoryItemId);
      await enableInventoryTracking(defaultInventoryItemId);
    }

    return { success: true, product };
  }

  // Step 2b: Has sizes — use productOptionsCreate
  const optionsData = await adminFetch(
    `
    mutation productOptionsCreate($productId: ID!, $options: [OptionCreateInput!]!) {
      productOptionsCreate(productId: $productId, options: $options) {
        product {
          id
          variants(first: 50) {
            edges {
              node {
                id
                title
                inventoryItem { id }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `,
    {
      productId: product.id,
      options: [
        {
          name: "Size",
          values: input.sizes.map((size) => ({ name: size })),
        },
      ],
    },
  );

  const optionErrors = optionsData?.data?.productOptionsCreate?.userErrors;
  console.log(
    "createProduct productOptionsCreate response:",
    JSON.stringify(optionsData, null, 2),
  );
  if (optionErrors?.length) {
    return {
      success: true,
      product,
      warning: `Product created but sizes failed: ${optionErrors[0].message}`,
    };
  }

  // Step 3: Get all created variants (filter out Default Title)
  const createdVariants =
    optionsData?.data?.productOptionsCreate?.product?.variants?.edges ?? [];
  const realVariants = createdVariants.filter(
    (e: any) => e.node.title !== "Default Title",
  );

  // Step 4: Update price for all real variants
  if (realVariants.length > 0) {
    await adminFetch(
      `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id price }
          userErrors { field message }
        }
      }
    `,
      {
        productId: product.id,
        variants: realVariants.map((e: any) => ({
          id: e.node.id,
          price: input.price,
        })),
      },
    );
  }

  // Step 5: Activate inventory at location for each variant
  if (locationId) {
    for (const e of realVariants) {
      if (e.node.inventoryItem?.id) {
        await connectInventoryToLocation(e.node.inventoryItem.id);
        await enableInventoryTracking(e.node.inventoryItem.id);
      }
    }
  }

  // Step 6: Delete auto-created "Default Title" variant
  const defaultVariant = product.variants?.edges?.[0]?.node;
  if (defaultVariant && realVariants.length > 0) {
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

// FIXED: addVariantToProduct — uses productVariantsBulkCreate + activates inventory
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

  // Check if "Size" option exists on this product
  const productData = await adminFetch(
    `
    query getProductOptions($id: ID!) {
      product(id: $id) {
        options { id name }
        variants(first: 1) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }
  `,
    { id: productId },
  );

  const options = productData?.data?.product?.options ?? [];
  const hasSizeOption = options.some((o: any) => o.name === "Size");
  const defaultVariant = productData?.data?.product?.variants?.edges?.[0]?.node;
  const hasDefaultTitle = defaultVariant?.title === "Default Title";

  // If no Size option exists, create it first using productOptionsCreate
  if (!hasSizeOption) {
    const optionsData = await adminFetch(
      `
      mutation productOptionsCreate($productId: ID!, $options: [OptionCreateInput!]!) {
        productOptionsCreate(productId: $productId, options: $options) {
          product {
            id
            variants(first: 50) {
              edges {
                node { id title inventoryItem { id } }
              }
            }
          }
          userErrors { field message }
        }
      }
    `,
      {
        productId,
        options: [
          {
            name: "Size",
            values: [{ name: size }],
          },
        ],
      },
    );

    const optionErrors = optionsData?.data?.productOptionsCreate?.userErrors;
    console.log(
      "addVariantToProduct productOptionsCreate response:",
      JSON.stringify(optionsData, null, 2),
    );
    if (optionErrors?.length) {
      return { success: false, error: optionErrors[0].message };
    }

    // Get the fresh variant list from productOptionsCreate response
    const newVariants =
      optionsData?.data?.productOptionsCreate?.product?.variants?.edges ?? [];
    const realVariant = newVariants.find(
      (e: any) => e.node.title !== "Default Title",
    );

    // Only delete the old default variant if Shopify actually created a
    // separate new variant (i.e. the old default's ID is NOT the same as
    // the new "real" variant's ID). If Shopify reused/renamed the default
    // variant in place, deleting it would wipe out the only variant.
    const defaultWasReused = realVariant?.node?.id === defaultVariant?.id;
    if (hasDefaultTitle && defaultVariant && !defaultWasReused) {
      await adminFetch(
        `
        mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
          productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
            userErrors { field message }
          }
        }
      `,
        {
          productId,
          variantsIds: [defaultVariant.id],
        },
      );
    }

    if (realVariant) {
      await adminFetch(
        `
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
            userErrors { field message }
          }
        }
      `,
        {
          productId,
          variants: [{ id: realVariant.node.id, price }],
        },
      );

      if (realVariant.node.inventoryItem?.id) {
        await connectInventoryToLocation(realVariant.node.inventoryItem.id);
        await enableInventoryTracking(realVariant.node.inventoryItem.id);
        if (quantity > 0) {
          await updateVariantInventory(
            realVariant.node.inventoryItem.id,
            locationId,
            quantity,
          );
        }
      }
    }

    return { success: true, variant: realVariant?.node };
  }

  // Size option exists — just add a new variant
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
        },
      ],
    },
  );

  const errors = data?.data?.productVariantsBulkCreate?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };

  const variant = data?.data?.productVariantsBulkCreate?.productVariants?.[0];

  if (variant?.inventoryItem?.id) {
    await connectInventoryToLocation(variant.inventoryItem.id);
    await enableInventoryTracking(variant.inventoryItem.id);
    if (quantity > 0) {
      await updateVariantInventory(
        variant.inventoryItem.id,
        locationId,
        quantity,
      );
    }
  }

  return { success: true, variant };
}
// FIXED: updateVariantInventory — uses inventorySetQuantities (2024-01)
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

// NEW: adjustInventoryDelta — activate location first, then apply delta change
export async function adjustInventoryDelta(
  inventoryItemId: string,
  delta: number,
) {
  const locationId = await getPrimaryLocationId();
  console.log("adjustInventoryDelta locationId:", locationId);
  if (!locationId) return { success: false, error: "No location found" };
  console.log("adjustInventoryDelta inventoryItemId:", inventoryItemId);

  // Always activate first to ensure inventory is tracked at this location
  await connectInventoryToLocation(inventoryItemId);

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

  console.log("full response:", JSON.stringify(data, null, 2));
  // Check top-level API errors (access denied, etc.)
  if (data?.errors?.length)
    return { success: false, error: data.errors[0].message };

  const errors = data?.data?.inventoryAdjustQuantities?.userErrors;
  if (errors?.length) return { success: false, error: errors[0].message };
  return { success: true };
}
export async function setFulfillmentOrderStatus(
  orderId: string,
  status: "IN_PROGRESS" | "ON_HOLD",
) {
  // First get the fulfillment order ID
  const foData = await adminFetch(
    `
    query getFulfillmentOrders($orderId: ID!) {
      order(id: $orderId) {
        fulfillmentOrders(first: 5) {
          edges { node { id status } }
        }
      }
    }
  `,
    { orderId },
  );

  const edges = foData?.data?.order?.fulfillmentOrders?.edges ?? [];
  const fo = edges.find(
    (e: any) =>
      e.node.status === "OPEN" ||
      e.node.status === "IN_PROGRESS" ||
      e.node.status === "ON_HOLD" ||
      e.node.status === "CLOSED",
  );

  if (!fo) return { success: false, error: "No fulfillment order found" };

  const mutation =
    status === "ON_HOLD"
      ? `mutation holdFulfillmentOrder($id: ID!, $reason: FulfillmentHoldReason!, $notifyMerchant: Boolean) {
          fulfillmentOrderHold(id: $id, fulfillmentHold: { reason: $reason, notifyMerchant: $notifyMerchant }) {
            fulfillmentOrder { id status }
            userErrors { field message }
          }
        }`
      : `mutation openFulfillmentOrder($id: ID!) {
          fulfillmentOrderOpen(id: $id) {
            fulfillmentOrder { id status }
            userErrors { field message }
          }
        }`;

  const variables =
    status === "ON_HOLD"
      ? { id: fo.node.id, reason: "OTHER", notifyMerchant: false }
      : { id: fo.node.id };

  const data = await adminFetch(mutation, variables);

  const errors =
    data?.data?.fulfillmentOrderHold?.userErrors ??
    data?.data?.fulfillmentOrderOpen?.userErrors ??
    [];

  if (errors.length) return { success: false, error: errors[0].message };
  return { success: true };
}
export async function getCustomers(first = 100) {
  const data = await adminFetch(
    `
    query getCustomers($first: Int!) {
      customers(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            email
            firstName
            lastName
            phone
            numberOfOrders
            amountSpent { amount currencyCode }
            createdAt
            state
            tags
          }
        }
      }
    }
  `,
    { first },
  );

  if (data.errors) {
    console.error(
      "Shopify customers query error:",
      JSON.stringify(data.errors, null, 2),
    );
    return [];
  }

  return data?.data?.customers?.edges?.map((e: any) => e.node) ?? [];
}

// ─── Draft Orders (Reserve / Preorder flow) ────────────────────────────────

export async function createDraftOrder(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  variantId: string;
  quantity: number;
  note?: string;
}) {
  const data = await adminFetch(
    `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          invoiceUrl
          customer { id email }
        }
        userErrors { field message }
      }
    }
  `,
    {
      input: {
        email: input.email,
        note: input.note ?? "Reserved — preorder, pending stock confirmation",
        tags: ["preorder", "reserve"],
        lineItems: [
          {
            variantId: input.variantId,
            quantity: input.quantity,
          },
        ],
        ...(input.phone || input.firstName || input.lastName
          ? {
              shippingAddress: {
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone,
              },
            }
          : {}),
      },
    },
  );

  const errors = data?.data?.draftOrderCreate?.userErrors;
  if (errors?.length) {
    return { success: false, error: errors[0].message };
  }

  return {
    success: true,
    draftOrder: data?.data?.draftOrderCreate?.draftOrder,
  };
}
