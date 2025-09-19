import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Configurações de produção mais rigorosas
  eslint: {
    // Permitir warnings durante o build
    ignoreDuringBuilds: false,
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  
  // Configurações de runtime
  reactStrictMode: true, // Habilitar React Strict Mode
  poweredByHeader: false, // Remover header X-Powered-By
  
  // Compressão
  compress: true,
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
