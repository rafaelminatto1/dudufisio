import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignora warnings do ESLint durante o build para permitir compilação
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite warnings de TypeScript durante o build
    ignoreBuildErrors: false,
  },
  experimental: {
    // Otimizações para desenvolvimento
    optimizePackageImports: ['@/components', '@/lib'],
  },
};

export default nextConfig;
