import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/mission",
        destination: "/about",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
