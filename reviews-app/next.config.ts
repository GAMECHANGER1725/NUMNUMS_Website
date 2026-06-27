import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  basePath: "/review",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASEPATH: "/review",
  },
};

export default nextConfig;
