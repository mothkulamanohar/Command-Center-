import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  experimental: {
    // Optimize icon, charts, and date utility imports for instant load times and small bundle sizes
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/utilities",
    ],
  },
};

export default nextConfig;
