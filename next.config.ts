import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["heic-convert", "heic-decode", "libheif-js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
