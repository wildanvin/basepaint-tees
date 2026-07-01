"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useConnection, useConnect, useSendTransaction, useSwitchChain } from "wagmi";
import {
  CheckoutAddressForm,
  type CheckoutFormState,
} from "@/components/checkout-address-form";
import {
  CheckoutSummary,
  type CheckoutQuoteResponse,
  type CheckoutResponse,
} from "@/components/checkout-summary";
import type { DemoProduct, ShirtSize } from "@/lib/demo-product";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { baseChain } from "@/lib/wagmi-config";
import { findAvailableConnector, getWalletErrorMessage } from "@/lib/wallet-connector";
import {
  normalizeWalletAddress,
  walletAddressFromIdentityData,
} from "@/lib/wallet-address";

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: DemoProduct;
  selectedSize: ShirtSize;
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

function walletFromUser(user: {
  identities?: Array<{ identity_data?: Record<string, unknown> }>;
  user_metadata?: Record<string, unknown>;
} | null) {
  const identityAddress = user?.identities
    ?.map((identity) => walletAddressFromIdentityData(identity.identity_data))
    .find(Boolean);
  const metadataCandidate = user?.user_metadata?.address ?? user?.user_metadata?.wallet_address;

  return identityAddress ?? normalizeWalletAddress(metadataCandidate);
}

export function CheckoutModal({
  isOpen,
  onClose,
  product,
  selectedSize,
}: CheckoutModalProps) {
  const [step, setStep] = useState<"shipping" | "summary">("shipping");
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [quote, setQuote] = useState<CheckoutQuoteResponse>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { address, chainId, isConnected } = useConnection();
  const { connectAsync, connectors } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const supabase = getSupabaseBrowser();

  if (!isOpen) {
    return null;
  }

  function closeModal() {
    setStep("shipping");
    setQuote(undefined);
    setError(undefined);
    setIsLoading(false);
    setIsSignedIn(false);
    onClose();
  }

  async function createCheckoutQuote() {
    setError(undefined);
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout/quote", {
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
      const data = (await response.json()) as CheckoutQuoteResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Checkout is not available right now.");
      }

      setQuote(data);
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
    if (!quote) {
      return;
    }

    setError(undefined);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Sign in with Ethereum before payment.");
      }

      let walletAddress = normalizeWalletAddress(address);

      if (!isConnected || !walletAddress) {
        const { connector: activeConnector } = await findAvailableConnector(
          undefined,
          connectors,
        );

        const connection = await connectAsync({
          connector: activeConnector,
          chainId: baseChain.id,
        });
        walletAddress = normalizeWalletAddress(connection.accounts[0]);
      }

      const signedWallet = walletFromUser(user);

      if (!walletAddress) {
        throw new Error("No connected wallet address found.");
      }

      if (signedWallet && signedWallet !== walletAddress) {
        throw new Error("Connected wallet does not match the signed-in wallet.");
      }

      if (chainId !== baseChain.id) {
        await switchChainAsync({ chainId: baseChain.id });
      }

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
          walletAddress,
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
      const checkout = (await response.json()) as CheckoutResponse;

      if (!response.ok || checkout.error) {
        throw new Error(checkout.error ?? "Unable to create payment order.");
      }

      await sendTransactionAsync({
        chainId: baseChain.id,
        to: checkout.receiverAddress as Address,
        value: BigInt(checkout.expectedAmountWei),
      });

      window.location.href = checkout.orderUrl;
    } catch (walletError) {
      setError(getWalletErrorMessage(walletError));
      setIsLoading(false);
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:p-6"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-auto border border-white/15 bg-[#0b0d10] p-5 text-white shadow-[8px_8px_0_#41c7ff] sm:mx-auto sm:max-w-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#2563eb]">
              Checkout
            </p>
            <h2 className="mt-2 font-mono text-3xl font-black tracking-tight">
              {step === "shipping" ? "Shipping details" : "Review and pay"}
            </h2>
          </div>
          <button
            className="flex size-10 items-center justify-center border border-white/20 text-xl leading-none"
            onClick={closeModal}
            type="button"
          >
            x
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <div
            className={`h-1 flex-1 ${step === "shipping" ? "bg-[#41c7ff]" : "bg-white/20"}`}
          />
          <div className={`h-1 flex-1 ${step === "summary" ? "bg-[#41c7ff]" : "bg-white/20"}`} />
        </div>

        <div className="mt-6">
          {step === "shipping" ? (
            <CheckoutAddressForm
              form={form}
              isLoading={isLoading}
              onChange={setForm}
              onSubmit={createCheckoutQuote}
            />
          ) : quote ? (
            <CheckoutSummary
              isLoading={isLoading}
              isSignedIn={isSignedIn}
              onBack={() => setStep("shipping")}
              onAuthChange={setIsSignedIn}
              onPay={payWithWallet}
              quote={quote}
              selectedSize={selectedSize}
              shirtColor={product.shirtColor}
              theme={product.theme}
            />
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 border border-[#ff4d6d] bg-[#2c090f] px-3 py-2 text-sm font-semibold text-[#ff8fa3]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
