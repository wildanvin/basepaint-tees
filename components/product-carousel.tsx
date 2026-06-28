"use client";

import Image from "next/image";
import { type MouseEvent, useMemo, useState } from "react";
import type { DemoProduct } from "@/lib/demo-product";

type Slide = {
  label: "Front" | "Back";
  src?: string;
  alt: string;
};

function FallbackMockup({ product, side }: { product: DemoProduct; side: "front" | "back" }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#111111] px-8 pt-10">
      <div className="relative h-[440px] w-[300px]">
        <div className="absolute left-1/2 top-0 h-20 w-32 -translate-x-1/2 rounded-b-[48px] border border-white/20 bg-[#050505]" />
        <div className="absolute left-1/2 top-12 h-[390px] w-[250px] -translate-x-1/2 rounded-t-[46px] border border-white/15 bg-[#0b0b0b] shadow-2xl" />
        <div className="absolute left-0 top-20 h-48 w-24 -rotate-12 rounded-[34px] border border-white/10 bg-[#090909]" />
        <div className="absolute right-0 top-20 h-48 w-24 rotate-12 rounded-[34px] border border-white/10 bg-[#090909]" />
        <div className="absolute left-1/2 top-24 w-[190px] -translate-x-1/2 text-center text-white">
          {side === "front" ? (
            <div className="ml-auto w-28 text-right">
              {product.frontPrintText.map((line) => (
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  key={line}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCarousel({ product }: { product: DemoProduct }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const slides = useMemo<Slide[]>(
    () => [
      {
        label: "Front",
        src: product.mockupFrontUrl,
        alt: `${product.name} front mockup`,
      },
      {
        label: "Back",
        src: product.mockupBackUrl,
        alt: `${product.name} back mockup`,
      },
    ],
    [product.mockupBackUrl, product.mockupFrontUrl, product.name],
  );
  const activeSlide = slides[activeIndex];

  function goTo(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  function updateZoomPosition(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }

  return (
    <section className="overflow-hidden border border-[#171717] bg-[#f7f4ee] shadow-[8px_8px_0_#171717]">
      <div className="flex items-center justify-between border-b border-[#171717]/15 bg-white px-4 py-3 text-[#171717]">
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          {activeSlide.label} mockup
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
          {product.shirtColor}
        </span>
      </div>

      <div
        className="relative min-h-[560px] touch-pan-y overflow-hidden"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={updateZoomPosition}
      >
        <div
          className="flex h-[560px] transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div className="relative min-w-full cursor-zoom-in bg-[#f7f4ee]" key={slide.label}>
              {slide.src ? (
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={slide.label === "Front"}
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-contain p-5 sm:p-8"
                />
              ) : (
                <FallbackMockup product={product} side={slide.label.toLowerCase() as "front" | "back"} />
              )}
            </div>
          ))}
        </div>

        {activeSlide.src ? (
          <div
            className={`pointer-events-none absolute inset-0 hidden bg-[#f7f4ee] transition-opacity duration-150 lg:block ${
              isZooming ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={activeSlide.src}
              alt=""
              fill
              sizes="1800px"
              className="object-contain"
              style={{
                padding: "2rem",
                transform: "scale(2.35)",
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              Move cursor to inspect
            </div>
          </div>
        ) : null}

        <button
          aria-label="Previous mockup"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#171717]/20 bg-white/85 text-2xl text-[#171717] shadow-sm"
          onClick={() => goTo(activeIndex - 1)}
          type="button"
        >
          ‹
        </button>
        <button
          aria-label="Next mockup"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#171717]/20 bg-white/85 text-2xl text-[#171717] shadow-sm"
          onClick={() => goTo(activeIndex + 1)}
          type="button"
        >
          ›
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-[#171717]/15 bg-white px-4 py-3">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show ${slide.label.toLowerCase()} mockup`}
            className={`h-2.5 w-10 border border-[#171717]/40 ${
              activeIndex === index ? "bg-[#171717]" : "bg-transparent"
            }`}
            key={slide.label}
            onClick={() => goTo(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
