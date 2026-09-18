import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["heic-to"],
  experimental: {
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
