"use client";

import { AccountButton } from "@/components/account-button";
import type { ShirtSize } from "@/lib/demo-product";

export type CheckoutQuoteResponse = {
  productName: string;
  productPrice: string;
  shippingPrice: string;
  fiatPrice: string;
  shippingCostCents: number;
  totalPriceCents: number;
  chainId: number;
  displayAmountEth: string;
  ethUsdPrice: string;
  isAdminDiscount?: boolean;
  error?: string;
};

export type CheckoutResponse = CheckoutQuoteResponse & {
  orderId: string;
  paymentReference: string;
  orderUrl: string;
  receiverAddress: string;
  expectedAmountWei: string;
  expiresAt: string;
  error?: string;
};

type CheckoutSummaryProps = {
  quote: CheckoutQuoteResponse;
  isLoading: boolean;
  isSignedIn: boolean;
  selectedSize: ShirtSize;
  shirtColor: string;
  theme: string;
  onBack: () => void;
  onAuthChange: (isSignedIn: boolean) => void;
  onPay: () => void;
};

export function CheckoutSummary({
  quote,
  isLoading,
  isSignedIn,
  selectedSize,
  shirtColor,
  theme,
  onBack,
  onAuthChange,
  onPay,
}: CheckoutSummaryProps) {
  return (
    <div className="grid gap-5">
      <div className="border border-white/15 bg-[#050608] p-4">
        <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#41c7ff]">
          Order summary
        </p>
        <h3 className="mt-2 font-mono text-2xl font-black">{quote.productName}</h3>
        <p className="mt-1 text-sm text-white/60">
          {theme} / {shirtColor} / {selectedSize}
        </p>
        {quote.isAdminDiscount ? (
          <p className="mt-3 border border-[#41c7ff]/40 bg-[#41c7ff]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#dff8ff]">
            Admin checkout price applied
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span>Product</span>
            <span className="font-semibold">{quote.productPrice}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Shipping</span>
            <span className="font-semibold">{quote.shippingPrice}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-2 text-base">
            <span>Total</span>
            <span className="font-semibold">{quote.fiatPrice}</span>
          </div>
          <div className="flex justify-between gap-4 text-base">
            <span>Pay on Base</span>
            <span className="font-semibold">{quote.displayAmountEth} ETH</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#2563eb]">
          Sign in and pay on Base
        </p>
        <p className="font-mono text-3xl font-black">{quote.displayAmountEth} ETH</p>
        <p className="text-white/60">
          Sign in with Ethereum on Base, then the final exact amount and order reference
          will be created.
        </p>
        {!isSignedIn ? (
          <div className="mt-2">
            <AccountButton onAuthChange={onAuthChange} tone="dark" variant="button" />
          </div>
        ) : null}
      </div>

      <div className={`grid gap-2 ${isSignedIn ? "sm:grid-cols-[0.7fr_1fr]" : ""}`}>
        <button
          className="min-h-12 border border-white/20 px-5 font-mono text-sm font-black uppercase tracking-[0.14em]"
          disabled={isLoading}
          onClick={onBack}
          type="button"
        >
          Back
        </button>
        {isSignedIn ? (
          <button
            className="min-h-12 border border-[#41c7ff] bg-[#41c7ff] px-5 font-mono text-sm font-black uppercase tracking-[0.14em] text-[#050608] transition hover:bg-white disabled:cursor-wait disabled:bg-[#696969]"
            disabled={isLoading}
            onClick={onPay}
            type="button"
          >
            {isLoading ? "Opening wallet..." : "Pay on Base"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
