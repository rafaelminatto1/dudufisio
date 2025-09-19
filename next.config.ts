import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignora warnings do ESLint durante o build para permitir compilação
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Acelera build ignorando erros de TypeScript em desenvolvimento
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  experimental: {
    // Otimizações para desenvolvimento
    optimizePackageImports: ['@/components', '@/lib'],
  },
};

export default nextConfig;
