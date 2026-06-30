export type ShirtSize = "S" | "M" | "L" | "XL" | "2XL";

export const productPriceCents = 2500;

export type DemoProduct = {
  id: string;
  basepaintDay: number;
  theme: string;
  name: string;
  priceCents: number;
  currency: "USD";
  shirtColor: string;
  palette: string[];
  sizes: ShirtSize[];
  artUrl: string;
  frontPrintText: string[];
  frontPrintUrl?: string;
  backPrintUrl?: string;
  mockupFrontUrl?: string;
  mockupBackUrl?: string;
  mockups?: Array<{
    label: string;
    src: string;
    cameraLabel?: string;
  }>;
  printifyProductId?: string;
  printifyBlueprintId?: number;
  printifyPrintProviderId?: number;
  printifyVariants?: Record<string, number>;
  printifySyncStatus?: string;
  printifySyncedAt?: string;
  dataSource: "demo" | "live";
  statusMessage: string;
};

export const demoProduct: DemoProduct = {
  id: "demo-basepaint-1024",
  basepaintDay: 1024,
  theme: "Chromatic Relay",
  name: "BasePaint #1024 Tee",
  priceCents: productPriceCents,
  currency: "USD",
  shirtColor: "Black",
  palette: ["#111111", "#f7f3e8", "#41c7ff", "#ff4d6d", "#f9c74f"],
  sizes: ["S", "M", "L", "XL", "2XL"],
  artUrl: "https://basepaint.net/v3/1024.png",
  frontPrintText: ["BasePaint #1024", "Chromatic Relay"],
  dataSource: "demo",
  statusMessage: "Using bundled demo data.",
};

export function formatPrice(cents: number, currency: DemoProduct["currency"]) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
