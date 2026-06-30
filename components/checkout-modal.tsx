"use client";

import { useState } from "react";
import {
  CheckoutAddressForm,
  type CheckoutFormState,
} from "@/components/checkout-address-form";
import { CheckoutSummary, type CheckoutResponse } from "@/components/checkout-summary";
import type { DemoProduct, ShirtSize } from "@/lib/demo-product";

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: DemoProduct;
  selectedSize: ShirtSize;
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

const initialForm: CheckoutFormState = {
  customerEmail: "",
  customerName: "",
  line1: "",
  line2: "",
  reference: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

function weiToHex(value: string) {
  return `0x${BigInt(value).toString(16)}`;
}

export function CheckoutModal({
  isOpen,
  onClose,
  product,
  selectedSize,
}: CheckoutModalProps) {
  const [step, setStep] = useState<"shipping" | "summary">("shipping");
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [checkout, setCheckout] = useState<CheckoutResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  function closeModal() {
    setStep("shipping");
    setCheckout(undefined);
    setError(undefined);
    setIsLoading(false);
    onClose();
  }

  async function createCheckoutQuote() {
    setError(undefined);
    setIsLoading(true);

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
            reference: form.reference,
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
      setStep("summary");
    } catch (quoteError) {
      setError(
        quoteError instanceof Error
          ? quoteError.message
          : "Shipping is not available for this address.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function payWithWallet() {
    if (!checkout) {
      return;
    }

    if (!window.ethereum) {
      setError("No wallet found. Install a wallet that supports Base.");
      return;
    }

    setError(undefined);
    setIsLoading(true);

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

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: checkout.receiverAddress,
            value: weiToHex(checkout.expectedAmountWei),
          },
        ],
      });

      window.location.href = checkout.orderUrl;
    } catch (walletError) {
      setError(walletError instanceof Error ? walletError.message : "Wallet payment failed.");
      setIsLoading(false);
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-black/55 p-0 sm:items-center sm:p-6"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-auto border border-[#171717] bg-white p-5 shadow-[8px_8px_0_#171717] sm:mx-auto sm:max-w-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff4d6d]">
              Checkout
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {step === "shipping" ? "Shipping details" : "Review and pay"}
            </h2>
          </div>
          <button
            className="flex size-10 items-center justify-center border border-[#171717]/25 text-xl leading-none"
            onClick={closeModal}
            type="button"
          >
            x
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <div
            className={`h-1 flex-1 ${step === "shipping" ? "bg-[#171717]" : "bg-[#41c7ff]"}`}
          />
          <div className={`h-1 flex-1 ${step === "summary" ? "bg-[#171717]" : "bg-[#d8d8d8]"}`} />
        </div>

        <div className="mt-6">
          {step === "shipping" ? (
            <CheckoutAddressForm
              form={form}
              isLoading={isLoading}
              onChange={setForm}
              onSubmit={createCheckoutQuote}
            />
          ) : checkout ? (
            <CheckoutSummary
              checkout={checkout}
              isLoading={isLoading}
              onBack={() => setStep("shipping")}
              onPay={payWithWallet}
              selectedSize={selectedSize}
              shirtColor={product.shirtColor}
              theme={product.theme}
            />
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 border border-[#ff4d6d] bg-[#fff1f4] px-3 py-2 text-sm font-semibold text-[#b00020]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
