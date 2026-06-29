"use client";

import { useEffect, useState } from "react";
import { formatPrice, type DemoProduct, type ShirtSize } from "@/lib/demo-product";
import { supportedShippingCountries } from "@/lib/shipping-countries";

type CheckoutResponse = {
  orderId: string;
  paymentReference: string;
  orderUrl: string;
  productPrice: string;
  shippingPrice: string;
  fiatPrice: string;
  shippingCostCents: number;
  totalPriceCents: number;
  receiverAddress: string;
  chainId: number;
  expectedAmountWei: string;
  displayAmountEth: string;
  ethUsdPrice: string;
  expiresAt: string;
  error?: string;
};

type OrderStatusResponse = {
  order?: {
    status: string;
    paymentStatus: string;
    paymentTxHash?: string | null;
    fulfillmentOrderId?: string | null;
    fulfillmentError?: string | null;
  };
  error?: string;
};

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const baseChain = {
  chainId: "0x2105",
  chainName: "Base",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

function weiToHex(value: string) {
  return `0x${BigInt(value).toString(16)}`;
}

export function ProductDetails({ product }: { product: DemoProduct }) {
  const [selectedSize, setSelectedSize] = useState<ShirtSize>("L");
  const [checkoutError, setCheckoutError] = useState<string>();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutResponse>();
  const [orderStatus, setOrderStatus] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [form, setForm] = useState({
    customerEmail: "",
    customerName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const price = formatPrice(product.priceCents, product.currency);

  async function createCheckout() {
    setCheckoutError(undefined);
    setIsCheckingOut(true);
    setOrderStatus(undefined);
    setTxHash(undefined);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyProductId: product.id,
          size: selectedSize,
          customerEmail: form.customerEmail,
          customerName: form.customerName,
          shipping: {
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
          },
        }),
      });
      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Checkout is not available right now.");
      }

      setCheckout(data);
      setOrderStatus("Waiting for wallet payment");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function payWithWallet() {
    if (!checkout) {
      return;
    }

    if (!window.ethereum) {
      setCheckoutError("No wallet found. Install a wallet that supports Base.");
      return;
    }

    setCheckoutError(undefined);
    setIsCheckingOut(true);

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: baseChain.chainId }],
        });
      } catch {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [baseChain],
        });
      }

      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: checkout.receiverAddress,
            value: weiToHex(checkout.expectedAmountWei),
          },
        ],
      })) as string;

      setTxHash(hash);
      setOrderStatus("Transaction submitted. Waiting for Base confirmation.");
      window.location.href = checkout.orderUrl;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Wallet payment failed.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  useEffect(() => {
    if (!checkout) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(
        `/api/checkout?reference=${encodeURIComponent(checkout.paymentReference)}`,
      );
      const data = (await response.json()) as OrderStatusResponse;

      if (!response.ok || data.error || !data.order) {
        return;
      }

      setOrderStatus(data.order.status);

      if (data.order.paymentTxHash) {
        setTxHash(data.order.paymentTxHash);
      }

      if (
        [
          "simulated_fulfillment",
          "printful_draft_created",
          "printify_order_created",
          "printify_sent_to_production",
          "fulfillment_failed",
        ].includes(data.order.status)
      ) {
        window.clearInterval(interval);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [checkout]);

  return (
    <aside className="self-start border border-[#171717] bg-white p-6 shadow-[8px_8px_0_#171717] lg:sticky lg:top-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff4d6d]">
        Today&apos;s mintable tee
      </p>
      <h1 className="mt-4 text-5xl font-semibold leading-[1.02] tracking-tight">
        {product.name}
      </h1>
      <p className="mt-4 text-xl text-[#4a4a4a]">{product.theme}</p>

      <div className="mt-8 flex items-end justify-between gap-4 border-y border-[#171717]/15 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
            Price
          </p>
          <p className="mt-1 text-3xl font-semibold">{price}</p>
          {checkout ? (
            <p className="mt-1 text-sm font-semibold text-[#4a4a4a]">
              {checkout.displayAmountEth} ETH
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
            Color
          </p>
          <p className="mt-1 text-lg font-semibold">{product.shirtColor}</p>
        </div>
      </div>

      <fieldset className="mt-7">
        <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
          Size
        </legend>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {product.sizes.map((size) => {
            const isSelected = selectedSize === size;

            return (
              <button
                className={`min-h-12 border text-sm font-semibold transition ${
                  isSelected
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#171717]/25 bg-white text-[#171717] hover:border-[#171717]"
                }`}
                key={size}
                onClick={() => setSelectedSize(size)}
                type="button"
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-2">
        <input
          className="min-h-11 border border-[#171717]/25 px-3 text-sm"
          onChange={(event) => setForm({ ...form, customerEmail: event.target.value })}
          placeholder="Email"
          type="email"
          value={form.customerEmail}
        />
        <input
          className="min-h-11 border border-[#171717]/25 px-3 text-sm"
          onChange={(event) => setForm({ ...form, customerName: event.target.value })}
          placeholder="Full name"
          value={form.customerName}
        />
        <input
          className="min-h-11 border border-[#171717]/25 px-3 text-sm"
          onChange={(event) => setForm({ ...form, line1: event.target.value })}
          placeholder="Address line 1"
          value={form.line1}
        />
        <input
          className="min-h-11 border border-[#171717]/25 px-3 text-sm"
          onChange={(event) => setForm({ ...form, line2: event.target.value })}
          placeholder="Address line 2"
          value={form.line2}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="min-h-11 border border-[#171717]/25 px-3 text-sm"
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            placeholder="City"
            value={form.city}
          />
          <input
            className="min-h-11 border border-[#171717]/25 px-3 text-sm"
            onChange={(event) => setForm({ ...form, state: event.target.value })}
            placeholder="State / province"
            value={form.state}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="min-h-11 border border-[#171717]/25 px-3 text-sm"
            onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
            placeholder="Postal code"
            value={form.postalCode}
          />
          <select
            className="min-h-11 border border-[#171717]/25 bg-white px-3 text-sm"
            onChange={(event) => setForm({ ...form, country: event.target.value })}
            value={form.country}
          >
            {supportedShippingCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="mt-5 flex min-h-14 w-full items-center justify-center border border-[#171717] bg-[#171717] px-5 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-[#696969]"
        type="button"
        disabled={isCheckingOut}
        onClick={checkout ? payWithWallet : createCheckout}
      >
        {isCheckingOut
          ? "Working..."
          : checkout
            ? `Pay ${checkout.displayAmountEth} ETH`
            : "Create Base payment"}
      </button>

      {checkout ? (
        <div className="mt-4 border border-[#171717]/15 bg-[#f7f4ee] p-3 text-sm">
          <p className="font-semibold">Send exact amount on Base</p>
          <div className="mt-2 grid gap-1">
            <p>Product: {checkout.productPrice}</p>
            <p>Shipping: {checkout.shippingPrice}</p>
            <p className="font-semibold">Total: {checkout.fiatPrice}</p>
          </div>
          <p className="mt-2 break-all">To: {checkout.receiverAddress}</p>
          <p className="mt-1 break-all">Amount: {checkout.displayAmountEth} ETH</p>
          <p className="mt-1">Expires: {new Date(checkout.expiresAt).toLocaleString()}</p>
          {orderStatus ? <p className="mt-2 font-semibold">Status: {orderStatus}</p> : null}
          {txHash ? <p className="mt-1 break-all">Tx: {txHash}</p> : null}
          <a
            className="mt-3 inline-flex font-semibold underline underline-offset-4"
            href={checkout.orderUrl}
          >
            Track order
          </a>
        </div>
      ) : null}

      {checkoutError ? (
        <p className="mt-3 border border-[#ff4d6d] bg-[#fff1f4] px-3 py-2 text-sm font-semibold text-[#b00020]">
          {checkoutError}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-[#4a4a4a]">
        Shipping is calculated before payment through Printify. The wallet
        transaction sends ETH on Base directly to the receiver address. Selected
        size: {selectedSize}.
      </p>

      {product.frontPrintUrl && product.backPrintUrl ? (
        <div className="mt-5 grid gap-2 text-sm">
          <a className="font-semibold underline underline-offset-4" href={product.frontPrintUrl}>
            Front print file
          </a>
          <a className="font-semibold underline underline-offset-4" href={product.backPrintUrl}>
            Back print file
          </a>
        </div>
      ) : null}
    </aside>
  );
}
