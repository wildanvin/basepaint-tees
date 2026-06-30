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
  selectedSize: ShirtSize;
  shirtColor: string;
  theme: string;
  onBack: () => void;
  onPay: () => void;
};

export function CheckoutSummary({
  quote,
  isLoading,
  selectedSize,
  shirtColor,
  theme,
  onBack,
  onPay,
}: CheckoutSummaryProps) {
  return (
    <div className="grid gap-5">
      <div className="border border-[#171717]/15 bg-[#f7f4ee] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
          Order summary
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{quote.productName}</h3>
        <p className="mt-1 text-sm text-[#4a4a4a]">
          {theme} / {shirtColor} / {selectedSize}
        </p>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span>Product</span>
            <span className="font-semibold">{quote.productPrice}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Shipping</span>
            <span className="font-semibold">{quote.shippingPrice}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-[#171717]/15 pt-2 text-base">
            <span>Total</span>
            <span className="font-semibold">{quote.fiatPrice}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
          Sign in and pay on Base
        </p>
        <p className="text-3xl font-semibold">~{quote.displayAmountEth} ETH</p>
        <p className="text-[#4a4a4a]">
          Sign in with Ethereum on Base, then the final exact amount and order reference
          will be created.
        </p>
        <div className="mt-2 justify-self-start">
          <AccountButton />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[0.7fr_1fr]">
        <button
          className="min-h-12 border border-[#171717]/25 px-5 text-sm font-bold uppercase tracking-[0.14em]"
          disabled={isLoading}
          onClick={onBack}
          type="button"
        >
          Back
        </button>
        <button
          className="min-h-12 border border-[#171717] bg-[#171717] px-5 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#2b2b2b] disabled:cursor-wait disabled:bg-[#696969]"
          disabled={isLoading}
          onClick={onPay}
          type="button"
        >
          {isLoading ? "Opening wallet..." : "Pay on Base"}
        </button>
      </div>
    </div>
  );
}
