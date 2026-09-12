import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Two lockfiles exist (repo root + this app); without this Next picks the wrong one.
  turbopack: { root: import.meta.dirname },
  devIndicators: false,
  output: "export",
  basePath: "/shop",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASEPATH: "/shop",
  },
};

export default nextConfig;
