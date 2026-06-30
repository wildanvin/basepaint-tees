"use client";

import { useState } from "react";
import { CheckoutModal } from "@/components/checkout-modal";
import { formatPrice, type DemoProduct, type ShirtSize } from "@/lib/demo-product";

export function ProductDetails({ product }: { product: DemoProduct }) {
  const [selectedSize, setSelectedSize] = useState<ShirtSize>("L");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const price = formatPrice(product.priceCents, product.currency);

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

      <button
        className="mt-7 flex min-h-14 w-full items-center justify-center border border-[#171717] bg-[#171717] px-5 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#2b2b2b]"
        onClick={() => setIsCheckoutOpen(true)}
        type="button"
      >
        Buy
      </button>

      <p className="mt-4 text-sm leading-6 text-[#4a4a4a]">
        Shipping is calculated before payment through Printify. Selected size:{" "}
        {selectedSize}.
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

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        selectedSize={selectedSize}
      />
    </aside>
  );
}
