const nextConfig = {
  eslint: {
    // Só ignora ESLint durante builds não-produtivos
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
  typescript: {
    // Acelera build ignorando erros de TypeScript em desenvolvimento
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // experimental: {},
};

export default nextConfig;
