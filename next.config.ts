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
    // Acelera compilação
    turbo: {
      // Configurações do Turbopack para acelerar builds
      experimental: true,
    },
  },
  // Configurações de cache
  onDemandEntries: {
    // Período de cache de páginas (5 minutos)
    maxInactiveAge: 5 * 60 * 1000,
    // Páginas para manter no cache
    pagesBufferLength: 5,
  },
};

export default nextConfig;
