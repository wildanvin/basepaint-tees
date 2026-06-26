import type { NextConfig } from "next";

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
    ],
  },
};

export default nextConfig;
