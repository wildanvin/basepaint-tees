import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "basepaint.net",
        pathname: "/v3/**",
      },
      {
        protocol: "https",
        hostname: "basepaint.xyz",
        pathname: "/api/art/**",
      },
      {
        protocol: "https",
        hostname: "images-api.printify.com",
        pathname: "/mockup/**",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
