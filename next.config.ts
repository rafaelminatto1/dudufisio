import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações de produção mais rigorosas
  eslint: {
    // Em produção, falhar build em caso de warnings
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    // Em produção, falhar build em caso de erros
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Otimizações de performance
  experimental: {
    // Otimizações para desenvolvimento
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // Otimizações de imagem
  images: {
    domains: ['localhost', 'fisioflow.com.br'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ];
  },
  
  // Configurações de build
  productionBrowserSourceMaps: false, // Desabilitar source maps em produção
  swcMinify: true, // Usar SWC para minificação (mais rápido)
  
  // Configurações de runtime
  reactStrictMode: true, // Habilitar React Strict Mode
  poweredByHeader: false, // Remover header X-Powered-By
  
  // Compressão
  compress: true,
};

export default nextConfig;
