"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice, type DemoProduct, type ShirtSize } from "@/lib/demo-product";

export function ProductExperience({ product }: { product: DemoProduct }) {
  const [selectedSize, setSelectedSize] = useState<ShirtSize>("L");
  const price = formatPrice(product.priceCents, product.currency);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#171717]">
      <header className="border-b border-[#171717]/15 px-5 py-4">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="text-sm font-bold uppercase tracking-[0.18em]" href="/">
            BasePaint Tees
          </Link>
          <Link
            className="text-sm font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
            href="/admin"
          >
            Admin
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:py-12">
        <div className="grid gap-5 md:grid-cols-[minmax(260px,420px)_1fr] lg:grid-cols-1">
          <div className="relative min-h-[520px] overflow-hidden border border-[#171717] bg-[#111111] shadow-[8px_8px_0_#171717]">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/15 bg-black/45 px-4 py-3 text-white">
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                Back print
              </span>
              <span className="text-xs uppercase tracking-[0.16em] text-white/70">
                {product.shirtColor}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pt-10">
              <div className="relative h-[440px] w-[300px]">
                <div className="absolute left-1/2 top-0 h-20 w-32 -translate-x-1/2 rounded-b-[48px] border border-white/20 bg-[#050505]" />
                <div className="absolute left-1/2 top-12 h-[390px] w-[250px] -translate-x-1/2 rounded-t-[46px] border border-white/15 bg-[#0b0b0b] shadow-2xl" />
                <div className="absolute left-0 top-20 h-48 w-24 -rotate-12 rounded-[34px] border border-white/10 bg-[#090909]" />
                <div className="absolute right-0 top-20 h-48 w-24 rotate-12 rounded-[34px] border border-white/10 bg-[#090909]" />
                <div className="absolute left-1/2 top-24 w-[190px] -translate-x-1/2 text-center text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    BasePaint #{product.basepaintDay}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/65">
                    {product.theme}
                  </p>
                  <div className="relative mt-5 aspect-square overflow-hidden border border-white/25 bg-white">
                    <Image
                      src={product.artUrl}
                      alt={`BasePaint #${product.basepaintDay} artwork`}
                      fill
                      priority
                      sizes="190px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            <div className="border border-[#171717] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
                Front
              </p>
              <div className="mt-5 flex min-h-48 items-start justify-end bg-[#111111] p-8 text-right text-white">
                <div>
                  {product.frontPrintText.map((line) => (
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.12em]"
                      key={line}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="border border-[#171717] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
                Palette
              </p>
              <div className="mt-5 grid grid-cols-5 border border-[#171717]">
                {product.palette.map((color) => (
                  <div
                    aria-label={color}
                    className="aspect-square border-r border-[#171717] last:border-r-0"
                    key={color}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#4a4a4a]">
                MVP color match: {product.shirtColor}. Palette matching now uses
                a small allowed Printful color list.
              </p>
            </div>
          </div>
        </div>

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
            type="button"
            onClick={() => {
              window.location.href = `/success?demo=1&size=${selectedSize}`;
            }}
          >
            Demo checkout
          </button>

          <p className="mt-4 text-sm leading-6 text-[#4a4a4a]">
            {product.dataSource === "live"
              ? "BasePaint art is live-fetched. Stripe, Supabase, and Printful remain stubbed."
              : "Using fallback demo data. Stripe, Supabase, and Printful remain stubbed."}{" "}
            Selected size: {selectedSize}.
          </p>
        </aside>
      </section>
    </main>
  );
}
