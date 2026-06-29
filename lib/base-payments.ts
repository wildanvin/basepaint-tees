import "server-only";

import crypto from "node:crypto";
import type { ShirtSize } from "@/lib/demo-product";
import {
  getOrderByPaymentTx,
  getPendingOrderByExpectedPayment,
  markOrderPaid,
  recordPaymentEvent,
  type PaymentEventInput,
} from "@/lib/order-store";

export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_ID_HEX = "0x2105";

type AlchemyPriceResponse = {
  data?: Array<{
    symbol?: string;
    prices?: Array<{
      currency?: string;
      value?: string;
    }>;
  }>;
};

type AssetTransfer = {
  hash?: string;
  from?: string;
  to?: string;
  asset?: string;
  category?: string;
  value?: string | number | null;
  rawContract?: {
    value?: string | null;
    rawValue?: string | null;
  };
};

type AssetTransferResponse = {
  result?: {
    transfers?: AssetTransfer[];
  };
};

export type CheckoutQuote = {
  expectedAmountWei: string;
  displayAmountEth: string;
  ethUsdPrice: string;
  receiverAddress: string;
  chainId: number;
  expiresAt: string;
  paymentReference: string;
};

export type PaymentTransfer = {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amountWei: string;
};

const weiPerEth = BigInt("1000000000000000000");

function getAlchemyApiKey() {
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY is not configured.");
  }

  return apiKey;
}

export function getPaymentReceiverAddress() {
  const address = process.env.PAYMENT_RECEIVER_ADDRESS;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("PAYMENT_RECEIVER_ADDRESS must be a valid 0x address.");
  }

  return address.toLowerCase();
}

export function getPaymentExpirationMinutes() {
  const minutes = Number.parseInt(process.env.PAYMENT_EXPIRATION_MINUTES ?? "30", 10);

  return Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
}

function makeReference() {
  return crypto.randomBytes(10).toString("hex");
}

function uniqueWeiSuffix(reference: string) {
  return BigInt(`0x${reference.slice(0, 8)}`) % BigInt(900000) + BigInt(100000);
}

function formatEth(wei: bigint) {
  const whole = wei / weiPerEth;
  const fraction = (wei % weiPerEth).toString().padStart(18, "0").replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function decimalEthToWei(value: string) {
  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = BigInt(wholePart || "0") * weiPerEth;
  const fraction = BigInt(fractionPart.padEnd(18, "0").slice(0, 18) || "0");

  return whole + fraction;
}

function usdCentsToWei(priceCents: number, ethUsdPrice: string) {
  const price = Number.parseFloat(ethUsdPrice);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid ETH/USD price.");
  }

  const eth = priceCents / 100 / price;

  return decimalEthToWei(eth.toFixed(18));
}

export async function getEthUsdPrice() {
  if (process.env.ETH_USD_PRICE) {
    return process.env.ETH_USD_PRICE;
  }

  const response = await fetch(
    `https://api.g.alchemy.com/prices/v1/${getAlchemyApiKey()}/tokens/by-symbol?symbols=ETH`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Alchemy price request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as AlchemyPriceResponse;
  const price = payload.data
    ?.find((item) => item.symbol?.toUpperCase() === "ETH")
    ?.prices?.find((item) => item.currency?.toUpperCase() === "USD")?.value;

  if (!price) {
    throw new Error("Alchemy did not return an ETH/USD price.");
  }

  return price;
}

export async function createCheckoutQuote({
  priceCents,
}: {
  priceCents: number;
  size: ShirtSize;
}): Promise<CheckoutQuote> {
  const reference = makeReference();
  const ethUsdPrice = await getEthUsdPrice();
  const quotedWei = usdCentsToWei(priceCents, ethUsdPrice);
  const expectedAmountWei = quotedWei + uniqueWeiSuffix(reference);
  const expiresAt = new Date(
    Date.now() + getPaymentExpirationMinutes() * 60 * 1000,
  ).toISOString();

  return {
    expectedAmountWei: expectedAmountWei.toString(),
    displayAmountEth: formatEth(expectedAmountWei),
    ethUsdPrice,
    receiverAddress: getPaymentReceiverAddress(),
    chainId: BASE_CHAIN_ID,
    expiresAt,
    paymentReference: reference,
  };
}

function normalizeAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value)
    ? value.toLowerCase()
    : undefined;
}

function valueToWei(value: unknown) {
  if (typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value)) {
    return BigInt(value).toString();
  }

  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) {
    return decimalEthToWei(value).toString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return decimalEthToWei(value.toString()).toString();
  }

  return undefined;
}

export function extractAlchemyTransfers(payload: unknown): PaymentTransfer[] {
  const activities = (payload as { event?: { activity?: unknown[] } })?.event?.activity;

  if (!Array.isArray(activities)) {
    return [];
  }

  return activities.flatMap((activity) => {
    const item = activity as {
      hash?: unknown;
      fromAddress?: unknown;
      from?: unknown;
      toAddress?: unknown;
      to?: unknown;
      value?: unknown;
      rawContract?: { value?: unknown; rawValue?: unknown };
      asset?: unknown;
      category?: unknown;
    };
    const asset = typeof item.asset === "string" ? item.asset.toUpperCase() : undefined;
    const category = typeof item.category === "string" ? item.category : undefined;

    if (asset && asset !== "ETH") {
      return [];
    }

    if (category && !["external", "internal"].includes(category)) {
      return [];
    }

    const txHash = typeof item.hash === "string" ? item.hash.toLowerCase() : undefined;
    const fromAddress = normalizeAddress(item.fromAddress ?? item.from);
    const toAddress = normalizeAddress(item.toAddress ?? item.to);
    const amountWei = valueToWei(
      item.rawContract?.rawValue ?? item.rawContract?.value ?? item.value,
    );

    if (!txHash || !fromAddress || !toAddress || !amountWei) {
      return [];
    }

    return [{ txHash, fromAddress, toAddress, amountWei }];
  });
}

async function alchemyRpc<T>(method: string, params: unknown[]) {
  const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${getAlchemyApiKey()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Alchemy RPC request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function getRecentReceiverTransfers() {
  const payload = await alchemyRpc<AssetTransferResponse>("alchemy_getAssetTransfers", [
    {
      fromBlock: "0x0",
      toAddress: getPaymentReceiverAddress(),
      category: ["external"],
      withMetadata: true,
      excludeZeroValue: true,
      maxCount: "0x32",
      order: "desc",
    },
  ]);

  return (payload.result?.transfers ?? []).flatMap((transfer) => {
    if (transfer.asset && transfer.asset.toUpperCase() !== "ETH") {
      return [];
    }

    if (transfer.category && !["external", "internal"].includes(transfer.category)) {
      return [];
    }

    const txHash = transfer.hash?.toLowerCase();
    const fromAddress = normalizeAddress(transfer.from);
    const toAddress = normalizeAddress(transfer.to);
    const amountWei = valueToWei(
      transfer.rawContract?.rawValue ?? transfer.rawContract?.value ?? transfer.value,
    );

    if (!txHash || !fromAddress || !toAddress || !amountWei) {
      return [];
    }

    return [{ txHash, fromAddress, toAddress, amountWei }];
  });
}

export async function matchAndConfirmTransfer(
  transfer: PaymentTransfer,
  source: PaymentEventInput["source"],
) {
  const existingOrder = await getOrderByPaymentTx(transfer.txHash);

  if (existingOrder) {
    await recordPaymentEvent({
      txHash: transfer.txHash,
      fromAddress: transfer.fromAddress,
      toAddress: transfer.toAddress,
      amountWei: transfer.amountWei,
      matchedOrderId: existingOrder.id,
      source,
      rawPayload: transfer,
    });

    return { order: existingOrder, matched: true, duplicate: true };
  }

  const order = await getPendingOrderByExpectedPayment({
    receiverAddress: transfer.toAddress,
    expectedAmountWei: transfer.amountWei,
  });

  await recordPaymentEvent({
    txHash: transfer.txHash,
    fromAddress: transfer.fromAddress,
    toAddress: transfer.toAddress,
    amountWei: transfer.amountWei,
    matchedOrderId: order?.id,
    source,
    rawPayload: transfer,
  });

  if (!order) {
    return { order: undefined, matched: false, duplicate: false };
  }

  const paidOrder = await markOrderPaid({
    orderId: order.id,
    txHash: transfer.txHash,
    payerAddress: transfer.fromAddress,
    receivedAmountWei: transfer.amountWei,
  });

  return { order: paidOrder, matched: true, duplicate: false };
}

export function verifyAlchemySignature({
  body,
  signature,
}: {
  body: string;
  signature: string | null;
}) {
  const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;

  if (!signingKey) {
    throw new Error("ALCHEMY_WEBHOOK_SIGNING_KEY is not configured.");
  }

  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", signingKey).update(body).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature.replace(/^0x/, ""), "hex");

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
