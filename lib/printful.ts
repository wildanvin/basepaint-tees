import "server-only";

import type { DemoProduct, ShirtSize } from "@/lib/demo-product";

type PrintfulResponse<T> = {
  code: number;
  result: T;
  error?: {
    message?: string;
  };
};

type PrintfulVariant = {
  id: number;
  color: string;
  size: string;
};

type PrintfulProductResult = {
  product: {
    id: number;
    title: string;
  };
  variants: PrintfulVariant[];
};

type PrintfulStore = {
  id: number;
  name: string;
};

type CreateTaskResult = {
  task_key: string;
};

type TaskResult = {
  status: "pending" | "completed" | "failed";
  error?: string;
  mockups?: Array<{
    placement?: string;
    extra?: Array<{
      title?: string;
      url?: string;
      option?: string;
      option_group?: string;
    }>;
  }>;
};

export type PrintfulMockupUrls = {
  front?: string;
  back?: string;
  taskKey: string;
};

const colorNames: Record<string, string> = {
  Black: "Black",
  White: "White",
  Navy: "Navy",
  "Dark Grey Heather": "Dark Grey Heather",
  "Athletic Heather": "Athletic Heather",
  Red: "Red",
  Royal: "True Royal",
  Forest: "Forest",
};

function getToken() {
  const token = process.env.PRINTFUL_API_TOKEN;

  if (!token) {
    throw new Error("PRINTFUL_API_TOKEN is not configured.");
  }

  return token;
}

function getProductId() {
  const productId = Number.parseInt(process.env.PRINTFUL_PRODUCT_ID ?? "71", 10);

  if (!Number.isFinite(productId)) {
    throw new Error("PRINTFUL_PRODUCT_ID must be a number.");
  }

  return productId;
}

async function printfulFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.printful.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as PrintfulResponse<T>;

  if (!response.ok || payload.code >= 400) {
    throw new Error(payload.error?.message ?? `Printful returned ${response.status}`);
  }

  return payload.result;
}

async function getStoreId() {
  const configuredStoreId = Number.parseInt(process.env.PRINTFUL_STORE_ID ?? "", 10);

  if (Number.isFinite(configuredStoreId)) {
    return configuredStoreId;
  }

  const stores = await printfulFetch<PrintfulStore[]>("/stores");
  const store = stores[0];

  if (!store) {
    throw new Error("No Printful store is available for this token.");
  }

  return store.id;
}

async function getVariantIds(product: DemoProduct) {
  const productId = getProductId();
  const printfulColor = colorNames[product.shirtColor] ?? product.shirtColor;
  const catalog = await printfulFetch<PrintfulProductResult>(`/products/${productId}`);

  return product.sizes.map((size: ShirtSize) => {
    const variant = catalog.variants.find(
      (item) => item.color === printfulColor && item.size === size,
    );

    if (!variant) {
      throw new Error(`Missing Printful variant for ${printfulColor} / ${size}.`);
    }

    return variant.id;
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickMockupUrl(task: TaskResult, placement: "front" | "back") {
  const exact = task.mockups?.find((mockup) => mockup.placement === placement);
  const fromExact = exact?.extra?.find((extra) => extra.url)?.url;

  if (fromExact) {
    return fromExact;
  }

  return task.mockups
    ?.flatMap((mockup) => mockup.extra ?? [])
    .find((extra) =>
      `${extra.title ?? ""} ${extra.option ?? ""}`.toLowerCase().includes(placement),
    )?.url;
}

export async function createPrintfulMockups(
  product: DemoProduct,
): Promise<PrintfulMockupUrls> {
  if (!product.frontPrintUrl || !product.backPrintUrl) {
    throw new Error("Printful mockups require public front and back print URLs.");
  }

  const productId = getProductId();
  const storeId = await getStoreId();
  const variantIds = await getVariantIds(product);
  const task = await printfulFetch<CreateTaskResult>(
    `/mockup-generator/create-task/${productId}`,
    {
      method: "POST",
      headers: {
        "X-PF-Store-Id": String(storeId),
      },
      body: JSON.stringify({
        variant_ids: variantIds,
        format: "jpg",
        width: 1200,
        files: [
          {
            placement: "front",
            image_url: product.frontPrintUrl,
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 2400,
              top: 0,
              left: 0,
            },
          },
          {
            placement: "back",
            image_url: product.backPrintUrl,
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 2400,
              top: 0,
              left: 0,
            },
          },
        ],
        options: ["Front", "Back", "Front and Back"],
      }),
    },
  );

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await wait(attempt === 0 ? 1200 : 2000);

    const result = await printfulFetch<TaskResult>(
      `/mockup-generator/task?task_key=${encodeURIComponent(task.task_key)}`,
      {
        headers: {
          "X-PF-Store-Id": String(storeId),
        },
      },
    );

    if (result.status === "failed") {
      throw new Error(result.error ?? "Printful mockup generation failed.");
    }

    if (result.status === "completed") {
      return {
        taskKey: task.task_key,
        front: pickMockupUrl(result, "front"),
        back: pickMockupUrl(result, "back"),
      };
    }
  }

  throw new Error("Printful mockup generation did not complete in time.");
}
