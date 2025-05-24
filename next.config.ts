import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    // It's recommended to fix these errors.
    ignoreDuringBuilds: true,
  },

  // If you also have TypeScript errors stopping the build (separate from ESLint):
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    // It's strongly recommended to fix these.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
