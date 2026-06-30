import "server-only";

import type { DemoProduct, ShirtSize } from "@/lib/demo-product";
import type { OrderRecord, ShippingAddress } from "@/lib/order-store";

type PrintifyErrorResponse = {
  errors?: {
    reason?: string;
    message?: string;
  };
  message?: string;
};

type PrintifyVariant = {
  id: number;
  title?: string;
  options?: {
    color?: string;
    size?: string;
  };
};

type PrintifyVariantsResponse = {
  variants?: PrintifyVariant[];
};

type PrintifyProduct = {
  id: string;
  images?: Array<{
    src?: string;
    position?: string;
    is_default?: boolean;
    variant_ids?: number[];
  }>;
};

type PrintifyUpload = {
  id: string;
};

type PrintifyProductPayload = {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
  }>;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: "front" | "back";
      images: Array<{
        id: string;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
  }>;
};

type ShippingCosts = {
  standard?: number;
  express?: number;
  priority?: number;
  printify_express?: number;
  economy?: number;
};

type PrintifyOrderCreated = {
  id: string;
};

type PrintifyOrder = {
  id: string;
  status?: string;
  metadata?: {
    shop_order_id?: string | number;
  };
};

type PrintifyOrdersResponse = {
  data?: PrintifyOrder[];
};

export type PrintifyFulfillmentDetails = {
  productId: string;
  blueprintId: number;
  printProviderId: number;
  variantId: number;
  shippingMethod: number;
};

const colorAliases: Record<string, string[]> = {
  Black: ["Black"],
  White: ["White"],
  Navy: ["Navy"],
  "Dark Grey Heather": ["Dark Grey Heather", "Dark Heather", "Heather Grey"],
  "Athletic Heather": ["Athletic Heather", "Sport Grey", "Heather Grey"],
  Red: ["Red"],
  Royal: ["Royal", "Royal Blue", "True Royal"],
  Forest: ["Forest", "Forest Green", "Dark Green"],
};

const preferredMockups = [
  { cameraLabel: "front", label: "Front" },
  { cameraLabel: "back", label: "Back" },
  { cameraLabel: "folded", label: "Folded" },
  { cameraLabel: "hanging-1", label: "Hanging" },
  { cameraLabel: "person-2", label: "On body" },
  { cameraLabel: "duo", label: "Together" },
  { cameraLabel: "person-3", label: "Styled" },
  { cameraLabel: "person-7-back", label: "Back view" },
  { cameraLabel: "size-chart", label: "Size Chart" },
] as const;

function getToken() {
  const token = process.env.PRINTIFY_API_TOKEN;

  if (!token) {
    throw new Error("PRINTIFY_API_TOKEN is not configured.");
  }

  return token;
}

function envInt(name: string, fallback?: number) {
  const value = process.env[name];

  if (!value && fallback !== undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be configured as a number.`);
  }

  return parsed;
}

export function getPrintifyShopId() {
  return envInt("PRINTIFY_SHOP_ID");
}

export function getPrintifyBlueprintId() {
  return envInt("PRINTIFY_BLUEPRINT_ID");
}

export function getPrintifyPrintProviderId() {
  return envInt("PRINTIFY_PRINT_PROVIDER_ID");
}

export function getPrintifyShippingMethod() {
  return envInt("PRINTIFY_SHIPPING_METHOD", 1);
}

async function printifyFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.printify.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T & PrintifyErrorResponse) : undefined;

  if (!response.ok) {
    throw new Error(
      payload?.errors?.message ??
        payload?.errors?.reason ??
        payload?.message ??
        `Printify returned ${response.status}`,
    );
  }

  return payload as T;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function colorCandidates(color: string) {
  return (colorAliases[color] ?? [color]).map(normalize);
}

function getCameraLabel(src?: string) {
  if (!src) {
    return undefined;
  }

  try {
    return new URL(src).searchParams.get("camera_label") ?? undefined;
  } catch {
    return undefined;
  }
}

function selectPrintifyMockups(product: PrintifyProduct) {
  return preferredMockups.flatMap((preferred) => {
    const image = product.images?.find(
      (item) => getCameraLabel(item.src) === preferred.cameraLabel && item.src,
    );

    return image?.src
      ? [{ label: preferred.label, src: image.src, cameraLabel: preferred.cameraLabel }]
      : [];
  });
}

function buildPrintifyProductPayload({
  product,
  blueprintId,
  printProviderId,
  variants,
  frontImageId,
  backImageId,
}: {
  product: DemoProduct;
  blueprintId: number;
  printProviderId: number;
  variants: Record<string, number>;
  frontImageId: string;
  backImageId: string;
}): PrintifyProductPayload {
  const variantIds = Object.values(variants);

  return {
    title: product.name,
    description: `${product.theme}. Generated from BasePaint day ${product.basepaintDay}.`,
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: variantIds.map((id) => ({
      id,
      price: product.priceCents,
      is_enabled: true,
    })),
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: "front",
            images: [{ id: frontImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
          },
          {
            position: "back",
            images: [{ id: backImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
          },
        ],
      },
    ],
  };
}

function productWithPrintifySync({
  product,
  printifyProduct,
  variants,
  blueprintId,
  printProviderId,
  action,
}: {
  product: DemoProduct;
  printifyProduct: PrintifyProduct;
  variants: Record<string, number>;
  blueprintId: number;
  printProviderId: number;
  action: "created" | "updated" | "recreated";
}) {
  const frontMockup = printifyProduct.images?.find((image) => image.position === "front")?.src;
  const backMockup =
    printifyProduct.images?.find((image) => image.position === "back")?.src ??
    printifyProduct.images?.find((image) => image.is_default)?.src;
  const mockups = selectPrintifyMockups(printifyProduct);

  return {
    ...product,
    printifyProductId: printifyProduct.id,
    printifyBlueprintId: blueprintId,
    printifyPrintProviderId: printProviderId,
    printifyVariants: variants,
    printifySyncStatus: `product_${action}`,
    printifySyncedAt: new Date().toISOString(),
    mockupFrontUrl: frontMockup ?? product.mockupFrontUrl,
    mockupBackUrl: backMockup ?? product.mockupBackUrl,
    mockups: mockups.length > 0 ? mockups : product.mockups,
    statusMessage: `${product.statusMessage} ${
      action === "updated"
        ? "Updated"
        : action === "recreated"
          ? "Recreated"
          : "Created"
    } Printify product ${printifyProduct.id}.`,
  };
}

function isVariantPrintAreaMismatch(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return message.includes("variants do not match") && message.includes("print_areas");
}

export async function getPrintifyVariantId(product: DemoProduct, size: ShirtSize) {
  const blueprintId = getPrintifyBlueprintId();
  const printProviderId = getPrintifyPrintProviderId();
  const response = await printifyFetch<PrintifyVariantsResponse>(
    `/v1/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
  );
  const candidates = colorCandidates(product.shirtColor);
  const variant = response.variants?.find((item) => {
    const itemSize = item.options?.size ?? item.title?.split("/").at(-1)?.trim();
    const itemColor = item.options?.color ?? item.title?.split("/").at(0)?.trim();

    return itemSize === size && itemColor && candidates.includes(normalize(itemColor));
  });

  if (!variant) {
    throw new Error(
      `Missing Printify variant for ${product.shirtColor} / ${size}. Check PRINTIFY_BLUEPRINT_ID and PRINTIFY_PRINT_PROVIDER_ID.`,
    );
  }

  return variant.id;
}

async function getPrintifyVariantsForProduct(product: DemoProduct) {
  const blueprintId = getPrintifyBlueprintId();
  const printProviderId = getPrintifyPrintProviderId();
  const response = await printifyFetch<PrintifyVariantsResponse>(
    `/v1/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
  );
  const candidates = colorCandidates(product.shirtColor);
  const variants: Record<string, number> = {};

  for (const size of product.sizes) {
    const variant = response.variants?.find((item) => {
      const itemSize = item.options?.size ?? item.title?.split("/").at(-1)?.trim();
      const itemColor = item.options?.color ?? item.title?.split("/").at(0)?.trim();

      return itemSize === size && itemColor && candidates.includes(normalize(itemColor));
    });

    if (!variant) {
      throw new Error(
        `Missing Printify variant for ${product.shirtColor} / ${size}. Check PRINTIFY_BLUEPRINT_ID and PRINTIFY_PRINT_PROVIDER_ID.`,
      );
    }

    variants[size] = variant.id;
  }

  return variants;
}

async function uploadPrintifyImage(fileName: string, url: string) {
  return printifyFetch<PrintifyUpload>("/v1/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({
      file_name: fileName,
      url,
    }),
  });
}

function splitName(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "Customer";
  const lastName = parts.join(" ") || "-";

  return { firstName, lastName };
}

function addressTo({
  customerName,
  customerEmail,
  shipping,
}: {
  customerName: string | null;
  customerEmail: string | null;
  shipping: ShippingAddress;
}) {
  const { firstName, lastName } = splitName(customerName);
  const secondaryAddress = [shipping.line2, shipping.reference].filter(Boolean).join(" | ");

  return {
    first_name: firstName,
    last_name: lastName,
    email: customerEmail ?? "orders@example.com",
    country: shipping.country,
    region: shipping.state ?? "",
    address1: shipping.line1,
    address2: secondaryAddress,
    city: shipping.city,
    zip: shipping.postalCode,
  };
}

function getPrintAreas(product: DemoProduct) {
  if (!product.frontPrintUrl || !product.backPrintUrl) {
    throw new Error("Printify fulfillment requires public front and back print URLs.");
  }

  return {
    front: product.frontPrintUrl,
    back: product.backPrintUrl,
  };
}

function lineItem({
  product,
  variantId,
  includePrintAreas,
}: {
  product: DemoProduct;
  variantId: number;
  includePrintAreas: boolean;
}) {
  return {
    print_provider_id: getPrintifyPrintProviderId(),
    blueprint_id: getPrintifyBlueprintId(),
    variant_id: variantId,
    quantity: 1,
    ...(includePrintAreas ? { print_areas: getPrintAreas(product) } : {}),
  };
}

function getStoredVariantId(product: DemoProduct, size: ShirtSize) {
  const variantId = product.printifyVariants?.[size];

  if (!variantId) {
    throw new Error(`Daily product is missing Printify variant for size ${size}. Run daily sync.`);
  }

  return variantId;
}

export async function ensurePrintifyProduct(product: DemoProduct) {
  if (!product.frontPrintUrl || !product.backPrintUrl) {
    throw new Error("Printify product sync requires public front and back print URLs.");
  }

  const shopId = getPrintifyShopId();
  const blueprintId = getPrintifyBlueprintId();
  const printProviderId = getPrintifyPrintProviderId();
  const variants = await getPrintifyVariantsForProduct(product);
  const [frontImage, backImage] = await Promise.all([
    uploadPrintifyImage(`basepaint-${product.basepaintDay}-front.png`, product.frontPrintUrl),
    uploadPrintifyImage(`basepaint-${product.basepaintDay}-back.png`, product.backPrintUrl),
  ]);
  const payload = buildPrintifyProductPayload({
    product,
    blueprintId,
    printProviderId,
    variants,
    frontImageId: frontImage.id,
    backImageId: backImage.id,
  });

  if (product.printifyProductId) {
    try {
      const updatedProduct = await printifyFetch<PrintifyProduct>(
        `/v1/shops/${shopId}/products/${product.printifyProductId}.json`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      return productWithPrintifySync({
        product,
        printifyProduct: updatedProduct,
        variants,
        blueprintId,
        printProviderId,
        action: "updated",
      });
    } catch (error) {
      if (!isVariantPrintAreaMismatch(error)) {
        throw error;
      }

      const recreatedProduct = await printifyFetch<PrintifyProduct>(
        `/v1/shops/${shopId}/products.json`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return productWithPrintifySync({
        product,
        printifyProduct: recreatedProduct,
        variants,
        blueprintId,
        printProviderId,
        action: "recreated",
      });
    }
  }

  const createdProduct = await printifyFetch<PrintifyProduct>(`/v1/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return productWithPrintifySync({
    product,
    printifyProduct: createdProduct,
    variants,
    blueprintId,
    printProviderId,
    action: "created",
  });
}

export async function calculatePrintifyShipping({
  product,
  size,
  shipping,
  customerName,
  customerEmail,
}: {
  product: DemoProduct;
  size: ShirtSize;
  shipping: ShippingAddress;
  customerName: string;
  customerEmail: string;
}) {
  const shopId = getPrintifyShopId();
  const variantId = product.printifyProductId
    ? getStoredVariantId(product, size)
    : await getPrintifyVariantId(product, size);
  const costs = await printifyFetch<ShippingCosts>(
    `/v1/shops/${shopId}/orders/shipping.json`,
    {
      method: "POST",
      body: JSON.stringify({
        line_items: [
          product.printifyProductId
            ? { product_id: product.printifyProductId, variant_id: variantId, quantity: 1 }
            : lineItem({ product, variantId, includePrintAreas: false }),
        ],
        address_to: addressTo({ customerName, customerEmail, shipping }),
      }),
    },
  );
  const shippingMethod = getPrintifyShippingMethod();
  const cost =
    shippingMethod === 4
      ? costs.economy
      : shippingMethod === 3
        ? costs.express
        : shippingMethod === 2
          ? costs.priority
          : costs.standard;

  if (typeof cost !== "number" || !Number.isFinite(cost)) {
    throw new Error("Printify did not return a shipping cost for this destination.");
  }

  return {
    shippingCostCents: cost,
    fulfillment: {
      productId: product.printifyProductId ?? "",
      blueprintId: getPrintifyBlueprintId(),
      printProviderId: getPrintifyPrintProviderId(),
      variantId,
      shippingMethod,
    } satisfies PrintifyFulfillmentDetails,
  };
}

function getExternalId(order: OrderRecord) {
  return order.id.replaceAll("-", "");
}

function isDuplicateExternalId(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("already exists") &&
    error.message.toLowerCase().includes("external_id")
  );
}

async function findPrintifyOrderByExternalId(externalId: string) {
  const shopId = getPrintifyShopId();
  const response = await printifyFetch<PrintifyOrdersResponse>(
    `/v1/shops/${shopId}/orders.json?limit=10`,
  );

  return response.data?.find(
    (order) => String(order.metadata?.shop_order_id ?? "") === externalId,
  );
}

export async function createPrintifyOrder({
  order,
  product,
}: {
  order: OrderRecord;
  product: DemoProduct;
}) {
  if (!order.shipping) {
    throw new Error("Printify order requires a shipping address.");
  }

  const shopId = getPrintifyShopId();
  const variantId =
    order.printifyVariantId ??
    (product.printifyProductId
      ? getStoredVariantId(product, order.size)
      : await getPrintifyVariantId(product, order.size));
  const shippingMethod = order.printifyShippingMethod ?? getPrintifyShippingMethod();
  const externalId = getExternalId(order);
  const existingOrder = await findPrintifyOrderByExternalId(externalId);

  if (existingOrder) {
    return { id: existingOrder.id };
  }

  try {
    return await printifyFetch<PrintifyOrderCreated>(`/v1/shops/${shopId}/orders.json`, {
      method: "POST",
      body: JSON.stringify({
        external_id: externalId,
        label: `BasePaint #${product.basepaintDay}`,
        line_items: [
          product.printifyProductId
            ? {
                product_id: product.printifyProductId,
                variant_id: variantId,
                quantity: 1,
                external_id: `${externalId}-1`,
              }
            : {
                ...lineItem({ product, variantId, includePrintAreas: true }),
                external_id: `${externalId}-1`,
              },
        ],
        shipping_method: shippingMethod,
        is_printify_express: false,
        is_economy_shipping: shippingMethod === 4,
        send_shipping_notification: false,
        address_to: addressTo({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          shipping: order.shipping,
        }),
      }),
    });
  } catch (error) {
    if (isDuplicateExternalId(error)) {
      const recoveredOrder = await findPrintifyOrderByExternalId(externalId);

      if (recoveredOrder) {
        return { id: recoveredOrder.id };
      }
    }

    throw error;
  }
}

export async function sendPrintifyOrderToProduction(orderId: string) {
  const shopId = getPrintifyShopId();

  return printifyFetch<PrintifyOrderCreated>(
    `/v1/shops/${shopId}/orders/${orderId}/send_to_production.json`,
    { method: "POST" },
  );
}
