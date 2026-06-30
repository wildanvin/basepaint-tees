"use client";

import Image from "next/image";
import { type MouseEvent, type PointerEvent, useMemo, useState } from "react";
import type { DemoProduct } from "@/lib/demo-product";

type Slide = {
  label: string;
  src?: string;
  alt: string;
  fallbackSide?: "front" | "back";
  key: string;
};

function displayLabel(label: string, cameraLabel?: string) {
  const value = (cameraLabel ?? label).toLowerCase();

  if (value.includes("person-7-back") || value.includes("person 7 back")) {
    return "Back view";
  }

  if (value.includes("person-2") || value.includes("person 2")) {
    return "On body";
  }

  if (value.includes("person-3") || value.includes("person 3")) {
    return "Styled";
  }

  if (value.includes("duo")) {
    return "Together";
  }

  if (value.includes("size-chart") || value.includes("size chart")) {
    return "Size chart";
  }

  return label;
}

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
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const slides = useMemo<Slide[]>(
    () => [
      ...(product.mockups?.map((mockup) => ({
        label: displayLabel(mockup.label, mockup.cameraLabel),
        src: mockup.src,
        alt: `${product.name} ${displayLabel(mockup.label, mockup.cameraLabel).toLowerCase()} view`,
        fallbackSide: displayLabel(mockup.label, mockup.cameraLabel).toLowerCase().includes("back")
          ? ("back" as const)
          : ("front" as const),
        key: mockup.cameraLabel ?? mockup.label,
      })) ?? []),
      ...(!product.mockups?.length
        ? [
            {
              label: "Front",
              src: product.mockupFrontUrl,
              alt: `${product.name} front view`,
              fallbackSide: "front" as const,
              key: "front",
            },
            {
              label: "Back",
              src: product.mockupBackUrl,
              alt: `${product.name} back view`,
              fallbackSide: "back" as const,
              key: "back",
            },
          ]
        : []),
    ],
    [product.mockupBackUrl, product.mockupFrontUrl, product.mockups, product.name],
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

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      return;
    }

    setSwipeStartX(event.clientX);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (swipeStartX === null) {
      return;
    }

    const deltaX = event.clientX - swipeStartX;
    setSwipeStartX(null);

    if (Math.abs(deltaX) < 45) {
      return;
    }

    goTo(activeIndex + (deltaX < 0 ? 1 : -1));
  }

  return (
    <section className="overflow-hidden border border-[#171717] bg-[#f7f4ee] shadow-[8px_8px_0_#171717]">
      <div className="flex items-center justify-between border-b border-[#171717]/15 bg-white px-4 py-3 text-[#171717]">
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          {activeSlide.label}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#696969]">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      <div
        className="relative min-h-[560px] touch-pan-y overflow-hidden"
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={updateZoomPosition}
        onPointerCancel={() => setSwipeStartX(null)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="flex h-[560px] transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              className="relative min-w-full cursor-zoom-in select-none bg-[#f7f4ee]"
              key={slide.key}
            >
              {slide.src ? (
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={activeIndex === 0}
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-contain p-5 sm:p-8"
                />
              ) : (
                <FallbackMockup product={product} side={slide.fallbackSide ?? "front"} />
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
          aria-label="Previous product view"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#171717]/20 bg-white/85 text-2xl text-[#171717] shadow-sm"
          onClick={() => goTo(activeIndex - 1)}
          type="button"
        >
          ‹
        </button>
        <button
          aria-label="Next product view"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#171717]/20 bg-white/85 text-2xl text-[#171717] shadow-sm"
          onClick={() => goTo(activeIndex + 1)}
          type="button"
        >
          ›
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#171717]/15 bg-white px-4 py-3">
        {slides.map((slide, index) => (
          <button
            aria-label={`Show ${slide.label.toLowerCase()} view`}
            className={`min-h-8 border border-[#171717]/40 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${
              activeIndex === index
                ? "bg-[#171717] text-white"
                : "bg-transparent text-[#171717]"
            }`}
            key={slide.key}
            onClick={() => goTo(index)}
            type="button"
          >
            {slide.label}
          </button>
        ))}
      </div>
    </section>
  );
}
