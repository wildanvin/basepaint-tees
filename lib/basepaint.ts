import { demoProduct, productPriceCents, type DemoProduct } from "@/lib/demo-product";

type UnknownRecord = Record<string, unknown>;

type GraphqlCanvas = {
  id: number;
  name?: string;
  palette: string[];
  size?: number;
};

type GraphqlResponse<T> = {
  data?: T;
  errors?: { message?: string }[];
};

const allowedShirtColors = [
  { name: "Black", hex: "#111111" },
  { name: "Navy", hex: "#1f2a44" },
  { name: "Dark Grey Heather", hex: "#4a4a4a" },
  { name: "Athletic Heather", hex: "#c8c8c8" },
  { name: "Red", hex: "#c9342f" },
  { name: "Royal", hex: "#2554c7" },
  { name: "Forest", hex: "#1f5b3b" },
];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeHex(value: string) {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  return /^#[0-9a-f]{6}$/i.test(withHash) ? withHash.toLowerCase() : undefined;
}

function extractPalette(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => normalizeHex(entry))
      .filter((color): color is string => Boolean(color))
      .slice(0, 8);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return normalizeHex(entry);
      }

      if (isRecord(entry)) {
        return normalizeHex(
          asString(entry.hex) ?? asString(entry.color) ?? asString(entry.value) ?? "",
        );
      }

      return undefined;
    })
    .filter((color): color is string => Boolean(color))
    .slice(0, 8);
}

function colorDistance(a: string, b: string) {
  const parse = (hex: string) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);

  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

function pickShirtColor(palette: string[], seed = 0) {
  if (palette.length === 0) {
    return "Black";
  }

  const chosenPaletteColor = palette[Math.abs(seed) % palette.length];
  let best = allowedShirtColors[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const shirtColor of allowedShirtColors) {
    const score = colorDistance(chosenPaletteColor, shirtColor.hex);

    if (score < bestScore) {
      best = shirtColor;
      bestScore = score;
    }
  }

  return best.name;
}

function getMetadataField(metadata: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = asString(metadata[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function firstPalette(metadata: UnknownRecord) {
  const attributePalette = extractAttributePalette(metadata);

  if (attributePalette.length > 0) {
    return attributePalette;
  }

  for (const key of ["palette", "colors", "paletteColors"]) {
    const palette = extractPalette(metadata[key]);

    if (palette.length > 0) {
      return palette;
    }
  }

  return [];
}

function getAttributes(metadata: UnknownRecord) {
  return Array.isArray(metadata.attributes)
    ? metadata.attributes.filter(isRecord)
    : [];
}

function getTraitValue(metadata: UnknownRecord, traitType: string) {
  const trait = getAttributes(metadata).find(
    (attribute) => asString(attribute.trait_type) === traitType,
  );

  return trait ? asString(trait.value) : undefined;
}

function extractAttributePalette(metadata: UnknownRecord) {
  return getAttributes(metadata)
    .filter((attribute) => asString(attribute.trait_type)?.startsWith("Color #"))
    .map((attribute) => normalizeHex(asString(attribute.value) ?? ""))
    .filter((color): color is string => Boolean(color));
}

function getArtworkUrl(day: number, metadata: UnknownRecord) {
  const metadataUrl = getMetadataField(metadata, [
    "image",
    "image_url",
    "imageUrl",
    "art_url",
  ]);

  if (
    metadataUrl?.startsWith("https://basepaint.net/") ||
    metadataUrl?.startsWith("https://basepaint.xyz/")
  ) {
    return metadataUrl;
  }

  return `https://basepaint.xyz/api/art/image?day=${day}`;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "text/html,application/json" },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

async function graphqlRequest<T>(query: string): Promise<T> {
  const response = await fetch("https://graphql.basepaint.xyz/", {
    method: "POST",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`BasePaint GraphQL returned ${response.status}`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;

  if (payload.errors?.length) {
    throw new Error(
      payload.errors.map((error) => error.message ?? "GraphQL error").join("; "),
    );
  }

  if (!payload.data) {
    throw new Error("BasePaint GraphQL returned no data.");
  }

  return payload.data;
}

async function discoverCompletedDayFromHomepage() {
  const configuredDay = asNumber(process.env.BASEPAINT_DAY);

  if (configuredDay) {
    return configuredDay;
  }

  const homepage = await fetchText("https://basepaint.xyz/");
  const matches = [
    ...homepage.matchAll(/\/api\/art\/(\d+)/g),
    ...homepage.matchAll(/[?&]day=(\d+)/g),
    ...homepage.matchAll(/\/v3\/(\d{4,})\.png/g),
  ];
  const days = matches
    .map((match) => Number.parseInt(match[1], 10))
    .filter((day) => Number.isFinite(day));

  if (days.length === 0) {
    throw new Error("Could not discover a BasePaint day from the homepage.");
  }

  return Math.max(...days) - 1;
}

function parseGraphqlCanvas(value: unknown): GraphqlCanvas | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = asNumber(value.id);

  if (!id) {
    return undefined;
  }

  return {
    id,
    name: asString(value.name),
    palette: extractPalette(value.palette),
    size: asNumber(value.size),
  };
}

async function fetchCurrentCanvas() {
  const configuredDay = asNumber(process.env.BASEPAINT_DAY);

  if (configuredDay) {
    const data = await graphqlRequest<{ canvas: unknown }>(`{
      canvas(id: ${configuredDay}) {
        id
        name
        palette
        size
      }
    }`);
    const canvas = parseGraphqlCanvas(data.canvas);

    if (!canvas) {
      throw new Error(`Canvas ${configuredDay} was not found in GraphQL.`);
    }

    return { canvas, isConfiguredOverride: true };
  }

  const data = await graphqlRequest<{ canvass: { items?: unknown[] } }>(`{
    canvass(orderBy: "id", orderDirection: "desc", limit: 8) {
      items {
        id
        name
        palette
        size
      }
    }
  }`);
  const canvases = (data.canvass.items ?? [])
    .map(parseGraphqlCanvas)
    .filter((canvas): canvas is GraphqlCanvas => Boolean(canvas));
  const topCanvasId = canvases[0]?.id;
  const canvas = canvases.find((item) => item.id === (topCanvasId ?? 0) - 1);

  if (!canvas) {
    throw new Error("The previous BasePaint canvas was not returned from GraphQL.");
  }

  return { canvas, isConfiguredOverride: false };
}

function buildProduct(day: number, metadata: UnknownRecord): DemoProduct {
  const theme =
    getTraitValue(metadata, "Theme") ??
    getMetadataField(metadata, ["theme", "title"]) ??
    `Day ${day}`;
  const palette = firstPalette(metadata);
  const artUrl = getArtworkUrl(day, metadata);

  return {
    ...demoProduct,
    id: `basepaint-${day}`,
    basepaintDay: day,
    theme,
    name: `BasePaint #${day} Tee`,
    priceCents: productPriceCents,
    shirtColor: pickShirtColor(palette, day),
    palette: palette.length > 0 ? palette : demoProduct.palette,
    artUrl,
    frontPrintText: [`BasePaint #${day}`, theme],
    dataSource: "live",
    statusMessage: "Fetched from BasePaint public endpoints.",
  };
}

async function hydrateCanvasFromMetadata(canvas: GraphqlCanvas) {
  if (canvas.name && canvas.palette.length > 0) {
    return canvas;
  }

  const metadata = await fetchJson(`https://basepaint.xyz/api/art/${canvas.id}`);

  if (!isRecord(metadata)) {
    throw new Error(`BasePaint metadata for day ${canvas.id} was not an object.`);
  }

  return {
    ...canvas,
    name: canvas.name ?? getTraitValue(metadata, "Theme") ?? undefined,
    palette: canvas.palette.length > 0 ? canvas.palette : firstPalette(metadata),
  };
}

function buildGraphqlProduct(
  canvas: GraphqlCanvas,
  isConfiguredOverride: boolean,
): DemoProduct {
  const theme = canvas.name ?? `Day ${canvas.id}`;

  return {
    ...demoProduct,
    id: `basepaint-${canvas.id}`,
    basepaintDay: canvas.id,
    theme,
    name: `BasePaint #${canvas.id} Tee`,
    priceCents: productPriceCents,
    shirtColor: pickShirtColor(canvas.palette, canvas.id),
    palette: canvas.palette.length > 0 ? canvas.palette : demoProduct.palette,
    artUrl: `https://basepaint.xyz/api/art/image?day=${canvas.id}`,
    frontPrintText: [`BasePaint #${canvas.id}`, theme],
    dataSource: "live",
    statusMessage: isConfiguredOverride
      ? "Fetched configured BasePaint day from GraphQL and BasePaint metadata."
      : "Fetched previous BasePaint canvas from GraphQL and theme from BasePaint metadata.",
  };
}

export async function getDailyProduct(): Promise<DemoProduct> {
  try {
    const { canvas, isConfiguredOverride } = await fetchCurrentCanvas();
    const hydratedCanvas = await hydrateCanvasFromMetadata(canvas);

    return buildGraphqlProduct(hydratedCanvas, isConfiguredOverride);
  } catch (graphqlError) {
    try {
      const day = await discoverCompletedDayFromHomepage();
      const metadata = await fetchJson(`https://basepaint.xyz/api/art/${day}`);

      if (!isRecord(metadata)) {
        throw new Error("BasePaint metadata response was not an object.");
      }

      return buildProduct(day, metadata);
    }
    catch (fallbackError) {
      const graphqlMessage =
        graphqlError instanceof Error ? graphqlError.message : "Unknown GraphQL error";
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : "Unknown fallback error";

      return {
        ...demoProduct,
        statusMessage: `Live BasePaint fetch failed: ${graphqlMessage}; fallback failed: ${fallbackMessage}`,
      };
    }
  }
}
