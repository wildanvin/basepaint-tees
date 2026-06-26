import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BasePaint Tees",
  description: "One daily collectible T-shirt for the current BasePaint artwork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
