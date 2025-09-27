// web/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbopack: true,
  },

  // Se você usa next/image com domínios externos, adicione aqui
  images: {
    remotePatterns: [],
  },

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Evita erro de build se a env não estiver setada ou for inválida
    if (!apiBase || !/^https?:\/\//i.test(apiBase)) {
      console.warn(
        '[next.config.js] NEXT_PUBLIC_API_BASE_URL ausente/inválida; pulando rewrite /api -> backend.'
      );
      return [];
    }

    // Remove barras à direita para evitar `//:path*`
    const destBase = apiBase.replace(/\/+$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${destBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
