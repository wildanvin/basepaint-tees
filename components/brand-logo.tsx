import Link from "next/link";

type BrandLogoProps = {
  tone?: "light" | "dark";
};

export function BrandLogo({ tone = "dark" }: BrandLogoProps) {
  const isDark = tone === "dark";

  return (
    <Link
      className={`group inline-flex items-center gap-3 font-mono text-sm font-black uppercase tracking-[0.18em] ${
        isDark ? "text-white" : "text-[#171717]"
      }`}
      href="/"
    >
      <span
        aria-hidden="true"
        className={`relative grid size-8 place-items-center border ${
          isDark ? "border-white/25 bg-[#090a0c]" : "border-[#171717] bg-[#171717]"
        }`}
      >
        <span className="absolute left-1 top-1 h-1 w-4 bg-[#41c7ff]" />
        <span className="absolute bottom-1 right-1 h-1 w-4 bg-[#1d4ed8]" />
        <span className="text-base leading-none text-white">B</span>
      </span>
      <span className="leading-none">BasePaint Tees</span>
    </Link>
  );
}
